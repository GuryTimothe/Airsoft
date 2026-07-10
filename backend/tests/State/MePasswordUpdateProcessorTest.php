<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Patch;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Dto\MePasswordUpdateInput;
use App\Dto\MeUpdateOutput;
use App\Entity\User;
use App\Security\Jwt\JwtRevocationStore;
use App\State\MePasswordUpdateProcessor;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class MePasswordUpdateProcessorTest extends TestCase
{
    public function testPasswordUpdateFailsWhenCurrentPasswordIsMissing(): void
    {
        $payload              = new MePasswordUpdateInput();
        $payload->newPassword = 'new-password-123';
        $actor                = (new User())
            ->setPassword('hashed-password')
            ->setEmail('old@example.com');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('flush');

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher->expects($this->never())->method('isPasswordValid');
        $passwordHasher->expects($this->never())->method('hashPassword');

        $jwtManager = $this->createMock(JWTTokenManagerInterface::class);
        $jwtManager->expects($this->never())->method('create');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $jwtRevocationStore = $this->createMock(JwtRevocationStore::class);
        $jwtRevocationStore->expects($this->never())->method('rotateUserTokenNonce');

        $processor = new MePasswordUpdateProcessor($entityManager, $passwordHasher, $jwtManager, $security, $jwtRevocationStore);

        $this->expectException(ValidationException::class);
        $processor->process($payload, new Patch(uriTemplate: '/me/password'), context: [
            'previous_data' => $actor,
        ]);
    }

    public function testPasswordUpdateFailsWhenCurrentPasswordIsInvalid(): void
    {
        $payload                  = new MePasswordUpdateInput();
        $payload->currentPassword = 'bad-password';
        $payload->newPassword     = 'new-password-123';
        $actor                    = (new User())
            ->setPassword('hashed-password')
            ->setEmail('old@example.com');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('flush');

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher
            ->expects($this->once())
            ->method('isPasswordValid')
            ->with($actor, 'bad-password')
            ->willReturn(false);
        $passwordHasher->expects($this->never())->method('hashPassword');

        $jwtManager = $this->createMock(JWTTokenManagerInterface::class);
        $jwtManager->expects($this->never())->method('create');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $jwtRevocationStore = $this->createMock(JwtRevocationStore::class);
        $jwtRevocationStore->expects($this->never())->method('rotateUserTokenNonce');

        $processor = new MePasswordUpdateProcessor($entityManager, $passwordHasher, $jwtManager, $security, $jwtRevocationStore);

        $this->expectException(ValidationException::class);
        $processor->process($payload, new Patch(uriTemplate: '/me/password'), context: [
            'previous_data' => $actor,
        ]);
    }

    public function testPasswordUpdateReturnsNewTokenWhenCurrentPasswordIsValid(): void
    {
        $payload                  = new MePasswordUpdateInput();
        $payload->currentPassword = 'good-password';
        $payload->newPassword     = 'new-password-123';
        $actor                    = (new User())
            ->setPassword('hashed-password')
            ->setEmail('old@example.com');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('flush');

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher
            ->expects($this->once())
            ->method('isPasswordValid')
            ->with($actor, 'good-password')
            ->willReturn(true);
        $passwordHasher
            ->expects($this->once())
            ->method('hashPassword')
            ->with($actor, 'new-password-123')
            ->willReturn('new-hashed-password');

        $jwtManager = $this->createMock(JWTTokenManagerInterface::class);
        $jwtManager
            ->expects($this->once())
            ->method('create')
            ->with($actor)
            ->willReturn('new.jwt.token');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $jwtRevocationStore = $this->createMock(JwtRevocationStore::class);
        $jwtRevocationStore
            ->expects($this->once())
            ->method('rotateUserTokenNonce')
            ->with($actor)
            ->willReturn('rotated-nonce');

        $processor = new MePasswordUpdateProcessor($entityManager, $passwordHasher, $jwtManager, $security, $jwtRevocationStore);

        $result = $processor->process($payload, new Patch(uriTemplate: '/me/password'), context: [
            'previous_data' => $actor,
        ]);

        $this->assertInstanceOf(MeUpdateOutput::class, $result);
        $this->assertSame($actor, $result->user);
        $this->assertSame('new-hashed-password', $result->user->getPassword());
        $this->assertSame('new.jwt.token', $result->token);
    }

    public function testPasswordUpdateFailsWhenNewPasswordIsEmpty(): void
    {
        $payload                  = new MePasswordUpdateInput();
        $payload->currentPassword = 'good-password';
        $payload->newPassword     = '';
        $actor                    = (new User())
            ->setPassword('hashed-password')
            ->setEmail('old@example.com');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('flush');

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher->method('isPasswordValid')->willReturn(true);
        $passwordHasher->expects($this->never())->method('hashPassword');

        $jwtManager        = $this->createMock(JWTTokenManagerInterface::class);
        $security          = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);
        $jwtRevocationStore = $this->createMock(JwtRevocationStore::class);

        $processor = new MePasswordUpdateProcessor($entityManager, $passwordHasher, $jwtManager, $security, $jwtRevocationStore);

        $this->expectException(ValidationException::class);
        $processor->process($payload, new Patch(uriTemplate: '/me/password'), context: [
            'previous_data' => $actor,
        ]);
    }

    public function testResolvesUserFromSecurityWhenNoPreviousData(): void
    {
        $payload                  = new MePasswordUpdateInput();
        $payload->currentPassword = 'good-password';
        $payload->newPassword     = 'new-password-123';
        $actor                    = (new User())
            ->setPassword('hashed-password')
            ->setEmail('old@example.com');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('flush');

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher->method('isPasswordValid')->willReturn(true);
        $passwordHasher->method('hashPassword')->willReturn('hashed');

        $jwtManager = $this->createMock(JWTTokenManagerInterface::class);
        $jwtManager->method('create')->willReturn('token');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $jwtRevocationStore = $this->createMock(JwtRevocationStore::class);
        $jwtRevocationStore->method('rotateUserTokenNonce')->willReturn('nonce');

        $processor = new MePasswordUpdateProcessor($entityManager, $passwordHasher, $jwtManager, $security, $jwtRevocationStore);

        $result = $processor->process($payload, new Patch(uriTemplate: '/me/password'), context: []);

        $this->assertInstanceOf(MeUpdateOutput::class, $result);
    }
}
