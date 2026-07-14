<?php

namespace App\Security\Jwt;

use App\Entity\User;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class JwtRevocationStore
{
    private RedisJwtClient $redis;

    public function __construct(
        #[Autowire('%env(REDIS_URL)%')]
        string $redisUrl,
        ?RedisJwtClient $redis = null,
    ) {
        if ($redis instanceof RedisJwtClient) {
            $this->redis = $redis;

            return;
        }

        try {
            $this->redis = new RedisJwtClient($redisUrl);
        } catch (\Throwable $exception) {
            throw new JwtRevocationUnavailableException('Unable to initialize Redis revocation store.', 0, $exception);
        }
    }

    public function getOrCreateUserTokenNonce(User $user): string
    {
        try {
            $value = $this->redis->get($this->nonceKey($user));
            if (\is_string($value) && '' !== $value) {
                return $value;
            }

            $nonce = bin2hex(random_bytes(16));
            $this->redis->set($this->nonceKey($user), $nonce);

            return $nonce;
        } catch (\Throwable $exception) {
            throw new JwtRevocationUnavailableException('Unable to read or create JWT token nonce.', 0, $exception);
        }
    }

    public function rotateUserTokenNonce(User $user): string
    {
        try {
            $nonce = bin2hex(random_bytes(16));
            $this->redis->set($this->nonceKey($user), $nonce);

            return $nonce;
        } catch (\Throwable $exception) {
            throw new JwtRevocationUnavailableException('Unable to rotate JWT token nonce.', 0, $exception);
        }
    }

    public function getUserTokenNonce(User $user): ?string
    {
        try {
            $value = $this->redis->get($this->nonceKey($user));

            return \is_string($value) && '' !== $value ? $value : null;
        } catch (\Throwable $exception) {
            throw new JwtRevocationUnavailableException('Unable to read JWT token nonce.', 0, $exception);
        }
    }

    public function revokeTokenId(string $tokenId, int $expiresAt): void
    {
        $ttl = $expiresAt - time();
        if ($ttl <= 0) {
            return;
        }

        try {
            $this->redis->setex($this->blacklistKey($tokenId), $ttl, '1');
        } catch (\Throwable $exception) {
            throw new JwtRevocationUnavailableException('Unable to revoke JWT token.', 0, $exception);
        }
    }

    public function isTokenIdRevoked(string $tokenId): bool
    {
        try {
            return 1 === (int) $this->redis->exists($this->blacklistKey($tokenId));
        } catch (\Throwable $exception) {
            throw new JwtRevocationUnavailableException('Unable to verify JWT revocation status.', 0, $exception);
        }
    }

    private function nonceKey(User $user): string
    {
        return sprintf('jwt:nonce:user:%d', (int) $user->getId());
    }

    private function blacklistKey(string $tokenId): string
    {
        return sprintf('jwt:blacklist:jti:%s', $tokenId);
    }
}
