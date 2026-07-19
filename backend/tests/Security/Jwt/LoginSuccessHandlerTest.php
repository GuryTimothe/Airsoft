<?php

declare(strict_types=1);

namespace App\Tests\Security\Jwt;

use App\Security\Jwt\JwtCookieManager;
use App\Security\Jwt\LoginSuccessHandler;
use Lexik\Bundle\JWTAuthenticationBundle\Security\Http\Authentication\AuthenticationSuccessHandler;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;

final class LoginSuccessHandlerTest extends TestCase
{
    public function testAddsCookieWhenInnerHandlerReturnsJwtPayload(): void
    {
        $token    = $this->createJwt(['exp' => time() + 3600]);
        $response = new JsonResponse(['token' => $token]);
        $inner    = $this->createMock(AuthenticationSuccessHandler::class);

        $inner
            ->expects($this->once())
            ->method('onAuthenticationSuccess')
            ->willReturn($response);

        $handler = new LoginSuccessHandler($inner, new JwtCookieManager());
        $request = Request::create('/api/login', 'POST', [], [], [], ['HTTPS' => 'on']);

        $returnedResponse = $handler->onAuthenticationSuccess(
            $request,
            $this->createMock(TokenInterface::class),
        );

        $this->assertSame($response, $returnedResponse);
        $cookies = $response->headers->getCookies();
        $this->assertCount(1, $cookies);
        $this->assertSame($token, $cookies[0]->getValue());
        $this->assertTrue($cookies[0]->isSecure());
    }

    public function testDoesNotAddCookieWhenPayloadDoesNotContainToken(): void
    {
        $response = new JsonResponse(['message' => 'ok']);
        $inner    = $this->createMock(AuthenticationSuccessHandler::class);

        $inner
            ->expects($this->once())
            ->method('onAuthenticationSuccess')
            ->willReturn($response);

        $handler = new LoginSuccessHandler($inner, new JwtCookieManager());

        $handler->onAuthenticationSuccess(
            Request::create('/api/login', 'POST'),
            $this->createMock(TokenInterface::class),
        );

        $this->assertCount(0, $response->headers->getCookies());
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