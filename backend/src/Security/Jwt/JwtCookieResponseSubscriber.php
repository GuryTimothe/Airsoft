<?php

declare(strict_types=1);

namespace App\Security\Jwt;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class JwtCookieResponseSubscriber implements EventSubscriberInterface
{
    /**
     * @param list<string> $authCookiePaths
     */
    public function __construct(
        private readonly JwtCookieManager $jwtCookieManager,
        private readonly array $authCookiePaths,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::RESPONSE => 'onKernelResponse',
        ];
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request  = $event->getRequest();
        $response = $event->getResponse();

        if ('PATCH' !== $request->getMethod()) {
            return;
        }

        if (!\in_array($request->getPathInfo(), $this->authCookiePaths, true)) {
            return;
        }

        if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
            return;
        }

        $content = $response->getContent();
        if (!\is_string($content)) {
            return;
        }

        $payload = json_decode($content, true);
        $jwt     = \is_array($payload) ? ($payload['token'] ?? null) : null;

        if (!\is_string($jwt) || '' === trim($jwt)) {
            return;
        }

        $this->jwtCookieManager->addTokenCookie($response, $jwt, $request->isSecure());
    }
}
