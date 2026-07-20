<?php

declare(strict_types=1);

namespace App\Tests\Security\Jwt;

use App\Security\Jwt\LoginCsrfManager;
use App\Security\Jwt\RedisJwtClient;
use PHPUnit\Framework\TestCase;

final class LoginCsrfManagerTest extends TestCase
{
    public function testGenerateTokenStoresHashedTokenWithConfiguredTtl(): void
    {
        $redis       = $this->createMock(RedisJwtClient::class);
        $capturedKey = null;

        $redis
            ->expects($this->once())
            ->method('setex')
            ->with(
                $this->callback(static function (string $key) use (&$capturedKey): bool {
                    $capturedKey = $key;

                    return str_starts_with($key, 'jwt:csrf:login:');
                }),
                120,
                '1'
            );

        $manager = new LoginCsrfManager(120, 'redis://unused', $redis);

        $token = $manager->generateToken();

        $this->assertSame(64, strlen($token));
        $this->assertSame(
            sprintf('jwt:csrf:login:%s', hash('sha256', $token)),
            $capturedKey,
        );
    }

    public function testGenerateTokenFallsBackToDefaultTtlWhenConfiguredValueIsInvalid(): void
    {
        $redis = $this->createMock(RedisJwtClient::class);

        $redis
            ->expects($this->once())
            ->method('setex')
            ->with(
                $this->callback(static fn (mixed $key): bool => \is_string($key) && '' !== $key),
                600,
                '1'
            );

        $manager = new LoginCsrfManager(0, 'redis://unused', $redis);

        $manager->generateToken();
    }

    public function testConsumeTokenReturnsFalseForMissingToken(): void
    {
        $redis = $this->createMock(RedisJwtClient::class);
        $redis->expects($this->never())->method('exists');

        $manager = new LoginCsrfManager(120, 'redis://unused', $redis);

        $this->assertFalse($manager->consumeToken(null));
        $this->assertFalse($manager->consumeToken('   '));
    }

    public function testConsumeTokenReturnsFalseWhenTokenIsUnknown(): void
    {
        $redis = $this->createMock(RedisJwtClient::class);

        $redis
            ->expects($this->once())
            ->method('exists')
            ->with(sprintf('jwt:csrf:login:%s', hash('sha256', 'known-token')))
            ->willReturn(0);

        $manager = new LoginCsrfManager(120, 'redis://unused', $redis);

        $this->assertFalse($manager->consumeToken(' known-token '));
    }

    public function testConsumeTokenReturnsTrueWhenTokenExists(): void
    {
        $redis = $this->createMock(RedisJwtClient::class);

        $redis
            ->expects($this->once())
            ->method('exists')
            ->with(sprintf('jwt:csrf:login:%s', hash('sha256', 'known-token')))
            ->willReturn(1);

        $manager = new LoginCsrfManager(120, 'redis://unused', $redis);

        $this->assertTrue($manager->consumeToken('known-token'));
    }
}