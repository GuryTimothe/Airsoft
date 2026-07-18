<?php

namespace App\Tests\Security\Jwt;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\Jwt\JwtRevocationStore;
use App\Security\Jwt\TokenVersionSubscriber;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTDecodedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use Symfony\Component\Security\Core\User\UserInterface;

final class TokenVersionSubscriberTest extends TestCase
{
    private const SECRET = 'test-secret';
    private const ISSUER = 'https://issuer.test';
    private const AUDIENCE = 'https://audience.test';
    private const INACTIVITY_TIMEOUT = 1800;

    private function createSubscriber(UserRepository $userRepository, JwtRevocationStore $revocationStore): TokenVersionSubscriber
    {
        return new TokenVersionSubscriber(
            $userRepository,
            $revocationStore,
            new NullLogger(),
            self::SECRET,
            'test',
            self::ISSUER,
            self::AUDIENCE,
            self::INACTIVITY_TIMEOUT,
        );
    }

    public function testGetSubscribedEvents(): void
    {
        $events = TokenVersionSubscriber::getSubscribedEvents();

        $this->assertArrayHasKey(Events::JWT_CREATED, $events);
        $this->assertArrayHasKey(Events::JWT_DECODED, $events);
        $this->assertSame('onJwtCreated', $events[Events::JWT_CREATED]);
        $this->assertSame('onJwtDecoded', $events[Events::JWT_DECODED]);
    }

    public function testOnJwtCreatedAddsPayloadForUser(): void
    {
        $user = (new User())
            ->setEmail('test@example.com')
            ->setPassword('hashed-password');

        $userRepository = $this->createMock(UserRepository::class);

        $revocationStore = $this->createMock(JwtRevocationStore::class);
        $revocationStore->method('getOrCreateUserTokenNonce')->willReturn('test-nonce');

        $event = $this->createMock(JWTCreatedEvent::class);
        $event->method('getUser')->willReturn($user);
        $event->method('getData')->willReturn(['username' => 'test@example.com']);
        $revocationStore->expects($this->once())
            ->method('touchTokenActivity')
            ->with(
                $this->callback(static fn (mixed $value): bool => 
                    
                    	\is_string($value) && '' !== $value
                ),
                self::INACTIVITY_TIMEOUT,
            );
        $event->expects($this->once())->method('setData')->with($this->callback(function (array $payload) {
            return isset($payload['pwd_sig'])
                && isset($payload['tok_nce'])
                && $payload['tok_nce'] === 'test-nonce'
                && ($payload['iss'] ?? null) === self::ISSUER
                && ($payload['aud'] ?? null) === self::AUDIENCE;
        }));

        $subscriber = $this->createSubscriber($userRepository, $revocationStore);
        $subscriber->onJwtCreated($event);
    }

    public function testOnJwtCreatedSkipsNonUserPayload(): void
    {
        $nonUser = $this->createMock(UserInterface::class);

        $userRepository  = $this->createMock(UserRepository::class);
        $revocationStore = $this->createMock(JwtRevocationStore::class);

        $event = $this->createMock(JWTCreatedEvent::class);
        $event->method('getUser')->willReturn($nonUser);
        $event->expects($this->never())->method('setData');

        $subscriber = $this->createSubscriber($userRepository, $revocationStore);
        $subscriber->onJwtCreated($event);
    }

    public function testOnJwtDecodedInvalidatesWhenNoUsername(): void
    {
        $userRepository  = $this->createMock(UserRepository::class);
        $revocationStore = $this->createMock(JwtRevocationStore::class);

        $event = $this->createMock(JWTDecodedEvent::class);
        $event->method('getPayload')->willReturn([]);
        $event->expects($this->once())->method('markAsInvalid');

        $subscriber = $this->createSubscriber($userRepository, $revocationStore);
        $subscriber->onJwtDecoded($event);
    }

    public function testOnJwtDecodedInvalidatesWhenNoJti(): void
    {
        $userRepository  = $this->createMock(UserRepository::class);
        $revocationStore = $this->createMock(JwtRevocationStore::class);

        $event = $this->createMock(JWTDecodedEvent::class);
        $event->method('getPayload')->willReturn(['username' => 'test@example.com']);
        $event->expects($this->once())->method('markAsInvalid');

        $subscriber = $this->createSubscriber($userRepository, $revocationStore);
        $subscriber->onJwtDecoded($event);
    }

    public function testOnJwtDecodedInvalidatesWhenUserNotFound(): void
    {
        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findOneBy')->willReturn(null);

        $revocationStore = $this->createMock(JwtRevocationStore::class);
        $revocationStore->method('isTokenIdRevoked')->willReturn(false);
        $revocationStore->method('isTokenActivityActive')->willReturn(true);

        $event = $this->createMock(JWTDecodedEvent::class);
        $event->method('getPayload')->willReturn([
            'jti'      => 'token-id',
            'iss'      => self::ISSUER,
            'aud'      => self::AUDIENCE,
            'username' => 'unknown@example.com',
        ]);
        $event->expects($this->once())->method('markAsInvalid');

        $subscriber = $this->createSubscriber($userRepository, $revocationStore);
        $subscriber->onJwtDecoded($event);
    }

