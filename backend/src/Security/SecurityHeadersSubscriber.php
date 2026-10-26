<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Sends the response headers that tell a browser how much to distrust an API
 * reply. The API answers JSON, which a browser should never sniff into another
 * type, frame, or treat as a document, so the policy for it can be far stricter
 * than for a page.
 *
 * Headers already set on the response are left alone: an endpoint that chose a
 * value deliberately keeps it.
 */
final class SecurityHeadersSubscriber implements EventSubscriberInterface
{
    /**
     * Nothing may load, and the response may not be framed, used as a form
     * target, or rebase relative URLs. Safe for JSON, and what an attacker
     * would otherwise exploit by navigating a victim straight to an endpoint.
     */
    private const DATA_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

    /**
     * The API Platform documentation is a real page: it loads its own scripts,
     * styles and fonts, so default-src 'none' would blank it. These directives
     * still hold without touching what it may load.
     */
    private const DOCUMENT_CSP = "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";

    public function __construct(
        #[Autowire('%kernel.environment%')]
        private readonly string $environment,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            // Late, so headers set by the application or by API Platform are
            // already in place and can be preserved.
            KernelEvents::RESPONSE => ['onKernelResponse', -256],
        ];
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $response = $event->getResponse();

        $this->setIfAbsent($response, 'X-Content-Type-Options', 'nosniff');
        $this->setIfAbsent($response, 'X-Frame-Options', 'DENY');
        $this->setIfAbsent($response, 'Referrer-Policy', 'no-referrer');
        $this->setIfAbsent($response, 'Cross-Origin-Resource-Policy', 'same-origin');
        $this->setIfAbsent($response, 'Content-Security-Policy', $this->contentSecurityPolicy($response));

        // Browsers ignore this over plain HTTP; restricting it to prod keeps a
        // development host from pinning HTTPS for a developer.
        if ('prod' === $this->environment) {
            $this->setIfAbsent($response, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
    }

    private function contentSecurityPolicy(Response $response): string
    {
        $contentType = (string) $response->headers->get('Content-Type', '');

        return str_contains($contentType, 'text/html') ? self::DOCUMENT_CSP : self::DATA_CSP;
    }

    private function setIfAbsent(Response $response, string $name, string $value): void
    {
        if ($response->headers->has($name)) {
            return;
        }

        $response->headers->set($name, $value);
    }
}
