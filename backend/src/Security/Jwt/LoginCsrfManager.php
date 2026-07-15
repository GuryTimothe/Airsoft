<?php

declare(strict_types=1);

namespace App\Security\Jwt;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

final class LoginCsrfManager
{
    public const CSRF_HEADER_NAME = 'X-CSRF-Token';

    private const DEFAULT_TTL = 600;

    private RedisJwtClient $redis;

    public function __construct(
        #[Autowire('%env(int:LOGIN_CSRF_TOKEN_TTL)%')]
        private readonly int $tokenLifetime,
        #[Autowire('%env(REDIS_URL)%')]
        string $redisUrl,
        ?RedisJwtClient $redis = null,
    ) {
        if ($redis instanceof RedisJwtClient) {
            $this->redis = $redis;

            return;
        }

        $this->redis = new RedisJwtClient($redisUrl);
    }

    public function generateToken(): string
    {
        $token = bin2hex(random_bytes(32));
        $ttl   = $this->tokenLifetime > 0 ? $this->tokenLifetime : self::DEFAULT_TTL;

        $this->redis->setex($this->csrfKey($token), $ttl, '1');

        return $token;
    }

    public function consumeToken(?string $headerToken): bool
    {
        if (!\is_string($headerToken) || '' === trim($headerToken)) {
            return false;
        }

        $token = trim($headerToken);
        $key   = $this->csrfKey($token);

        if (1 !== $this->redis->exists($key)) {
            return false;
        }

        return true;
    }

    private function csrfKey(string $token): string
    {
        return sprintf('jwt:csrf:login:%s', hash('sha256', $token));
    }
}
