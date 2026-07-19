<?php

declare(strict_types=1);

namespace App\Tests\Security;

use App\Entity\User;
use App\Security\AccessDeniedLoggingSubscriber;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

final class AccessDeniedLoggingSubscriberTest extends TestCase
{
    public function testIgnoresNonAccessDeniedExceptions(): void
    {
        $logger   = $this->createMock(LoggerInterface::class);
        $security = $this->createMock(Security::class);

        $logger->expects($this->never())->method('warning');
        $security->expects($this->never())->method('getUser');

        $subscriber = new AccessDeniedLoggingSubscriber($logger, $security, 'test', 'secret');
        $event      = new ExceptionEvent(
            $this->createMock(HttpKernelInterface::class),
            Request::create('/api/admin', 'GET'),
            HttpKernelInterface::MAIN_REQUEST,
            new \RuntimeException('boom'),
        );

        $subscriber->onKernelException($event);
    }

    public function testLogsAnonymousAccessDeniedWithMaskedIpv4(): void
    {
        $logger   = $this->createMock(LoggerInterface::class);
        $security = $this->createMock(Security::class);

        $security->expects($this->once())->method('getUser')->willReturn(null);
        $logger
            ->expects($this->once())
            ->method('warning')
            ->with(
                'Security access denied.',
                $this->callback(static function (array $context): bool {
                    return 'SEC.AUTHZ.ACCESS_DENIED' === ($context['event_id'] ?? null)
                        && 'anonymous' === ($context['actor_type'] ?? null)
                        && null === ($context['actor_id_hash'] ?? null)
                        && '203.0.113.0/24' === ($context['source_ip_masked'] ?? null)
                        && 'GET' === ($context['http_method'] ?? null)
                        && '/api/admin' === ($context['http_path'] ?? null)
                        && 403 === ($context['http_status'] ?? null);
                })
            );

        $subscriber = new AccessDeniedLoggingSubscriber($logger, $security, 'test', 'secret');
        $request    = Request::create('/api/admin', 'GET', [], [], [], ['REMOTE_ADDR' => '203.0.113.99']);
        $request->headers->set('X-Request-Id', 'req-1');
        $request->headers->set('X-Correlation-Id', 'corr-1');

        $event = new ExceptionEvent(
            $this->createMock(HttpKernelInterface::class),
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            new AccessDeniedException('forbidden'),
        );

        $subscriber->onKernelException($event);
    }

    public function testLogsAuthenticatedUserAccessDeniedWithHashedActorIdAndMaskedIpv6(): void
    {
        $logger   = $this->createMock(LoggerInterface::class);
        $security = $this->createMock(Security::class);
        $user     = new User();

        $this->setUserId($user, 42);

        $security->expects($this->once())->method('getUser')->willReturn($user);
        $logger
            ->expects($this->once())
            ->method('warning')
            ->with(
                'Security access denied.',
                $this->callback(static function (array $context): bool {
                    return 'user' === ($context['actor_type'] ?? null)
                        && hash_hmac('sha256', 'user:42', 'secret') === ($context['actor_id_hash'] ?? null)
                        && '2001:0db8:85a3::/48' === ($context['source_ip_masked'] ?? null)
                        && 'ACCESS_DENIED' === ($context['reason_code'] ?? null);
                })
            );

        $subscriber = new AccessDeniedLoggingSubscriber($logger, $security, 'test', 'secret');
        $request    = Request::create('/api/admin', 'POST', [], [], [], ['REMOTE_ADDR' => '2001:0db8:85a3:0000:0000:8a2e:0370:7334']);

        $event = new ExceptionEvent(
            $this->createMock(HttpKernelInterface::class),
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            new AccessDeniedHttpException('forbidden'),
        );

        $subscriber->onKernelException($event);
    }

    private function setUserId(User $user, int $id): void
    {
        $reflection = new \ReflectionProperty($user, 'id');
        $reflection->setValue($user, $id);
    }
}