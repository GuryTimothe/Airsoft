<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Controller\LoginCsrfTokenController;
use App\Security\Jwt\LoginCsrfManager;
use App\Security\Jwt\RedisJwtClient;
use PHPUnit\Framework\TestCase;

final class LoginCsrfTokenControllerTest extends TestCase
{
    public function testInvokeReturnsGeneratedTokenInJsonPayload(): void
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

        $manager = new LoginCsrfManager(600, 'redis://unused', $redis);

        $controller = new LoginCsrfTokenController($manager);

        $response = $controller->__invoke();
        $payload  = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertIsArray($payload);
        $this->assertSame(64, strlen((string) ($payload['csrfToken'] ?? '')));
    }
}