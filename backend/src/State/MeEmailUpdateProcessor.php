<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Dto\MeEmailUpdateInput;
use App\Dto\MeUpdateOutput;
use App\Entity\EmailVerificationToken;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;

/**
 * @implements ProcessorInterface<MeEmailUpdateInput, MeUpdateOutput>
 */
class MeEmailUpdateProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private JWTTokenManagerInterface $jwtManager,
        private Security $security,
        private UserRepository $userRepository,
        private MailerInterface $mailer,
        #[Autowire('%env(MAILER_FROM)%')]
        private string $mailerFrom,
        #[Autowire('%env(FRONTEND_URL)%')]
        private string $frontendUrl,
        #[Autowire(service: 'monolog.logger.security')]
        private LoggerInterface $logger,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {

        $previousData = $context['previous_data'] ?? null;
        if (null !== $previousData && !$previousData instanceof User) {
            throw new \InvalidArgumentException('Previous user state is invalid.');
        }

        $targetUser = $this->resolveTargetUser($previousData);

        $currentPassword = $data->currentPassword;

        if (!\is_string($currentPassword) || '' === trim($currentPassword)) {
            throw new ValidationException(new ConstraintViolationList([
                new ConstraintViolation(
                    'Le mot de passe actuel est requis.',
                    null,
                    [],
                    null,
                    'currentPassword',
                    $currentPassword,
                ),
            ]));
        }

        if (!$this->passwordHasher->isPasswordValid($targetUser, $currentPassword)) {
            throw new ValidationException(new ConstraintViolationList([
                new ConstraintViolation(
                    'Le mot de passe actuel est incorrect.',
                    null,
                    [],
                    null,
                    'currentPassword',
                    null,
                ),
            ]));
        }

        if (!\is_string($data->email) || '' === trim($data->email)) {
            throw new ValidationException(new ConstraintViolationList([
                new ConstraintViolation(
                    'L\'email est requis.',
                    null,
                    [],
                    null,
                    'email',
                    $data->email,
                ),
            ]));
        }

        $newEmail = trim($data->email);
        if ($targetUser->getEmail() === $newEmail) {
            throw new ValidationException(new ConstraintViolationList([
                new ConstraintViolation('La nouvelle adresse e-mail doit être différente.', null, [], null, 'email', $data->email),
            ]));
        }

        $existingUser = $this->userRepository->findOneBy(['email' => $newEmail]);
        if ($existingUser instanceof User && $existingUser !== $targetUser) {
            throw new ValidationException(new ConstraintViolationList([
                new ConstraintViolation('Un compte avec cet email existe deja.', null, [], null, 'email', $data->email),
            ]));
        }

        try {
            $this->entityManager->createQuery('DELETE FROM App\\Entity\\EmailVerificationToken token WHERE token.user = :user AND token.pendingEmail IS NOT NULL')
                ->setParameter('user', $targetUser)
                ->execute();

            $plainToken = bin2hex(random_bytes(32));
            $this->entityManager->persist(new EmailVerificationToken(
                $targetUser,
                hash('sha256', $plainToken),
                new \DateTimeImmutable('+24 hours'),
                $newEmail,
            ));
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            throw new ValidationException(new ConstraintViolationList([
                new ConstraintViolation(
                    'Un compte avec cet email existe deja.',
                    null,
                    [],
                    null,
                    'email',
                    $data->email,
                ),
            ]));
        }

        $url = sprintf('%s/auth/validation-email?token=%s', rtrim($this->frontendUrl, '/'), rawurlencode($plainToken));
        try {
            $this->mailer->send(
                (new Email())
                    ->from($this->mailerFrom)
                    ->to($newEmail)
                    ->subject('Validez votre nouvelle adresse e-mail')
                    ->text(sprintf("Bonjour %s,\n\nPour confirmer votre nouvelle adresse e-mail, ouvrez ce lien :\n%s\n\nCe lien expire dans 24 heures.", $targetUser->getFirstname(), $url))
                    ->html(sprintf('<p>Bonjour %s,</p><p>Pour confirmer votre nouvelle adresse e-mail, <a href="%s">validez votre adresse e-mail</a>.</p><p>Ce lien expire dans 24 heures.</p>', htmlspecialchars($targetUser->getFirstname(), ENT_QUOTES), htmlspecialchars($url, ENT_QUOTES))),
            );
        } catch (\Throwable $exception) {
            $this->logger->error('Email change verification delivery failed.', [
                'event_id'  => 'SEC.AUTH.EMAIL_CHANGE_VERIFICATION_FAILED',
                'exception' => $exception,
            ]);
        }

        return new MeUpdateOutput($targetUser, $this->jwtManager->create($targetUser));
    }

    private function resolveTargetUser(?User $previousData): User
    {
        if ($previousData instanceof User) {
            return $previousData;
        }

        $actor = $this->security->getUser();
        if ($actor instanceof User) {
            return $actor;
        }

        throw new \InvalidArgumentException('Unable to resolve target user for email update.');
    }
}
