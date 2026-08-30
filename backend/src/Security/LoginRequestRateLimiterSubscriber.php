<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;

final class LoginRequestRateLimiterSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly RateLimiterFactory $loginRequestLimiter,
        private readonly RateLimiterFactory $registerRequestLimiter,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 10],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $path    = $request->getPathInfo();

        if ('/api/register/check-email' === $path && $request->isMethod('GET')) {
            $this->consumeOrReject(
                event: $event,
                limiter: $this->registerRequestLimiter,
                message: 'Too many requests. Please try again in 5 minutes.'
            );

            return;
        }

        if (!$request->isMethod('POST')) {
            return;
        }

        if ('/api/login' === $path) {
            $this->consumeOrReject(
                event: $event,
                limiter: $this->loginRequestLimiter,
                message: 'Too many login attempts. Please try again in 5 minutes.'
            );

            return;
        }

        if ('/api/register' === $path) {
            $this->consumeOrReject(
                event: $event,
                limiter: $this->registerRequestLimiter,
                message: 'Too many registration attempts. Please try again in 5 minutes.'
            );
        }
    }

    private function consumeOrReject(RequestEvent $event, RateLimiterFactory $limiter, string $message): void
    {
        $request = $event->getRequest();

        $key   = $request->getClientIp() ?? 'unknown';
        $limit = $limiter->create($key)->consume(1);

        if ($limit->isAccepted()) {
            return;
        }

        $retryAfter     = $limit->getRetryAfter();
        $retryInSeconds = max(1, $retryAfter->getTimestamp() - time());

        $event->setResponse(new JsonResponse([
            'code'    => 429,
            'message' => $message,
        ], 429, [
            'Retry-After' => (string) $retryInSeconds,
        ]));
    }
}
