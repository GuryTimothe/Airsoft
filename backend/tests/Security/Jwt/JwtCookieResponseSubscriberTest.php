<?php

declare(strict_types=1);

namespace App\Tests\Security\Jwt;

use App\Security\Jwt\JwtCookieManager;
use App\Security\Jwt\JwtCookieResponseSubscriber;
use App\Security\Jwt\JwtRevocationStore;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;

final class JwtCookieResponseSubscriberTest extends TestCase
{
    public function testClearsCookieOnSuccessfulSelfDelete(): void
    {
        $jwtCookieManager = new JwtCookieManager();
        $revocationStore  = $this->createMock(JwtRevocationStore::class);
        $subscriber       = new JwtCookieResponseSubscriber(
            $jwtCookieManager,
            ['/api/me/email', '/api/me/password'],
            $revocationStore,
        );

        $request = Request::create('/api/me', 'DELETE');
        $response = new Response('', Response::HTTP_NO_CONTENT);

        $kernel = $this->createMock(HttpKernelInterface::class);
        $event  = new ResponseEvent($kernel, $request, HttpKernelInterface::MAIN_REQUEST, $response);

        $subscriber->onKernelResponse($event);

        $cookies = $response->headers->getCookies();
        $this->assertCount(1, $cookies);
        $this->assertSame(JwtCookieManager::AUTH_COOKIE_NAME, $cookies[0]->getName());
        $this->assertSame('', $cookies[0]->getValue());
        $this->assertLessThan(time(), $cookies[0]->getExpiresTime());
    }
}
