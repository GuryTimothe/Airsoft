<?php

declare(strict_types=1);

namespace App\Security\Jwt;

use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;

final class GenericAuthenticationFailureHandler implements AuthenticationFailureHandlerInterface
{
    public function __construct(
        #[Autowire(service: 'monolog.logger.security')]
        private readonly LoggerInterface $logger,
        #[Autowire('%kernel.environment%')]
        private readonly string $environment,
        #[Autowire('%kernel.secret%')]
        private readonly string $appSecret,
    ) {
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): JsonResponse
    {
        $this->logger->warning('Security authentication failure.', [
            'event_id' => 'SEC.AUTH.LOGIN_FAILED',
            'event_category' => 'authentication',
            'severity' => 'WARNING',
            'outcome' => 'failure',
            'action' => 'login',
            'service' => 'backend-api',
            'environment' => $this->environment,
            'request_id' => (string) ($request->headers->get('X-Request-Id') ?? ''),
            'correlation_id' => (string) ($request->headers->get('X-Correlation-Id') ?? ''),
            'actor_type' => 'anonymous',
            'actor_id_hash' => $this->extractIdentifierHash($request),
            'source_ip_masked' => $this->maskIp($request->getClientIp()),
            'http_method' => $request->getMethod(),
            'http_path' => $request->getPathInfo(),
            'http_status' => JsonResponse::HTTP_UNAUTHORIZED,
            'reason_code' => 'INVALID_CREDENTIALS',
            'message' => 'Authentication failed.',
        ]);

        return new JsonResponse([
            'message' => 'Identifiants invalides.',
        ], JsonResponse::HTTP_UNAUTHORIZED);
    }

    private function extractIdentifierHash(Request $request): ?string
    {
        $content = $request->getContent();
        if ('' === $content) {
            return null;
        }

        $data = json_decode($content, true);
        if (!\is_array($data)) {
            return null;
        }

        $identifier = $data['email'] ?? null;
        if (!\is_string($identifier) || '' === trim($identifier)) {
            return null;
        }

        return hash_hmac('sha256', mb_strtolower(trim($identifier)), $this->appSecret);
    }

    private function maskIp(?string $ip): string
    {
        if (null === $ip || '' === $ip) {
            return 'unknown';
        }

        if (false !== filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $parts = explode('.', $ip);
            if (4 === \count($parts)) {
                return sprintf('%s.%s.%s.0/24', $parts[0], $parts[1], $parts[2]);
            }
        }

        if (false !== filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $parts = explode(':', $ip);

            return sprintf('%s:%s:%s::/48', $parts[0] ?? '0', $parts[1] ?? '0', $parts[2] ?? '0');
        }

        return 'unknown';
    }
}
