<?php

namespace App\Tests\Security\Jwt;

use App\Entity\User;
use App\Security\Jwt\JwtRevocationStore;
use PHPUnit\Framework\TestCase;
use Psr\Cache\CacheItemInterface;
use Psr\Cache\CacheItemPoolInterface;

final class JwtRevocationStoreTest extends TestCase
{
    private function createCacheItem(bool $isHit, mixed $value = null): CacheItemInterface
    {
        $item = $this->createMock(CacheItemInterface::class);
        $item->method('isHit')->willReturn($isHit);
        $item->method('get')->willReturn($value);
        $item->method('set')->willReturnSelf();

        return $item;
    }

    public function testGetOrCreateUserTokenNonceReturnsExistingNonce(): void
    {
        $user = new User();
        $item = $this->createCacheItem(true, 'existing-nonce');

        $cache = $this->createMock(CacheItemPoolInterface::class);
        $cache->method('getItem')->willReturn($item);
        $cache->expects($this->never())->method('save');

        $store = new JwtRevocationStore($cache);
        $result = $store->getOrCreateUserTokenNonce($user);

        $this->assertSame('existing-nonce', $result);
    }

    public function testGetOrCreateUserTokenNonceCreatesNewNonceWhenNotHit(): void
    {
        $user = new User();
        $item = $this->createCacheItem(false);
        $item->expects($this->once())->method('set');

        $cache = $this->createMock(CacheItemPoolInterface::class);
        $cache->method('getItem')->willReturn($item);
        $cache->expects($this->once())->method('save');

        $store = new JwtRevocationStore($cache);
        $result = $store->getOrCreateUserTokenNonce($user);

        $this->assertIsString($result);
        $this->assertNotEmpty($result);
    }

    public function testGetOrCreateUserTokenNonceCreatesNewNonceWhenHitButEmpty(): void
    {
        $user = new User();
        $item = $this->createCacheItem(true, '');
        $item->expects($this->once())->method('set');

        $cache = $this->createMock(CacheItemPoolInterface::class);
        $cache->method('getItem')->willReturn($item);
        $cache->expects($this->once())->method('save');

        $store = new JwtRevocationStore($cache);
        $result = $store->getOrCreateUserTokenNonce($user);

        $this->assertIsString($result);
        $this->assertNotEmpty($result);
    }

    public function testGetOrCreateReturnsNullOnCacheException(): void
    {
        $user = new User();

        $cache = $this->createMock(CacheItemPoolInterface::class);
        $cache->method('getItem')->willThrowException(new \RuntimeException('cache error'));

        $store = new JwtRevocationStore($cache);
        $result = $store->getOrCreateUserTokenNonce($user);

        $this->assertNull($result);
    }

    public function testRotateUserTokenNonceReturnsNewNonce(): void
    {
        $user = new User();
        $item = $this->createCacheItem(false);
        $item->expects($this->once())->method('set');

        $cache = $this->createMock(CacheItemPoolInterface::class);
        $cache->method('getItem')->willReturn($item);
        $cache->expects($this->once())->method('save');

        $store = new JwtRevocationStore($cache);
        $result = $store->rotateUserTokenNonce($user);

        $this->assertIsString($result);
        $this->assertNotEmpty($result);
    }

    public function testRotateUserTokenNonceReturnsNullOnException(): void
    {
        $user = new User();

        $cache = $this->createMock(CacheItemPoolInterface::class);
        $cache->method('getItem')->willThrowException(new \RuntimeException('error'));

        $store = new JwtRevocationStore($cache);
        $result = $store->rotateUserTokenNonce($user);

        $this->assertNull($result);
    }

    public function testGetUserTokenNonceReturnsNonceWhenHit(): void
    {
        $user = new User();
        $item = $this->createCacheItem(true, 'stored-nonce');

        $cache = $this->createMock(CacheItemPoolInterface::class);
        $cache->method('getItem')->willReturn($item);

        $store = new JwtRevocationStore($cache);
        $result = $store->getUserTokenNonce($user);

        $this->assertSame('stored-nonce', $result);
    }

    public function testGetUserTokenNonceReturnsNullWhenNotHit(): void
    {
        $user = new User();
        $item = $this->createCacheItem(false);

        $cache = $this->createMock(CacheItemPoolInterface::class);
        $cache->method('getItem')->willReturn($item);

        $store = new JwtRevocationStore($cache);
        $result = $store->getUserTokenNonce($user);

        $this->assertNull($result);
    }

    public function testGetUserTokenNonceReturnsNullWhenValueIsEmpty(): void
    {
        $user = new User();
        $item = $this->createCacheItem(true, '');

        $cache = $this->createMock(CacheItemPoolInterface::class);
        $cache->method('getItem')->willReturn($item);

        $store = new JwtRevocationStore($cache);
        $result = $store->getUserTokenNonce($user);

        $this->assertNull($result);
    }

    public function testGetUserTokenNonceReturnsNullOnException(): void
    {
        $user = new User();

        $cache = $this->createMock(CacheItemPoolInterface::class);
        $cache->method('getItem')->willThrowException(new \RuntimeException('error'));

        $store = new JwtRevocationStore($cache);
        $result = $store->getUserTokenNonce($user);

        $this->assertNull($result);
    }
}
