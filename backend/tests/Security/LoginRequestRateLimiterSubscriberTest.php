<?php

declare(strict_types=1);

namespace App\Tests\Security;

use App\Security\LoginRequestRateLimiterSubscriber;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\RateLimiter\Storage\InMemoryStorage;

final class LoginRequestRateLimiterSubscriberTest extends TestCase
{
    public function testAllowsNonPostRequestsWithoutConsumingLimiter(): void
    {
        $storage      = new InMemoryStorage();
        $loginFactory = $this->createFixedWindowFactory('login', 1, $storage);
        $registerFactory = $this->createFixedWindowFactory('register', 1, $storage);

        $subscriber = $this->createSubscriber(
            $loginFactory,
            $registerFactory,
            $this->createFixedWindowFactory('reset-request', 5, $storage),
            $this->createFixedWindowFactory('reset-confirm', 5, $storage),
        );
        $event      = $this->createRequestEvent(Request::create('/api/login', 'GET'));

        $subscriber->onKernelRequest($event);

        $this->assertNull($event->getResponse());
        $this->assertTrue($loginFactory->create('127.0.0.1')->consume(1)->isAccepted());
    }

    public function testAllowsLoginRequestWhenRateLimitIsAvailable(): void
    {
        $storage         = new InMemoryStorage();
        $loginFactory    = $this->createFixedWindowFactory('login', 2, $storage);
        $registerFactory = $this->createFixedWindowFactory('register', 1, $storage);

        $subscriber = $this->createSubscriber(
            $loginFactory,
            $registerFactory,
            $this->createFixedWindowFactory('reset-request', 5, $storage),
            $this->createFixedWindowFactory('reset-confirm', 5, $storage),
        );
        $request    = Request::create('/api/login', 'POST', [], [], [], ['REMOTE_ADDR' => '203.0.113.10']);

        $event = $this->createRequestEvent($request);
        $subscriber->onKernelRequest($event);

        $this->assertNull($event->getResponse());
    }

