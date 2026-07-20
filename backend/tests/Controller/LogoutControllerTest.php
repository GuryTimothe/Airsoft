<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Controller\LogoutController;
use App\Security\Jwt\JwtCookieManager;
use App\Security\Jwt\JwtRevocationStore;
use App\Security\Jwt\JwtRevocationUnavailableException;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

final class LogoutControllerTest extends TestCase
{
    public function testLogoutWithoutTokenOnlyClearsCookie(): void
    {
        $store   = $this->createMock(JwtRevocationStore::class);
        $logger  = $this->createMock(LoggerInterface::class);

        $store->expects($this->never())->method('revokeTokenId');
        $store->expects($this->never())->method('revokeTokenActivity');
        $logger->expects($this->never())->method('warning');
        $logger->expects($this->never())->method('info');

        $controller = $this->createController($store, new JwtCookieManager(), $logger);

        $response = $controller->__invoke(Request::create('/api/logout', 'POST'));

        $this->assertSame(204, $response->getStatusCode());
        $this->assertSame('', ($response->headers->getCookies()[0] ?? null)?->getValue());
    }

    public function testLogoutWithMalformedPayloadRevokesActivityAndLogsWarning(): void
    {
        $token   = $this->createJwt(['jti' => 'token-123']);
        $store   = $this->createMock(JwtRevocationStore::class);
        $logger  = $this->createMock(LoggerInterface::class);

        $store->expects($this->never())->method('revokeTokenId');
        $store->expects($this->once())->method('revokeTokenActivity')->with('token-123');

        $logger
            ->expects($this->once())
            ->method('warning')
            ->with(
                'Security logout received malformed token payload.',
                $this->callback(static function (array $context): bool {
                    return 'SEC.JWT.INVALID_TOKEN' === ($context['event_id'] ?? null)
                        && 'MALFORMED_TOKEN_PAYLOAD' === ($context['reason_code'] ?? null)
                        && 204 === ($context['http_status'] ?? null);
                })
            );

        $controller = $this->createController($store, new JwtCookieManager(), $logger);

        $response = $controller->__invoke(Request::create('/api/logout', 'POST', [], [
            JwtCookieManager::AUTH_COOKIE_NAME => $token,
        ]));

        $this->assertSame(204, $response->getStatusCode());
    }

    public function testLogoutWithValidPayloadRevokesTokenAndLogsInfo(): void
    {
        $exp     = time() + 3600;
        $token   = $this->createJwt(['jti' => 'token-123', 'exp' => $exp]);
        $store   = $this->createMock(JwtRevocationStore::class);
        $logger  = $this->createMock(LoggerInterface::class);

        $store->expects($this->once())->method('revokeTokenId')->with('token-123', $exp);
        $store->expects($this->once())->method('revokeTokenActivity')->with('token-123');

        $logger
            ->expects($this->once())
            ->method('info')
            ->with(
                'Security JWT token revoked on logout.',
                $this->callback(static function (array $context): bool {
                    return 'SEC.JWT.TOKEN_REVOKED' === ($context['event_id'] ?? null)
                        && 'LOGOUT_TOKEN_REVOKED' === ($context['reason_code'] ?? null)
                        && 204 === ($context['http_status'] ?? null);
                })
            );

        $controller = $this->createController($store, new JwtCookieManager(), $logger);

        $response = $controller->__invoke(Request::create('/api/logout', 'POST', [], [
            JwtCookieManager::AUTH_COOKIE_NAME => $token,
        ]));

        $this->assertSame(204, $response->getStatusCode());
    }

    public function testLogoutThrowsServiceUnavailableWhenRevocationStoreFails(): void
    {
        $exp     = time() + 3600;
        $token   = $this->createJwt(['jti' => 'token-123', 'exp' => $exp]);
        $store   = $this->createMock(JwtRevocationStore::class);
        $logger  = $this->createMock(LoggerInterface::class);

        $store
            ->expects($this->once())
            ->method('revokeTokenId')
            ->with('token-123', $exp)
            ->willThrowException(new JwtRevocationUnavailableException('Redis down'));

        $logger
            ->expects($this->once())
            ->method('error')
            ->with(
                'Security JWT revocation failed on logout.',
                $this->callback(static function (array $context): bool {
                    return 'SEC.JWT.REVOCATION_ERROR' === ($context['event_id'] ?? null)
                        && 'REVOCATION_STORE_UNAVAILABLE' === ($context['reason_code'] ?? null)
                        && 503 === ($context['http_status'] ?? null);
                })
            );

        $controller = $this->createController($store, new JwtCookieManager(), $logger);

        $this->expectException(ServiceUnavailableHttpException::class);
        $this->expectExceptionMessage('Redis is required to revoke JWT tokens.');

        $controller->__invoke(Request::create('/api/logout', 'POST', [], [
            JwtCookieManager::AUTH_COOKIE_NAME => $token,
        ]));
    }

    private function createController(
        JwtRevocationStore $store,
        JwtCookieManager $cookies,
        LoggerInterface $logger,
    ): LogoutController {
        return new LogoutController(
            $store,
            $cookies,
            $logger,
            'test',
            'app-secret',
        );
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function createJwt(array $payload): string
    {
        $header = rtrim(strtr(base64_encode('{"alg":"HS256","typ":"JWT"}'), '+/', '-_'), '=');
        $body   = rtrim(strtr(base64_encode((string) json_encode($payload, JSON_THROW_ON_ERROR)), '+/', '-_'), '=');

        return sprintf('%s.%s.signature', $header, $body);
    }
}