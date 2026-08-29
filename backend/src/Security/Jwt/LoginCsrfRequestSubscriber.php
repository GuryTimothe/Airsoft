<?php

declare(strict_types=1);

namespace App\Security\Jwt;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class LoginCsrfRequestSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly LoginCsrfManager $loginCsrfManager,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 20],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $method  = strtoupper($request->getMethod());
        if (\in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }

        $path = $request->getPathInfo();
        if (!str_starts_with($path, '/api')) {
            return;
        }

        // Public/auth bootstrap routes are exempt from CSRF checks.
        if (
            str_starts_with($path, '/api/csrf')
            || '/api/register' === $path
            || '/api/logout'   === $path
            || str_starts_with($path, '/api/password-reset')
            || str_starts_with($path, '/api/email-verification')
        ) {
            return;
        }

        // Non-browser API clients using explicit Bearer auth are not CSRF-exposed.
        $authorization = $request->headers->get('Authorization');
        if (\is_string($authorization) && str_starts_with($authorization, 'Bearer ')) {
            return;
        }

        if ($this->loginCsrfManager->consumeToken($request->headers->get(LoginCsrfManager::CSRF_HEADER_NAME))) {
            return;
        }

        $event->setResponse(new JsonResponse([
            'message' => 'Requête invalide.',
        ], JsonResponse::HTTP_FORBIDDEN));
    }
}