    public function testRejectsLoginRequestWhenRateLimitIsExceeded(): void
    {
        $storage         = new InMemoryStorage();
        $loginFactory    = $this->createFixedWindowFactory('login', 1, $storage);
        $registerFactory = $this->createFixedWindowFactory('register', 1, $storage);

        $loginFactory->create('203.0.113.10')->consume(1);

        $subscriber = $this->createSubscriber(
            $loginFactory,
            $registerFactory,
            $this->createFixedWindowFactory('reset-request', 5, $storage),
            $this->createFixedWindowFactory('reset-confirm', 5, $storage),
        );
        $request    = Request::create('/api/login', 'POST', [], [], [], ['REMOTE_ADDR' => '203.0.113.10']);

        $event = $this->createRequestEvent($request);
        $subscriber->onKernelRequest($event);

        $response = $event->getResponse();
        $this->assertNotNull($response);
        $this->assertSame(429, $response->getStatusCode());
        $this->assertSame('Too many login attempts. Please try again in 5 minutes.', json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)['message']);
        $this->assertNotEmpty($response->headers->get('Retry-After'));
    }

    public function testRejectsRegisterRequestWhenRateLimitIsExceeded(): void
    {
        $storage         = new InMemoryStorage();
        $loginFactory    = $this->createFixedWindowFactory('login', 1, $storage);
        $registerFactory = $this->createFixedWindowFactory('register', 1, $storage);

        $registerFactory->create('203.0.113.11')->consume(1);

        $subscriber = $this->createSubscriber(
            $loginFactory,
            $registerFactory,
            $this->createFixedWindowFactory('reset-request', 5, $storage),
            $this->createFixedWindowFactory('reset-confirm', 5, $storage),
        );
        $request    = Request::create('/api/register', 'POST', [], [], [], ['REMOTE_ADDR' => '203.0.113.11']);

        $event = $this->createRequestEvent($request);
        $subscriber->onKernelRequest($event);

        $response = $event->getResponse();
        $this->assertNotNull($response);
        $this->assertSame(429, $response->getStatusCode());
        $payload = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame(429, $payload['code']);
        $this->assertSame('Too many registration attempts. Please try again in 5 minutes.', $payload['message']);
    }

    public function testRejectsPasswordResetRequestWhenRateLimitIsExceeded(): void
    {
        $storage      = new InMemoryStorage();
        $resetFactory = $this->createFixedWindowFactory('reset-request', 1, $storage);

        $resetFactory->create('203.0.113.10')->consume(1);

        $subscriber = $this->createSubscriber(
            $this->createFixedWindowFactory('login', 5, $storage),
            $this->createFixedWindowFactory('register', 5, $storage),
            $resetFactory,
            $this->createFixedWindowFactory('reset-confirm', 5, $storage),
        );
        $request = Request::create('/api/password-reset/request', 'POST', [], [], [], ['REMOTE_ADDR' => '203.0.113.10']);

        $event = $this->createRequestEvent($request);
        $subscriber->onKernelRequest($event);

        $response = $event->getResponse();
        $this->assertNotNull($response);
        $this->assertSame(429, $response->getStatusCode());
        $this->assertTrue($response->headers->has('Retry-After'));
    }

    public function testTheAuthenticatedResetEntryPointSharesTheSameLimiter(): void
    {
        $storage      = new InMemoryStorage();
        $resetFactory = $this->createFixedWindowFactory('reset-request', 1, $storage);

        // Spent through the anonymous path; the authenticated one sends mail too,
        // so it must not offer a way around the limit.
        $resetFactory->create('203.0.113.10')->consume(1);

        $subscriber = $this->createSubscriber(
            $this->createFixedWindowFactory('login', 5, $storage),
            $this->createFixedWindowFactory('register', 5, $storage),
            $resetFactory,
            $this->createFixedWindowFactory('reset-confirm', 5, $storage),
        );
        $request = Request::create('/api/me/password-reset/request', 'POST', [], [], [], ['REMOTE_ADDR' => '203.0.113.10']);

        $event = $this->createRequestEvent($request);
        $subscriber->onKernelRequest($event);

        $response = $event->getResponse();
        $this->assertNotNull($response);
        $this->assertSame(429, $response->getStatusCode());
    }

    public function testRejectsPasswordResetConfirmWhenRateLimitIsExceeded(): void
    {
        $storage        = new InMemoryStorage();
        $confirmFactory = $this->createFixedWindowFactory('reset-confirm', 1, $storage);

        $confirmFactory->create('203.0.113.10')->consume(1);

        $subscriber = $this->createSubscriber(
            $this->createFixedWindowFactory('login', 5, $storage),
            $this->createFixedWindowFactory('register', 5, $storage),
            $this->createFixedWindowFactory('reset-request', 5, $storage),
            $confirmFactory,
        );
        $request = Request::create('/api/password-reset/confirm', 'POST', [], [], [], ['REMOTE_ADDR' => '203.0.113.10']);

        $event = $this->createRequestEvent($request);
        $subscriber->onKernelRequest($event);

        $response = $event->getResponse();
        $this->assertNotNull($response);
        $this->assertSame(429, $response->getStatusCode());
    }

    private function createSubscriber(
        RateLimiterFactory $login,
        RateLimiterFactory $register,
        RateLimiterFactory $resetRequest,
        RateLimiterFactory $resetConfirm,
    ): LoginRequestRateLimiterSubscriber {
        return new LoginRequestRateLimiterSubscriber($login, $register, $resetRequest, $resetConfirm);
    }

    private function createFixedWindowFactory(string $id, int $limit, InMemoryStorage $storage): RateLimiterFactory
    {
        return new RateLimiterFactory([
            'id' => $id,
            'policy' => 'fixed_window',
            'limit' => $limit,
            'interval' => '5 minutes',
        ], $storage);
    }

    private function createRequestEvent(Request $request): RequestEvent
    {
        return new RequestEvent(
            $this->createMock(HttpKernelInterface::class),
            $request,
            HttpKernelInterface::MAIN_REQUEST,
        );
    }
}