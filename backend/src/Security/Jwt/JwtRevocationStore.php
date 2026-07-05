<?php

namespace App\Security\Jwt;

use App\Entity\User;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class JwtRevocationStore
{
    public function __construct(
        #[Autowire(service: 'cache.app')]
        private CacheItemPoolInterface $cache,
    ) {
    }

    public function getOrCreateUserTokenNonce(User $user): ?string
    {
        try {
            $item = $this->cache->getItem($this->nonceKey($user));
            if ($item->isHit()) {
                $value = $item->get();
                if (\is_string($value) && '' !== $value) {
                    return $value;
                }
            }

            $nonce = bin2hex(random_bytes(16));
            $item->set($nonce);
            $this->cache->save($item);

            return $nonce;
        } catch (\Throwable) {
            return null;
        }
    }

    public function rotateUserTokenNonce(User $user): ?string
    {
        try {
            $nonce = bin2hex(random_bytes(16));
            $item  = $this->cache->getItem($this->nonceKey($user));
            $item->set($nonce);
            $this->cache->save($item);

            return $nonce;
        } catch (\Throwable) {
            return null;
        }
    }

    public function getUserTokenNonce(User $user): ?string
    {
        try {
            $item = $this->cache->getItem($this->nonceKey($user));
            if (!$item->isHit()) {
                return null;
            }

            $value = $item->get();

            return \is_string($value) && '' !== $value ? $value : null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function nonceKey(User $user): string
    {
        return sprintf('jwt:nonce:user:%d', (int) $user->getId());
    }
}
