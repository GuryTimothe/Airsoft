<?php

namespace App\Controller;

use App\Security\Jwt\JwtCookieManager;
use App\Security\Jwt\JwtRevocationStore;
use App\Security\Jwt\JwtRevocationUnavailableException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;
use Symfony\Component\Routing\Attribute\Route;

final class LogoutController extends AbstractController
{
    public function __construct(
        private readonly JwtRevocationStore $jwtRevocationStore,
        private readonly JwtCookieManager $jwtCookieManager,
    ) {
    }

    #[Route('/api/logout', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        $token    = $this->jwtCookieManager->extractTokenFromRequest($request);
        $response = new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
        $this->jwtCookieManager->addClearingCookie($response, $request->isSecure());

        if (null === $token) {
            return $response;
        }

        $payload   = $this->decodePayload($token);
        $tokenId   = $payload['jti'] ?? null;
        $expiresAt = $payload['exp'] ?? null;

        if (!\is_string($tokenId) || '' === $tokenId || !\is_int($expiresAt)) {
            if (\is_string($tokenId) && '' !== $tokenId) {
                $this->jwtRevocationStore->revokeTokenActivity($tokenId);
            }

            return $response;
        }

        try {
            $this->jwtRevocationStore->revokeTokenId($tokenId, $expiresAt);
            $this->jwtRevocationStore->revokeTokenActivity($tokenId);
        } catch (JwtRevocationUnavailableException $exception) {
            throw new ServiceUnavailableHttpException(null, 'Redis is required to revoke JWT tokens.', $exception);
        }

        return $response;
    }

    /**
     * @return array<string, mixed>
     */
    private function decodePayload(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) < 2 || '' === $parts[1]) {
            return [];
        }

        $payload = strtr($parts[1], '-_', '+/');
        $payload .= str_repeat('=', (4 - strlen($payload) % 4) % 4);
        $decoded = base64_decode($payload, true);
        if (false === $decoded) {
            return [];
        }

        $data = json_decode($decoded, true);

        return is_array($data) ? $data : [];
    }
}
