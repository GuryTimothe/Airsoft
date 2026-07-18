<?php

namespace App\Security\Jwt;

use App\Entity\User;
use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTDecodedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

final class TokenVersionSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private UserRepository $userRepository,
        private JwtRevocationStore $jwtRevocationStore,
        #[Autowire(service: 'monolog.logger.security')]
        private LoggerInterface $logger,
        #[Autowire('%kernel.secret%')]
        private string $appSecret,
        #[Autowire('%kernel.environment%')]
        private string $environment,
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
            $this->logger->error('Security JWT revocation store unavailable during token issuance.', [
                'event_id' => 'SEC.JWT.REVOCATION_ERROR',
                'event_category' => 'token_security',
                'severity' => 'ERROR',
                'outcome' => 'failure',
                'action' => 'token_issue',
                'service' => 'backend-api',
                'environment' => $this->environment,
                'actor_type' => 'user',
                'actor_id_hash' => $this->hashUserId($user),
                'reason_code' => 'REVOCATION_STORE_UNAVAILABLE',
                'message' => 'JWT issuance requires revocation store availability.',
            ]);

            throw new ServiceUnavailableHttpException(null, 'Redis is required to issue JWT tokens.', $exception);
        }

        $event->setData($payload);
    }

    public function onJwtDecoded(JWTDecodedEvent $event): void
    {
        $payload = $event->getPayload();

        $tokenId = $payload['jti'] ?? null;
        if (!\is_string($tokenId) || '' === $tokenId) {
            $this->markInvalid($event, 'MISSING_JTI', $payload);

            return;
        }

        try {
            if ($this->jwtRevocationStore->isTokenIdRevoked($tokenId)) {
                $this->markInvalid($event, 'REVOKED_JTI', $payload);

                return;
            }
        } catch (JwtRevocationUnavailableException $exception) {
            $this->logger->error('Security JWT revocation store unavailable during token validation.', [
                'event_id' => 'SEC.JWT.REVOCATION_ERROR',
                'event_category' => 'token_security',
                'severity' => 'ERROR',
                'outcome' => 'failure',
                'action' => 'token_validate',
                'service' => 'backend-api',
                'environment' => $this->environment,
                'actor_type' => 'anonymous',
                'reason_code' => 'REVOCATION_CHECK_FAILED',
                'message' => 'JWT revocation check failed because the store is unavailable.',
            ]);

            throw new ServiceUnavailableHttpException(null, 'Redis is required to validate JWT tokens.', $exception);
        }

        try {
            if (!$this->jwtRevocationStore->isTokenActivityActive($tokenId)) {
                $this->markInvalid($event, 'INACTIVITY_TIMEOUT', $payload);

                return;
            }
        } catch (JwtRevocationUnavailableException $exception) {
            $this->logger->error('Security JWT activity store unavailable during token validation.', [
                'event_id' => 'SEC.JWT.REVOCATION_ERROR',
                'event_category' => 'token_security',
                'severity' => 'ERROR',
                'outcome' => 'failure',
                'action' => 'token_validate',
                'service' => 'backend-api',
                'environment' => $this->environment,
                'actor_type' => 'anonymous',
                'reason_code' => 'ACTIVITY_CHECK_FAILED',
                'message' => 'JWT activity check failed because the store is unavailable.',
            ]);

            throw new ServiceUnavailableHttpException(null, 'Redis is required to validate JWT tokens.', $exception);
        }

        if (!$this->isValidIssuer($payload['iss'] ?? null)) {
            $this->markInvalid($event, 'INVALID_ISSUER', $payload);

            return;
        }

        if (!$this->isValidAudience($payload['aud'] ?? null)) {
            $this->markInvalid($event, 'INVALID_AUDIENCE', $payload);

            return;
        }

        $identifier = $payload['username'] ?? null;
        if (!\is_string($identifier) || '' === $identifier) {
            $this->markInvalid($event, 'MISSING_IDENTIFIER', $payload);

            return;
        }

        $tokenNonce = $payload['tok_nce'] ?? null;

        $user = $this->userRepository->findOneBy(['email' => $identifier]);
        if (!$user instanceof User) {
            $this->markInvalid($event, 'UNKNOWN_USER', $payload);

            return;
        }

        $passwordSignature = $payload['pwd_sig'] ?? null;
        if (!\is_string($passwordSignature) || '' === $passwordSignature) {
            $this->markInvalid($event, 'MISSING_PASSWORD_SIGNATURE', $payload);

            return;
        }

        if (!hash_equals($this->computePasswordSignature($user), $passwordSignature)) {
            $this->markInvalid($event, 'PASSWORD_SIGNATURE_MISMATCH', $payload);

            return;
        }

        try {
            $currentNonce = $this->jwtRevocationStore->getUserTokenNonce($user);
        } catch (JwtRevocationUnavailableException $exception) {
            $this->logger->error('Security JWT nonce lookup failed.', [
                'event_id' => 'SEC.JWT.REVOCATION_ERROR',
                'event_category' => 'token_security',
                'severity' => 'ERROR',
                'outcome' => 'failure',
                'action' => 'token_validate',
                'service' => 'backend-api',
                'environment' => $this->environment,
                'actor_type' => 'user',
                'actor_id_hash' => $this->hashUserId($user),
                'reason_code' => 'NONCE_LOOKUP_FAILED',
                'message' => 'JWT nonce lookup failed because the store is unavailable.',
            ]);

            throw new ServiceUnavailableHttpException(null, 'Redis is required to validate JWT tokens.', $exception);
        }

        if (null !== $currentNonce) {
            if (!\is_string($tokenNonce) || '' === $tokenNonce) {
                $this->markInvalid($event, 'MISSING_TOKEN_NONCE', $payload);

                return;
            }

            if (!hash_equals($currentNonce, $tokenNonce)) {
                $this->markInvalid($event, 'TOKEN_NONCE_MISMATCH', $payload);

                return;
            }
        }

        try {
            $this->jwtRevocationStore->touchTokenActivity($tokenId, $this->jwtInactivityTimeout);
        } catch (JwtRevocationUnavailableException $exception) {
            $this->logger->error('Security JWT activity touch failed.', [
                'event_id' => 'SEC.JWT.REVOCATION_ERROR',
                'event_category' => 'token_security',
                'severity' => 'ERROR',
                'outcome' => 'failure',
                'action' => 'token_validate',
                'service' => 'backend-api',
                'environment' => $this->environment,
                'actor_type' => 'user',
                'actor_id_hash' => $this->hashUserId($user),
                'reason_code' => 'ACTIVITY_TOUCH_FAILED',
                'message' => 'JWT activity update failed because the store is unavailable.',
            ]);

            throw new ServiceUnavailableHttpException(null, 'Redis is required to validate JWT tokens.', $exception);
        }
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function markInvalid(JWTDecodedEvent $event, string $reasonCode, array $payload): void
    {
        $event->markAsInvalid();

        $tokenId = $payload['jti'] ?? null;
        $tokenHash = null;
        if (\is_string($tokenId) && '' !== $tokenId) {
            $tokenHash = hash_hmac('sha256', sprintf('jti:%s', $tokenId), $this->appSecret);
        }

        $this->logger->warning('Security JWT token invalidated.', [
            'event_id' => 'SEC.JWT.INVALID_TOKEN',
            'event_category' => 'token_security',
            'severity' => 'WARNING',
            'outcome' => 'blocked',
            'action' => 'token_validate',
            'service' => 'backend-api',
            'environment' => $this->environment,
            'actor_type' => 'anonymous',
            'token_id_hash' => $tokenHash,
            'reason_code' => $reasonCode,
            'message' => 'JWT token rejected during validation.',
        ]);
    }

    private function hashUserId(User $user): ?string
    {
        $id = $user->getId();
        if (null === $id) {
            return null;
        }

        return hash_hmac('sha256', sprintf('user:%d', $id), $this->appSecret);
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
