<?php

declare(strict_types=1);

namespace App\Security\Jwt;

use Lexik\Bundle\JWTAuthenticationBundle\Security\Http\Authentication\AuthenticationSuccessHandler;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;

final class LoginSuccessHandler implements AuthenticationSuccessHandlerInterface
{
    public function __construct(
        private readonly AuthenticationSuccessHandler $innerSuccessHandler,
        private readonly JwtCookieManager $jwtCookieManager,
    ) {
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token): Response
    {
        $response = $this->innerSuccessHandler->onAuthenticationSuccess($request, $token);
        $content  = $response->getContent();

        if (!\is_string($content)) {
            return $response;
        }

        $payload = json_decode($content, true);
        $jwt     = \is_array($payload) ? ($payload['token'] ?? null) : null;

        if (\is_string($jwt) && '' !== trim($jwt)) {
            $this->jwtCookieManager->addTokenCookie($response, $jwt, $request->isSecure());
        }

        return $response;
    }
}