    public function testOnJwtDecodedInvalidatesWhenPasswordSignatureMissing(): void
    {
        $user = (new User())->setEmail('test@example.com')->setPassword('hashed');

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findOneBy')->willReturn($user);

        $revocationStore = $this->createMock(JwtRevocationStore::class);
        $revocationStore->method('isTokenIdRevoked')->willReturn(false);
        $revocationStore->method('isTokenActivityActive')->willReturn(true);

        $event = $this->createMock(JWTDecodedEvent::class);
        $event->method('getPayload')->willReturn([
            'jti'      => 'token-id',
            'iss'      => self::ISSUER,
            'aud'      => self::AUDIENCE,
            'username' => 'test@example.com',
        ]);
        $event->expects($this->once())->method('markAsInvalid');

        $subscriber = $this->createSubscriber($userRepository, $revocationStore);
        $subscriber->onJwtDecoded($event);
    }

    public function testOnJwtDecodedInvalidatesWhenPasswordSignatureMismatch(): void
    {
        $user = (new User())->setEmail('test@example.com')->setPassword('hashed');

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findOneBy')->willReturn($user);

        $revocationStore = $this->createMock(JwtRevocationStore::class);
        $revocationStore->method('isTokenIdRevoked')->willReturn(false);
        $revocationStore->method('isTokenActivityActive')->willReturn(true);
        $revocationStore->method('getUserTokenNonce')->willReturn(null);

        $event = $this->createMock(JWTDecodedEvent::class);
        $event->method('getPayload')->willReturn([
            'jti'      => 'token-id',
            'iss'      => self::ISSUER,
            'aud'      => self::AUDIENCE,
            'username' => 'test@example.com',
            'pwd_sig'  => 'wrong-signature',
        ]);
        $event->expects($this->once())->method('markAsInvalid');

        $subscriber = $this->createSubscriber($userRepository, $revocationStore);
        $subscriber->onJwtDecoded($event);
    }

    public function testOnJwtDecodedValidWhenSignatureAndNonceMatch(): void
    {
        $user = (new User())->setEmail('test@example.com')->setPassword('hashed-password');
        $correctSignature = hash_hmac('sha256', 'hashed-password', self::SECRET);
        $nonce = 'correct-nonce';

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findOneBy')->willReturn($user);

        $revocationStore = $this->createMock(JwtRevocationStore::class);
        $revocationStore->method('isTokenIdRevoked')->willReturn(false);
        $revocationStore->method('isTokenActivityActive')->willReturn(true);
        $revocationStore->method('getUserTokenNonce')->willReturn($nonce);
        $revocationStore->expects($this->once())
            ->method('touchTokenActivity')
            ->with('token-id', self::INACTIVITY_TIMEOUT);

        $event = $this->createMock(JWTDecodedEvent::class);
        $event->method('getPayload')->willReturn([
            'jti'      => 'token-id',
            'iss'      => self::ISSUER,
            'aud'      => self::AUDIENCE,
            'username' => 'test@example.com',
            'pwd_sig'  => $correctSignature,
            'tok_nce'  => $nonce,
        ]);
        $event->expects($this->never())->method('markAsInvalid');

        $subscriber = $this->createSubscriber($userRepository, $revocationStore);
        $subscriber->onJwtDecoded($event);
    }

    public function testOnJwtDecodedInvalidatesWhenNoncePresentsButTokenNonceMissing(): void
    {
        $user = (new User())->setEmail('test@example.com')->setPassword('hashed-password');
        $correctSignature = hash_hmac('sha256', 'hashed-password', self::SECRET);

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findOneBy')->willReturn($user);

        $revocationStore = $this->createMock(JwtRevocationStore::class);
        $revocationStore->method('isTokenIdRevoked')->willReturn(false);
        $revocationStore->method('isTokenActivityActive')->willReturn(true);
        $revocationStore->method('getUserTokenNonce')->willReturn('stored-nonce');

        $event = $this->createMock(JWTDecodedEvent::class);
        $event->method('getPayload')->willReturn([
            'jti'      => 'token-id',
            'iss'      => self::ISSUER,
            'aud'      => self::AUDIENCE,
            'username' => 'test@example.com',
            'pwd_sig'  => $correctSignature,
        ]);
        $event->expects($this->once())->method('markAsInvalid');

        $subscriber = $this->createSubscriber($userRepository, $revocationStore);
        $subscriber->onJwtDecoded($event);
    }

    public function testOnJwtDecodedInvalidatesWhenNonceMismatch(): void
    {
        $user = (new User())->setEmail('test@example.com')->setPassword('hashed-password');
        $correctSignature = hash_hmac('sha256', 'hashed-password', self::SECRET);

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findOneBy')->willReturn($user);

        $revocationStore = $this->createMock(JwtRevocationStore::class);
        $revocationStore->method('isTokenIdRevoked')->willReturn(false);
        $revocationStore->method('isTokenActivityActive')->willReturn(true);
        $revocationStore->method('getUserTokenNonce')->willReturn('stored-nonce');

        $event = $this->createMock(JWTDecodedEvent::class);
        $event->method('getPayload')->willReturn([
            'jti'      => 'token-id',
            'iss'      => self::ISSUER,
            'aud'      => self::AUDIENCE,
            'username' => 'test@example.com',
            'pwd_sig'  => $correctSignature,
            'tok_nce'  => 'wrong-nonce',
        ]);
        $event->expects($this->once())->method('markAsInvalid');

        $subscriber = $this->createSubscriber($userRepository, $revocationStore);
        $subscriber->onJwtDecoded($event);
    }
}
