<?php

declare(strict_types=1);

namespace App\Tests\Security\Jwt;

use App\Security\Jwt\JwtCookieManager;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class JwtCookieManagerTest extends TestCase
{
    public function testAddTokenCookieUsesJwtExpirationWhenAvailable(): void
    {
        $manager  = new JwtCookieManager();
        $response = new Response();
        $token    = $this->createJwt(['exp' => time() + 3600]);

        $manager->addTokenCookie($response, $token, true);

        $cookie = $response->headers->getCookies()[0] ?? null;

        $this->assertNotNull($cookie);
        $this->assertSame(JwtCookieManager::AUTH_COOKIE_NAME, $cookie->getName());
        $this->assertSame($token, $cookie->getValue());
        $this->assertTrue($cookie->isSecure());
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertSame('lax', strtolower((string) $cookie->getSameSite()));
    }

    public function testAddClearingCookieCreatesExpiredCookie(): void
    {
        $manager  = new JwtCookieManager();
        $response = new Response();

        $manager->addClearingCookie($response, false);

        $cookie = $response->headers->getCookies()[0] ?? null;

        $this->assertNotNull($cookie);
        $this->assertSame(JwtCookieManager::AUTH_COOKIE_NAME, $cookie->getName());
        $this->assertSame('', $cookie->getValue());
        $this->assertFalse($cookie->isSecure());
        $this->assertLessThan(time(), $cookie->getExpiresTime());
    }

    public function testExtractTokenPrefersCookieTokenOverAuthorizationHeader(): void
    {
        $manager = new JwtCookieManager();
        $request = Request::create('/api/me', 'GET', [], [
            JwtCookieManager::AUTH_COOKIE_NAME => 'cookie-token',
        ]);
        $request->headers->set('Authorization', 'Bearer bearer-token');

        $this->assertSame('cookie-token', $manager->extractTokenFromRequest($request));
    }

    public function testExtractTokenFallsBackToBearerAuthorizationHeader(): void
    {
        $manager = new JwtCookieManager();
        $request = Request::create('/api/me', 'GET');
        $request->headers->set('Authorization', 'Bearer bearer-token');

        $this->assertSame('bearer-token', $manager->extractTokenFromRequest($request));
    }

    public function testExtractTokenReturnsNullWhenNoTokenIsPresent(): void
    {
        $manager = new JwtCookieManager();
        $request = Request::create('/api/me', 'GET');

        $this->assertNull($manager->extractTokenFromRequest($request));
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