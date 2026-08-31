<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Controller\EmailVerificationController;
use App\Entity\EmailVerificationToken;
use App\Entity\User;
use App\Security\Jwt\JwtCookieManager;
use Doctrine\ORM\EntityRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;

final class EmailVerificationControllerTest extends TestCase
{
    public function testPendingEmailConfirmationWithoutAuthenticatedSessionDoesNotIssueJwt(): void
    {
        $user = (new User())->setEmail('old@example.com');
        $verificationToken = new EmailVerificationToken(
            $user,
            hash('sha256', 'plain-token'),
            new \DateTimeImmutable('+1 hour'),
            'new@example.com',
        );

        $entityManager = $this->createEntityManager($verificationToken);
        $jwtManager = $this->createMock(JWTTokenManagerInterface::class);
        $jwtManager->expects($this->never())->method('parse');
        $jwtManager->expects($this->never())->method('create');

        $response = $this->createController($entityManager, $jwtManager)->confirm(
            $this->createJsonRequest(['token' => 'plain-token']),
        );
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('new@example.com', $user->getEmail());
        $this->assertSame('Votre nouvelle adresse e-mail est validée.', $payload['message'] ?? null);
        $this->assertArrayNotHasKey('token', $payload);
        $this->assertSame([], $response->headers->getCookies());
    }

    public function testPendingEmailConfirmationWithAuthenticatedSessionIssuesRenewedJwt(): void
    {
        $user = (new User())->setEmail('old@example.com');
        $verificationToken = new EmailVerificationToken(
            $user,
            hash('sha256', 'plain-token'),
            new \DateTimeImmutable('+1 hour'),
            'new@example.com',
        );

        $entityManager = $this->createEntityManager($verificationToken);
        $jwtManager = $this->createMock(JWTTokenManagerInterface::class);
        $jwtManager->expects($this->once())->method('parse')->with('current.jwt')->willReturn(['username' => 'old@example.com']);
        $jwtManager->expects($this->once())->method('create')->with($user)->willReturn($this->createJwt(['exp' => time() + 3600]));

        $response = $this->createController($entityManager, $jwtManager)->confirm(
            $this->createJsonRequest(['token' => 'plain-token'], [JwtCookieManager::AUTH_COOKIE_NAME => 'current.jwt']),
        );
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('new@example.com', $user->getEmail());
        $this->assertIsString($payload['token'] ?? null);
        $this->assertSame(JwtCookieManager::AUTH_COOKIE_NAME, ($response->headers->getCookies()[0] ?? null)?->getName());
    }

    public function testPendingEmailConfirmationWithTokenForAnotherUserDoesNotIssueJwt(): void
    {
        $user = (new User())->setEmail('old@example.com');
        $verificationToken = new EmailVerificationToken(
            $user,
            hash('sha256', 'plain-token'),
            new \DateTimeImmutable('+1 hour'),
            'new@example.com',
        );

        $entityManager = $this->createEntityManager($verificationToken);
        $jwtManager = $this->createMock(JWTTokenManagerInterface::class);
        $jwtManager->expects($this->once())->method('parse')->with('other.jwt')->willReturn(['username' => 'other@example.com']);
        $jwtManager->expects($this->never())->method('create');

        $response = $this->createController($entityManager, $jwtManager)->confirm(
            $this->createJsonRequest(['token' => 'plain-token'], [JwtCookieManager::AUTH_COOKIE_NAME => 'other.jwt']),
        );
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('new@example.com', $user->getEmail());
        $this->assertArrayNotHasKey('token', $payload);
        $this->assertSame([], $response->headers->getCookies());
    }

    private function createController(
        EntityManagerInterface $entityManager,
        JWTTokenManagerInterface $jwtManager,
    ): EmailVerificationController {
        return new EmailVerificationController(
            $entityManager,
            $jwtManager,
            new JwtCookieManager(),
        );
    }

    private function createEntityManager(EmailVerificationToken $verificationToken): EntityManagerInterface
    {
        $repository = $this->createMock(EntityRepository::class);
        $repository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['tokenHash' => $verificationTokenHash = hash('sha256', 'plain-token')])
            ->willReturnCallback(static fn (array $criteria): EmailVerificationToken => $criteria['tokenHash'] === $verificationTokenHash ? $verificationToken : throw new \RuntimeException('Unexpected token hash.'));

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('getRepository')->with(EmailVerificationToken::class)->willReturn($repository);
        $entityManager->expects($this->once())->method('flush');

        return $entityManager;
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<string, string> $cookies
     */
    private function createJsonRequest(array $payload, array $cookies = []): Request
    {
        return Request::create(
            '/api/email-verification/confirm',
            'POST',
            [],
            $cookies,
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload, JSON_THROW_ON_ERROR),
        );
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function createJwt(array $payload): string
    {
        $header = rtrim(strtr(base64_encode('{"alg":"HS256","typ":"JWT"}'), '+/', '-_'), '=');
        $body   = rtrim(strtr(base64_encode((string) json_encode($payload, JSON_THROW_ON_ERROR)), '+/', '-_'), '=');

        return sprintf('%s.%s.signature', $header, $body);
    }
}