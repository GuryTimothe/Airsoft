<?php

namespace App\Security\Jwt;

use App\Entity\User;
use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTDecodedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

final class TokenVersionSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private UserRepository $userRepository,
        private JwtRevocationStore $jwtRevocationStore,
        #[Autowire('%kernel.secret%')]
        private string $appSecret,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            Events::JWT_CREATED => 'onJwtCreated',
            Events::JWT_DECODED => 'onJwtDecoded',
        ];
    }

    public function onJwtCreated(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();
        if (!$user instanceof User) {
            return;
        }

        $payload            = $event->getData();
        $payload['jti']     = bin2hex(random_bytes(16));
        $payload['pwd_sig'] = $this->computePasswordSignature($user);
        try {
            $payload['tok_nce'] = $this->jwtRevocationStore->getOrCreateUserTokenNonce($user);
        } catch (JwtRevocationUnavailableException $exception) {
            throw new ServiceUnavailableHttpException(null, 'Redis is required to issue JWT tokens.', $exception);
        }

        $event->setData($payload);
    }

    public function onJwtDecoded(JWTDecodedEvent $event): void
    {
        $payload = $event->getPayload();

        $tokenId = $payload['jti'] ?? null;
        if (!\is_string($tokenId) || '' === $tokenId) {
            $event->markAsInvalid();

            return;
        }

        try {
            if ($this->jwtRevocationStore->isTokenIdRevoked($tokenId)) {
                $event->markAsInvalid();

                return;
            }
        } catch (JwtRevocationUnavailableException $exception) {
            throw new ServiceUnavailableHttpException(null, 'Redis is required to validate JWT tokens.', $exception);
        }

        $identifier = $payload['username'] ?? null;
        if (!\is_string($identifier) || '' === $identifier) {
            $event->markAsInvalid();

            return;
        }

        $tokenNonce = $payload['tok_nce'] ?? null;

        $user = $this->userRepository->findOneBy(['email' => $identifier]);
        if (!$user instanceof User) {
            $event->markAsInvalid();

            return;
        }

        $passwordSignature = $payload['pwd_sig'] ?? null;
        if (!\is_string($passwordSignature) || '' === $passwordSignature) {
            $event->markAsInvalid();

            return;
        }

        if (!hash_equals($this->computePasswordSignature($user), $passwordSignature)) {
            $event->markAsInvalid();

            return;
        }

        try {
            $currentNonce = $this->jwtRevocationStore->getUserTokenNonce($user);
        } catch (JwtRevocationUnavailableException $exception) {
            throw new ServiceUnavailableHttpException(null, 'Redis is required to validate JWT tokens.', $exception);
        }

        if (null !== $currentNonce) {
            if (!\is_string($tokenNonce) || '' === $tokenNonce) {
                $event->markAsInvalid();

                return;
            }

            if (!hash_equals($currentNonce, $tokenNonce)) {
                $event->markAsInvalid();

                return;
            }
        }
    }

    private function computePasswordSignature(User $user): string
    {
        return hash_hmac('sha256', $user->getPassword(), $this->appSecret);
    }
}
