<?php

namespace App\Controller;

use App\Security\Jwt\JwtCookieManager;
use App\Security\Jwt\JwtRevocationStore;
use App\Security\Jwt\JwtRevocationUnavailableException;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;
use Symfony\Component\Routing\Attribute\Route;

final class LogoutController extends AbstractController
{
    public function __construct(
        private readonly JwtRevocationStore $jwtRevocationStore,
        private readonly JwtCookieManager $jwtCookieManager,
        #[Autowire(service: 'monolog.logger.security')]
        private readonly LoggerInterface $logger,
        #[Autowire('%kernel.environment%')]
        private readonly string $environment,
        #[Autowire('%kernel.secret%')]
        private readonly string $appSecret,
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

            $this->logger->warning('Security logout received malformed token payload.', [
                'event_id'       => 'SEC.JWT.INVALID_TOKEN',
                'event_category' => 'token_security',
                'severity'       => 'WARNING',
                'outcome'        => 'blocked',
                'action'         => 'logout',
                'service'        => 'backend-api',
                'environment'    => $this->environment,
                'actor_type'     => 'anonymous',
                'token_id_hash'  => \is_string($tokenId) && '' !== $tokenId
                    ? hash_hmac('sha256', sprintf('jti:%s', $tokenId), $this->appSecret)
                    : null,
                'http_method' => $request->getMethod(),
                'http_path'   => $request->getPathInfo(),
                'http_status' => JsonResponse::HTTP_NO_CONTENT,
                'reason_code' => 'MALFORMED_TOKEN_PAYLOAD',
                'message'     => 'Logout executed with malformed token payload.',
            ]);

            return $response;
        }

        try {
            $this->jwtRevocationStore->revokeTokenId($tokenId, $expiresAt);
            $this->jwtRevocationStore->revokeTokenActivity($tokenId);

            $this->logger->info('Security JWT token revoked on logout.', [
                'event_id'       => 'SEC.JWT.TOKEN_REVOKED',
                'event_category' => 'token_security',
                'severity'       => 'INFO',
                'outcome'        => 'success',
                'action'         => 'logout',
                'service'        => 'backend-api',
                'environment'    => $this->environment,
                'actor_type'     => 'anonymous',
                'token_id_hash'  => hash_hmac('sha256', sprintf('jti:%s', $tokenId), $this->appSecret),
                'http_method'    => $request->getMethod(),
                'http_path'      => $request->getPathInfo(),
                'http_status'    => JsonResponse::HTTP_NO_CONTENT,
                'reason_code'    => 'LOGOUT_TOKEN_REVOKED',
                'message'        => 'JWT token revoked during logout.',
            ]);
        } catch (JwtRevocationUnavailableException $exception) {
            $this->logger->error('Security JWT revocation failed on logout.', [
                'event_id'       => 'SEC.JWT.REVOCATION_ERROR',
                'event_category' => 'token_security',
                'severity'       => 'ERROR',
                'outcome'        => 'failure',
                'action'         => 'logout',
                'service'        => 'backend-api',
                'environment'    => $this->environment,
                'actor_type'     => 'anonymous',
                'token_id_hash'  => hash_hmac('sha256', sprintf('jti:%s', $tokenId), $this->appSecret),
                'http_method'    => $request->getMethod(),
                'http_path'      => $request->getPathInfo(),
                'http_status'    => JsonResponse::HTTP_SERVICE_UNAVAILABLE,
                'reason_code'    => 'REVOCATION_STORE_UNAVAILABLE',
                'message'        => 'JWT revocation store unavailable during logout.',
            ]);

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
