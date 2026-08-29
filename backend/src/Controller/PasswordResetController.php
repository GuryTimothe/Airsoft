<?php

namespace App\Controller;

use App\Entity\PasswordResetToken;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\Jwt\JwtCookieManager;
use App\Security\Jwt\JwtRevocationStore;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

final class PasswordResetController extends AbstractController
{
    private const GENERIC_REQUEST_MESSAGE = 'Si un compte correspond a cette adresse, un e-mail de reinitialisation vient d\'etre envoye.';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserRepository $userRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly JwtRevocationStore $jwtRevocationStore,
        private readonly JWTTokenManagerInterface $jwtManager,
        private readonly JwtCookieManager $jwtCookieManager,
        private readonly Security $security,
        private readonly MailerInterface $mailer,
        #[Autowire(service: 'monolog.logger.security')]
        private readonly LoggerInterface $logger,
        #[Autowire('%env(MAILER_FROM)%')]
        private readonly string $mailerFrom,
        #[Autowire('%env(FRONTEND_URL)%')]
        private readonly string $frontendUrl,
    ) {
    }

    #[Route('/api/password-reset/request', methods: ['POST'])]
    public function requestReset(Request $request): JsonResponse
    {
        $email = $this->readString($request, 'email');
        if (null === $email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->genericRequestResponse();
        }

        $user = $this->userRepository->findOneBy(['email' => strtolower(trim($email))]);
        if (!$user instanceof User) {
            return $this->genericRequestResponse();
        }

        $this->sendResetLink($user, false);

        return $this->genericRequestResponse();
    }

    #[Route('/api/me/password-reset/request', methods: ['POST'])]
    public function requestResetFromAuthenticatedSession(): JsonResponse
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            return new JsonResponse(['message' => 'Authentification requise.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $this->sendResetLink($user, true);

        return $this->genericRequestResponse();
    }

    private function sendResetLink(User $user, bool $renewSession): void
    {

        $this->entityManager->createQuery('DELETE FROM App\\Entity\\PasswordResetToken token WHERE token.user = :user')
            ->setParameter('user', $user)
            ->execute();

        $plainToken = bin2hex(random_bytes(32));
        $token      = new PasswordResetToken(
            $user,
            hash('sha256', $plainToken),
            new \DateTimeImmutable('+1 hour'),
            $renewSession,
        );
        $this->entityManager->persist($token);
        $this->entityManager->flush();

        $url = sprintf('%s/auth/reset-password?token=%s', rtrim($this->frontendUrl, '/'), rawurlencode($plainToken));

        try {
            $this->mailer->send(
                (new Email())
                    ->from($this->mailerFrom)
                    ->to($user->getEmail())
                    ->subject('Reinitialisation de votre mot de passe')
                    ->text(sprintf("Bonjour %s,\n\nPour choisir un nouveau mot de passe, ouvrez ce lien dans l'heure :\n%s\n\nSi vous n'avez pas fait cette demande, vous pouvez ignorer cet e-mail.", $user->getFirstname(), $url))
                    ->html(sprintf('<p>Bonjour %s,</p><p><a href="%s">Choisir un nouveau mot de passe</a></p><p>Ce lien expire dans une heure. Si vous n\'avez pas fait cette demande, vous pouvez ignorer cet e-mail.</p>', htmlspecialchars($user->getFirstname(), ENT_QUOTES), htmlspecialchars($url, ENT_QUOTES))),
            );
        } catch (\Throwable $exception) {
            $this->logger->error('Password reset email delivery failed.', [
                'event_id'  => 'SEC.AUTH.PASSWORD_RESET_EMAIL_FAILED',
                'exception' => $exception,
            ]);
        }

    }

    #[Route('/api/password-reset/confirm', methods: ['POST'])]
    public function confirmReset(Request $request): JsonResponse
    {
        $token    = $this->readString($request, 'token');
        $password = $this->readString($request, 'password');

        if (null === $token || null === $password || !$this->isValidPassword($password)) {
            return new JsonResponse(['message' => 'La demande de reinitialisation est invalide.'], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        $resetToken = $this->entityManager->getRepository(PasswordResetToken::class)->findOneBy([
            'tokenHash' => hash('sha256', $token),
        ]);
        if (!$resetToken instanceof PasswordResetToken || !$resetToken->isUsable(new \DateTimeImmutable())) {
            return new JsonResponse(['message' => 'Ce lien de reinitialisation est invalide ou expire.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $user = $resetToken->getUser();
        $user->setPassword($this->passwordHasher->hashPassword($user, $password));
        $resetToken->markAsUsed();
        $this->jwtRevocationStore->rotateUserTokenNonce($user);
        $this->entityManager->flush();

        if (!$resetToken->shouldRenewSession()) {
            return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
        }

        $jwt      = $this->jwtManager->create($user);
        $response = new JsonResponse(['token' => $jwt]);
        $this->jwtCookieManager->addTokenCookie($response, $jwt, $request->isSecure());

        return $response;
    }

    private function genericRequestResponse(): JsonResponse
    {
        return new JsonResponse(['message' => self::GENERIC_REQUEST_MESSAGE], JsonResponse::HTTP_ACCEPTED);
    }

    private function readString(Request $request, string $key): ?string
    {
        try {
            $value = $request->toArray()[$key] ?? null;
        } catch (\Throwable) {
            return null;
        }

        return is_string($value) ? trim($value) : null;
    }

    private function isValidPassword(string $password): bool
    {
        return strlen($password) >= 12
            && 1 === preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/', $password);
    }
}
