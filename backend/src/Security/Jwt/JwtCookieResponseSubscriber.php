<?php

declare(strict_types=1);

namespace App\Security\Jwt;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Request;
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
        private readonly ?JwtRevocationStore $jwtRevocationStore = null,
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

        if ('DELETE' === $request->getMethod() && '/api/me' === $request->getPathInfo()) {
            if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
                $this->jwtCookieManager->addClearingCookie($response, $request->isSecure());
                $this->revokeRequestToken($request);
            }

            return;
        }

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
            if ('/api/me/password' === $request->getPathInfo()) {
                $this->jwtCookieManager->addClearingCookie($response, $request->isSecure());
            }

            return;
        }

        $this->jwtCookieManager->addTokenCookie($response, $jwt, $request->isSecure());
    }

    private function revokeRequestToken(Request $request): void
    {
        if (null === $this->jwtRevocationStore) {
            return;
        }

        $token = $this->jwtCookieManager->extractTokenFromRequest($request);
        if (null === $token) {
            return;
        }

        $parts = explode('.', $token);
        if (count($parts) < 2 || '' === $parts[1]) {
            return;
        }

        $payload = strtr($parts[1], '-_', '+/');
        $payload .= str_repeat('=', (4 - strlen($payload) % 4) % 4);
        $decoded = base64_decode($payload, true);
        if (false === $decoded) {
            return;
        }

        $data      = json_decode($decoded, true);
        $tokenId   = \is_array($data) ? ($data['jti'] ?? null) : null;
        $expiresAt = \is_array($data) ? ($data['exp'] ?? null) : null;

        if (\is_string($tokenId) && '' !== $tokenId && \is_int($expiresAt)) {
            try {
                $this->jwtRevocationStore->revokeTokenId($tokenId, $expiresAt);
                $this->jwtRevocationStore->revokeTokenActivity($tokenId);
            } catch (\Throwable) {
                // Best effort token revocation on self-deletion
            }
        }
    }
}
