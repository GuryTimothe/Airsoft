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
        #[Autowire('%env(JWT_ISSUER)%')]
        private string $jwtIssuer,
        #[Autowire('%env(JWT_AUDIENCE)%')]
        private string $jwtAudience,
        #[Autowire('%env(int:JWT_INACTIVITY_TIMEOUT)%')]
        private int $jwtInactivityTimeout,
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
        $payload['iss']     = $this->jwtIssuer;
        $payload['aud']     = $this->jwtAudience;
        try {
            $payload['tok_nce'] = $this->jwtRevocationStore->getOrCreateUserTokenNonce($user);
            $this->jwtRevocationStore->touchTokenActivity($payload['jti'], $this->jwtInactivityTimeout);
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

        try {
            if (!$this->jwtRevocationStore->isTokenActivityActive($tokenId)) {
                $event->markAsInvalid();

                return;
            }
        } catch (JwtRevocationUnavailableException $exception) {
            throw new ServiceUnavailableHttpException(null, 'Redis is required to validate JWT tokens.', $exception);
        }

        if (!$this->isValidIssuer($payload['iss'] ?? null)) {
            $event->markAsInvalid();

            return;
        }

        if (!$this->isValidAudience($payload['aud'] ?? null)) {
            $event->markAsInvalid();

            return;
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

        try {
            $this->jwtRevocationStore->touchTokenActivity($tokenId, $this->jwtInactivityTimeout);
        } catch (JwtRevocationUnavailableException $exception) {
            throw new ServiceUnavailableHttpException(null, 'Redis is required to validate JWT tokens.', $exception);
        }
    }

    private function computePasswordSignature(User $user): string
    {
        return hash_hmac('sha256', $user->getPassword(), $this->appSecret);
    }

    private function isValidIssuer(mixed $issuer): bool
    {
        return \is_string($issuer) && '' !== $issuer && hash_equals($this->jwtIssuer, $issuer);
    }

    private function isValidAudience(mixed $audience): bool
    {
        if (\is_string($audience)) {
            return '' !== $audience && hash_equals($this->jwtAudience, $audience);
        }

        if (!\is_array($audience)) {
            return false;
        }

        foreach ($audience as $candidate) {
            if (\is_string($candidate) && '' !== $candidate && hash_equals($this->jwtAudience, $candidate)) {
                return true;
            }
        }

        return false;
    }
}
