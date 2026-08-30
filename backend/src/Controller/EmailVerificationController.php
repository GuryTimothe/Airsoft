<?php

namespace App\Controller;

use App\Entity\EmailVerificationToken;
use App\Security\Jwt\JwtCookieManager;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class EmailVerificationController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly JWTTokenManagerInterface $jwtManager,
        private readonly JwtCookieManager $jwtCookieManager,
    ) {
    }

    #[Route('/api/email-verification/confirm', methods: ['POST'])]
    public function confirm(Request $request): JsonResponse
    {
        try {
            $payload = $request->toArray();
        } catch (\Throwable) {
            $payload = [];
        }

        $token = $payload['token'] ?? null;
        if (!is_string($token) || '' === trim($token)) {
            return new JsonResponse(['message' => 'Ce lien de validation est invalide ou expire.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $verificationToken = $this->entityManager->getRepository(EmailVerificationToken::class)->findOneBy([
            'tokenHash' => hash('sha256', trim($token)),
        ]);
        if (!$verificationToken instanceof EmailVerificationToken || !$verificationToken->isUsable(new \DateTimeImmutable())) {
            return new JsonResponse(['message' => 'Ce lien de validation est invalide ou expire.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $user         = $verificationToken->getUser();
        $pendingEmail = $verificationToken->getPendingEmail();
        if (null !== $pendingEmail) {
            $user->setEmail($pendingEmail);
        } else {
            $user->setEmailVerified(true);
        }
        $verificationToken->markAsUsed();
        $this->entityManager->flush();

        if (null === $pendingEmail) {
            return new JsonResponse(['message' => 'Votre adresse e-mail est validée.']);
        }

        $jwt      = $this->jwtManager->create($user);
        $response = new JsonResponse([
            'message' => 'Votre nouvelle adresse e-mail est validée.',
            'token'   => $jwt,
        ]);
        $this->jwtCookieManager->addTokenCookie($response, $jwt, $request->isSecure());

        return $response;
    }
}
