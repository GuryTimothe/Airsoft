<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Patch;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Dto\MeEmailUpdateInput;
use App\Dto\MeUpdateOutput;
use App\Entity\User;
use App\State\MeEmailUpdateProcessor;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class MeEmailUpdateProcessorTest extends TestCase
{
    public function testEmailUpdateFailsWhenCurrentPasswordIsMissing(): void
    {
        $payload = new MeEmailUpdateInput();
        $payload->email = 'new@example.com';
        $actor = (new User())
            ->setPassword('hashed-password')
            ->setEmail('old@example.com');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('flush');

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher->expects($this->never())->method('isPasswordValid');

        $jwtManager = $this->createMock(JWTTokenManagerInterface::class);
        $jwtManager->expects($this->never())->method('create');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $processor = new MeEmailUpdateProcessor($entityManager, $passwordHasher, $jwtManager, $security);

        $this->expectException(ValidationException::class);
        $processor->process($payload, new Patch(uriTemplate: '/me/email'), context: [
            'previous_data' => $actor,
        ]);
    }

    public function testEmailUpdateFailsWhenCurrentPasswordIsInvalid(): void
    {
        $payload = new MeEmailUpdateInput();
        $payload->email = 'new@example.com';
        $payload->currentPassword = 'bad-password';
        $actor = (new User())
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

        $jwtManager = $this->createMock(JWTTokenManagerInterface::class);
        $jwtManager->expects($this->never())->method('create');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $processor = new MeEmailUpdateProcessor($entityManager, $passwordHasher, $jwtManager, $security);

        $this->expectException(ValidationException::class);
        $processor->process($payload, new Patch(uriTemplate: '/me/email'), context: [
            'previous_data' => $actor,
        ]);
    }

    public function testEmailUpdateReturnsNewTokenWhenCurrentPasswordIsValid(): void
    {
        $payload = new MeEmailUpdateInput();
        $payload->email = 'new@example.com';
        $payload->currentPassword = 'good-password';
        $actor = (new User())
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

        $jwtManager = $this->createMock(JWTTokenManagerInterface::class);
        $jwtManager
            ->expects($this->once())
            ->method('create')
            ->with($actor)
            ->willReturn('new.jwt.token');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $processor = new MeEmailUpdateProcessor($entityManager, $passwordHasher, $jwtManager, $security);

        $result = $processor->process($payload, new Patch(uriTemplate: '/me/email'), context: [
            'previous_data' => $actor,
        ]);

        $this->assertInstanceOf(MeUpdateOutput::class, $result);
        $this->assertSame($actor, $result->user);
        $this->assertSame('new@example.com', $result->user->getEmail());
        $this->assertSame('new.jwt.token', $result->token);
    }
}
