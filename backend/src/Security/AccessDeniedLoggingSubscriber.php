<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\User;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

final class AccessDeniedLoggingSubscriber implements EventSubscriberInterface
{
    public function __construct(
        #[Autowire(service: 'monolog.logger.security')]
        private readonly LoggerInterface $logger,
        private readonly Security $security,
        #[Autowire('%kernel.environment%')]
        private readonly string $environment,
        #[Autowire('%kernel.secret%')]
        private readonly string $appSecret,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::EXCEPTION => 'onKernelException',
        ];
    }

    public function onKernelException(ExceptionEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $throwable = $event->getThrowable();
        if (!$throwable instanceof AccessDeniedException && !$throwable instanceof AccessDeniedHttpException) {
            return;
        }

        $request     = $event->getRequest();
        $actor       = $this->security->getUser();
        $actorIdHash = null;
        $actorType   = 'anonymous';

        if ($actor instanceof User) {
            $actorType = 'user';
            $actorId   = $actor->getId();
            if (null !== $actorId) {
                $actorIdHash = hash_hmac('sha256', sprintf('user:%d', $actorId), $this->appSecret);
            }
        }

        $this->logger->warning('Security access denied.', [
            'event_id'         => 'SEC.AUTHZ.ACCESS_DENIED',
            'event_category'   => 'authorization',
            'severity'         => 'WARNING',
            'outcome'          => 'blocked',
            'action'           => 'access_check',
            'service'          => 'backend-api',
            'environment'      => $this->environment,
            'request_id'       => (string) ($request->headers->get('X-Request-Id') ?? ''),
            'correlation_id'   => (string) ($request->headers->get('X-Correlation-Id') ?? ''),
            'actor_type'       => $actorType,
            'actor_id_hash'    => $actorIdHash,
            'source_ip_masked' => $this->maskIp($request->getClientIp()),
            'http_method'      => $request->getMethod(),
            'http_path'        => $request->getPathInfo(),
            'http_status'      => 403,
            'reason_code'      => 'ACCESS_DENIED',
            'message'          => 'Access denied.',
        ]);
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
            if (\count($parts) >= 3) {
                return sprintf('%s:%s:%s::/48', $parts[0], $parts[1], $parts[2]);
            }
        }

        return 'unknown';
    }
}
