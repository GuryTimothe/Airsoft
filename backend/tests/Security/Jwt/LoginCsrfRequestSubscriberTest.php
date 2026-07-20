<?php

declare(strict_types=1);

namespace App\Tests\Security\Jwt;

use App\Security\Jwt\LoginCsrfManager;
use App\Security\Jwt\LoginCsrfRequestSubscriber;
use App\Security\Jwt\RedisJwtClient;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;

final class LoginCsrfRequestSubscriberTest extends TestCase
{
    public function testRejectsProtectedApiPostWithoutValidCsrfToken(): void
    {
        $redis = $this->createMock(RedisJwtClient::class);
        $redis->expects($this->never())->method('exists');

        $subscriber = new LoginCsrfRequestSubscriber(new LoginCsrfManager(120, 'redis://unused', $redis));
        $event      = new RequestEvent(
            $this->createMock(HttpKernelInterface::class),
            Request::create('/api/games', 'POST'),
            HttpKernelInterface::MAIN_REQUEST,
        );

        $subscriber->onKernelRequest($event);

        $response = $event->getResponse();
        $this->assertNotNull($response);
        $this->assertSame(403, $response->getStatusCode());
        $this->assertJsonStringEqualsJsonString(
            '{"message":"Requête invalide."}',
            (string) $response->getContent(),
        );
    }

    public function testAcceptsProtectedApiPostWhenCsrfTokenIsValid(): void
    {
        $redis = $this->createMock(RedisJwtClient::class);
        $redis
            ->expects($this->once())
            ->method('exists')
            ->with(sprintf('jwt:csrf:login:%s', hash('sha256', 'csrf-token')))
            ->willReturn(1);

        $subscriber = new LoginCsrfRequestSubscriber(new LoginCsrfManager(120, 'redis://unused', $redis));
        $request    = Request::create('/api/games', 'POST');
        $request->headers->set(LoginCsrfManager::CSRF_HEADER_NAME, 'csrf-token');
        $event = new RequestEvent(
            $this->createMock(HttpKernelInterface::class),
            $request,
            HttpKernelInterface::MAIN_REQUEST,
        );

        $subscriber->onKernelRequest($event);

        $this->assertNull($event->getResponse());
    }

    public function testSkipsBearerAuthenticatedRequests(): void
    {
        $redis = $this->createMock(RedisJwtClient::class);
        $redis->expects($this->never())->method('exists');

        $subscriber = new LoginCsrfRequestSubscriber(new LoginCsrfManager(120, 'redis://unused', $redis));
        $request    = Request::create('/api/games', 'POST');
        $request->headers->set('Authorization', 'Bearer jwt-token');
        $event = new RequestEvent(
            $this->createMock(HttpKernelInterface::class),
            $request,
            HttpKernelInterface::MAIN_REQUEST,
        );

        $subscriber->onKernelRequest($event);

        $this->assertNull($event->getResponse());
    }

    public function testSkipsExemptRoutes(): void
    {
        $redis = $this->createMock(RedisJwtClient::class);
        $redis->expects($this->never())->method('exists');

        $subscriber = new LoginCsrfRequestSubscriber(new LoginCsrfManager(120, 'redis://unused', $redis));
        $event      = new RequestEvent(
            $this->createMock(HttpKernelInterface::class),
            Request::create('/api/register', 'POST'),
            HttpKernelInterface::MAIN_REQUEST,
        );

        $subscriber->onKernelRequest($event);

        $this->assertNull($event->getResponse());
    }
}