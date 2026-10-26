<?php

declare(strict_types=1);

namespace App\Tests\Security;

use App\Security\SecurityHeadersSubscriber;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;

final class SecurityHeadersSubscriberTest extends TestCase
{
    public function testJsonResponsesForbidEverything(): void
    {
        $response = $this->handle(new JsonResponse(['ok' => true]), 'prod');

        self::assertSame('nosniff', $response->headers->get('X-Content-Type-Options'));
        self::assertSame('DENY', $response->headers->get('X-Frame-Options'));
        self::assertSame('no-referrer', $response->headers->get('Referrer-Policy'));
        self::assertSame('same-origin', $response->headers->get('Cross-Origin-Resource-Policy'));
        self::assertSame(
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
            $response->headers->get('Content-Security-Policy'),
        );
    }

    public function testHtmlResponsesKeepADocumentPolicy(): void
    {
        // The API Platform documentation: default-src 'none' would blank it.
        $response = $this->handle(new Response('<html lang="fr"></html>', 200, ['Content-Type' => 'text/html; charset=UTF-8']), 'prod');

        $policy = (string) $response->headers->get('Content-Security-Policy');

        self::assertStringContainsString("frame-ancestors 'none'", $policy);
        self::assertStringContainsString("object-src 'none'", $policy);
        self::assertStringNotContainsString("default-src 'none'", $policy);
    }

    public function testStrictTransportSecurityIsProductionOnly(): void
    {
        self::assertSame(
            'max-age=31536000; includeSubDomains',
            $this->handle(new JsonResponse([]), 'prod')->headers->get('Strict-Transport-Security'),
        );
        self::assertFalse(
            $this->handle(new JsonResponse([]), 'dev')->headers->has('Strict-Transport-Security'),
        );
    }

    public function testAHeaderTheApplicationSetIsNotOverwritten(): void
    {
        $response = new JsonResponse([]);
        $response->headers->set('Referrer-Policy', 'origin-when-cross-origin');

        self::assertSame(
            'origin-when-cross-origin',
            $this->handle($response, 'prod')->headers->get('Referrer-Policy'),
        );
    }

    public function testSubRequestsAreLeftAlone(): void
    {
        $subscriber = new SecurityHeadersSubscriber('prod');
        $response   = new JsonResponse([]);
        $subscriber->onKernelResponse(new ResponseEvent(
            $this->createMock(HttpKernelInterface::class),
            Request::create('/api/games'),
            HttpKernelInterface::SUB_REQUEST,
            $response,
        ));

        self::assertFalse($response->headers->has('X-Content-Type-Options'));
    }

    private function handle(Response $response, string $environment): Response
    {
        $subscriber = new SecurityHeadersSubscriber($environment);
        $subscriber->onKernelResponse(new ResponseEvent(
            $this->createMock(HttpKernelInterface::class),
            Request::create('/api/games'),
            HttpKernelInterface::MAIN_REQUEST,
            $response,
        ));

        return $response;
    }
}
