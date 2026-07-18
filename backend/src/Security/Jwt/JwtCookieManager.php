<?php

declare(strict_types=1);

namespace App\Security\Jwt;

use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class JwtCookieManager
{
    public const AUTH_COOKIE_NAME = 'ma_access_token';

    public function addTokenCookie(Response $response, string $token, bool $secure): void
    {
        $expiresAt = $this->extractExpirationTimestamp($token);
        $expires   = $expiresAt !== null ? (new \DateTimeImmutable())->setTimestamp($expiresAt) : null;

        $response->headers->setCookie(Cookie::create(
            name: self::AUTH_COOKIE_NAME,
            value: $token,
            expire: $expires,
            path: '/',
            secure: $secure,
            httpOnly: true,
            raw: false,
            sameSite: Cookie::SAMESITE_LAX,
        ));
    }

    public function addClearingCookie(Response $response, bool $secure): void
    {
        $response->headers->setCookie(Cookie::create(
            name: self::AUTH_COOKIE_NAME,
            value: '',
            expire: new \DateTimeImmutable('-1 day'),
            path: '/',
            secure: $secure,
            httpOnly: true,
            raw: false,
            sameSite: Cookie::SAMESITE_LAX,
        ));
    }

    public function extractTokenFromRequest(Request $request): ?string
    {
        $cookieToken = $request->cookies->get(self::AUTH_COOKIE_NAME);
        if (\is_string($cookieToken) && '' !== trim($cookieToken)) {
            return trim($cookieToken);
        }

        $authorization = $request->headers->get('Authorization');
        if (!\is_string($authorization) || !str_starts_with($authorization, 'Bearer ')) {
            return null;
        }

        $bearerToken = trim(substr($authorization, 7));

        return '' !== $bearerToken ? $bearerToken : null;
    }

    private function extractExpirationTimestamp(string $token): ?int
    {
        $parts = explode('.', $token);
        if (count($parts) < 2 || '' === $parts[1]) {
            return null;
        }

        $payload = strtr($parts[1], '-_', '+/');
        $payload .= str_repeat('=', (4 - strlen($payload) % 4) % 4);
        $decoded = base64_decode($payload, true);
        if (false === $decoded) {
            return null;
        }

        $data = json_decode($decoded, true);
        if (!\is_array($data) || !isset($data['exp']) || !\is_int($data['exp'])) {
            return null;
        }

        return $data['exp'];
    }
}
