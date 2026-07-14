<?php

namespace App\Tests\Security\Jwt;

use App\Entity\User;
use App\Security\Jwt\RedisJwtClient;
use App\Security\Jwt\JwtRevocationStore;
use App\Security\Jwt\JwtRevocationUnavailableException;
use PHPUnit\Framework\TestCase;

final class JwtRevocationStoreTest extends TestCase
{
    private function createUserWithId(int $id): User
    {
        $user = new User();

        $reflection = new \ReflectionProperty(User::class, 'id');
        $reflection->setAccessible(true);
        $reflection->setValue($user, $id);

        return $user;
    }

    public function testGetOrCreateUserTokenNonceReturnsExistingNonce(): void
    {
        $user = $this->createUserWithId(42);
        $redis = $this->createMock(RedisJwtClient::class);
        $redis->expects($this->once())
            ->method('get')
            ->with('jwt:nonce:user:42')
            ->willReturn('existing-nonce');
        $redis->expects($this->never())->method('set');

        $store = new JwtRevocationStore('redis://localhost:6379', $redis);

        $this->assertSame('existing-nonce', $store->getOrCreateUserTokenNonce($user));
    }

    public function testGetOrCreateUserTokenNonceCreatesNewNonceWhenMissing(): void
    {
        $user = $this->createUserWithId(42);
        $redis = $this->createMock(RedisJwtClient::class);
        $redis->expects($this->once())
            ->method('get')
            ->with('jwt:nonce:user:42')
            ->willReturn(null);
        $redis->expects($this->once())
            ->method('set')
            ->with(
                'jwt:nonce:user:42',
                $this->callback(static fn ($value): bool => \is_string($value) && '' !== $value),
            );

        $store = new JwtRevocationStore('redis://localhost:6379', $redis);
        $result = $store->getOrCreateUserTokenNonce($user);

        $this->assertIsString($result);
        $this->assertNotSame('', $result);
    }

    public function testGetOrCreateThrowsOnRedisException(): void
    {
        $user = $this->createUserWithId(42);
        $redis = $this->createMock(RedisJwtClient::class);
        $redis->method('get')->willThrowException(new \RuntimeException('redis down'));

        $store = new JwtRevocationStore('redis://localhost:6379', $redis);

        $this->expectException(JwtRevocationUnavailableException::class);
        $store->getOrCreateUserTokenNonce($user);
    }

    public function testRotateUserTokenNonceReturnsNewNonce(): void
    {
        $user = $this->createUserWithId(7);
        $redis = $this->createMock(RedisJwtClient::class);
        $redis->expects($this->once())
            ->method('set')
            ->with(
                'jwt:nonce:user:7',
                $this->callback(static fn ($value): bool => \is_string($value) && '' !== $value),
            );

        $store = new JwtRevocationStore('redis://localhost:6379', $redis);
        $result = $store->rotateUserTokenNonce($user);

        $this->assertIsString($result);
        $this->assertNotSame('', $result);
    }

    public function testRotateUserTokenNonceThrowsOnException(): void
    {
        $user = $this->createUserWithId(7);
        $redis = $this->createMock(RedisJwtClient::class);
        $redis->method('set')->willThrowException(new \RuntimeException('redis down'));

        $store = new JwtRevocationStore('redis://localhost:6379', $redis);

        $this->expectException(JwtRevocationUnavailableException::class);
        $store->rotateUserTokenNonce($user);
    }

    public function testGetUserTokenNonceReturnsNonceWhenPresent(): void
    {
        $user = $this->createUserWithId(3);
        $redis = $this->createMock(RedisJwtClient::class);
        $redis->expects($this->once())
            ->method('get')
            ->with('jwt:nonce:user:3')
            ->willReturn('stored-nonce');

        $store = new JwtRevocationStore('redis://localhost:6379', $redis);

        $this->assertSame('stored-nonce', $store->getUserTokenNonce($user));
    }

    public function testGetUserTokenNonceReturnsNullWhenValueIsInvalid(): void
    {
        $user = $this->createUserWithId(3);
        $redis = $this->createMock(RedisJwtClient::class);
        $redis->expects($this->exactly(2))
            ->method('get')
            ->with('jwt:nonce:user:3')
            ->willReturnOnConsecutiveCalls('', null);

        $store = new JwtRevocationStore('redis://localhost:6379', $redis);

        $this->assertNull($store->getUserTokenNonce($user));
        $this->assertNull($store->getUserTokenNonce($user));
    }

    public function testGetUserTokenNonceThrowsOnException(): void
    {
        $user = $this->createUserWithId(3);
        $redis = $this->createMock(RedisJwtClient::class);
        $redis->method('get')->willThrowException(new \RuntimeException('redis down'));

        $store = new JwtRevocationStore('redis://localhost:6379', $redis);

        $this->expectException(JwtRevocationUnavailableException::class);
        $store->getUserTokenNonce($user);
    }

    public function testRevokeTokenIdStoresBlacklistWithTtl(): void
    {
        $redis = $this->createMock(RedisJwtClient::class);
        $expiresAt = time() + 60;

        $redis->expects($this->once())
            ->method('setex')
            ->with(
                'jwt:blacklist:jti:token-id',
                $this->callback(static fn (int $ttl): bool => $ttl > 0 && $ttl <= 60),
                '1',
            );

        $store = new JwtRevocationStore('redis://localhost:6379', $redis);
        $store->revokeTokenId('token-id', $expiresAt);
    }

    public function testRevokeTokenIdSkipsExpiredTokens(): void
    {
        $redis = $this->createMock(RedisJwtClient::class);
        $redis->expects($this->never())->method('setex');

        $store = new JwtRevocationStore('redis://localhost:6379', $redis);
        $store->revokeTokenId('token-id', time() - 1);
    }

    public function testIsTokenIdRevokedReturnsBoolean(): void
    {
        $redis = $this->createMock(RedisJwtClient::class);
        $redis->expects($this->exactly(2))
            ->method('exists')
            ->with('jwt:blacklist:jti:token-id')
            ->willReturnOnConsecutiveCalls(1, 0);

        $store = new JwtRevocationStore('redis://localhost:6379', $redis);

        $this->assertTrue($store->isTokenIdRevoked('token-id'));
        $this->assertFalse($store->isTokenIdRevoked('token-id'));
    }
}
