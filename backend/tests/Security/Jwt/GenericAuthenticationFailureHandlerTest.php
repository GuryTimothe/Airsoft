<?php

namespace App\Tests\Security\Jwt;

use App\Security\Jwt\GenericAuthenticationFailureHandler;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Exception\AuthenticationException;

final class GenericAuthenticationFailureHandlerTest extends TestCase
{
    public function testAuthenticationFailureProducesSecurityLogAnd401Response(): void
    {
        $logger = $this->createMock(LoggerInterface::class);

        $logger
            ->expects($this->once())
            ->method('warning')
            ->with(
                'Security authentication failure.',
                $this->callback(static function (array $context): bool {
                    return 'SEC.AUTH.LOGIN_FAILED' === ($context['event_id'] ?? null)
                        && 'authentication' === ($context['event_category'] ?? null)
                        && 'WARNING' === ($context['severity'] ?? null)
                        && 'failure' === ($context['outcome'] ?? null)
                        && 'INVALID_CREDENTIALS' === ($context['reason_code'] ?? null)
                        && 401 === ($context['http_status'] ?? null)
                        && 'POST' === ($context['http_method'] ?? null)
                        && '/api/login' === ($context['http_path'] ?? null)
                        && \is_string($context['source_ip_masked'] ?? null);
                })
            );

        $handler = new GenericAuthenticationFailureHandler(
            $logger,
            'test',
            'test-secret',
        );

        $request = Request::create(
            '/api/login',
            'POST',
            [],
            [],
            [],
            ['REMOTE_ADDR' => '203.0.113.8'],
            json_encode(['email' => 'test@example.com', 'password' => 'bad-password'], JSON_THROW_ON_ERROR),
        );

        $response = $handler->onAuthenticationFailure($request, new AuthenticationException('bad credentials'));

        $this->assertSame(401, $response->getStatusCode());
        $this->assertJson((string) $response->getContent());
        $this->assertStringContainsString('Identifiants invalides', (string) $response->getContent());
    }
}
