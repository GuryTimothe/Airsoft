<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Post;
use App\Entity\User;
use App\State\UserCreateProcessor;
use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use ApiPlatform\State\ProcessorInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserCreateProcessorTest extends TestCase
{
    private function createProcessorMock(User $expectedResult): UserCreateProcessor
    {
        /** @var \PHPUnit\Framework\MockObject\MockObject&ProcessorInterface<User,User> $persistProcessor */
        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor->method('process')->willReturnArgument(0);

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher->method('hashPassword')->willReturn('hashed_pw');

        return new UserCreateProcessor($persistProcessor, $passwordHasher);
    }

    public function testHashesPasswordBeforePersisting(): void
    {
        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor->expects($this->once())->method('process')->willReturnArgument(0);

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher
            ->expects($this->once())
            ->method('hashPassword')
            ->willReturn('hashed_secure_password');

        $processor = new UserCreateProcessor($persistProcessor, $passwordHasher);

        $user = new User();
        $user->setRole('ROLE_USER');
        $user->setPassword('plain-password');

        $result = $processor->process($user, new Post());

        $this->assertSame('hashed_secure_password', $result->getPassword());
    }

    public function testSetsCanSeePrivateForOrganizerRole(): void
    {
        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor->method('process')->willReturnArgument(0);

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher->method('hashPassword')->willReturn('hashed');

        $processor = new UserCreateProcessor($persistProcessor, $passwordHasher);

        $user = new User();
        $user->setRole('ROLE_ORGANIZER');
        $user->setPassword('plain');

        $result = $processor->process($user, new Post());

        $this->assertTrue($result->getCanSeePrivate());
    }

    public function testSetsCanSeePrivateForAdminRole(): void
    {
        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor->method('process')->willReturnArgument(0);

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher->method('hashPassword')->willReturn('hashed');

        $processor = new UserCreateProcessor($persistProcessor, $passwordHasher);

        $user = new User();
        $user->setRole('ROLE_ADMIN');
        $user->setPassword('plain');

        $result = $processor->process($user, new Post());

        $this->assertTrue($result->getCanSeePrivate());
    }

    public function testSetsCanSeePrivateForSuperAdminRole(): void
    {
        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor->method('process')->willReturnArgument(0);

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher->method('hashPassword')->willReturn('hashed');

        $processor = new UserCreateProcessor($persistProcessor, $passwordHasher);

        $user = new User();
        $user->setRole('ROLE_SUPER_ADMIN');
        $user->setPassword('plain');

        $result = $processor->process($user, new Post());

        $this->assertTrue($result->getCanSeePrivate());
    }

    public function testDoesNotSetCanSeePrivateForUserRole(): void
    {
        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor->method('process')->willReturnArgument(0);

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher->method('hashPassword')->willReturn('hashed');

        $processor = new UserCreateProcessor($persistProcessor, $passwordHasher);

        $user = new User();
        $user->setRole('ROLE_USER');
        $user->setCanSeePrivate(false);
        $user->setPassword('plain');

        $result = $processor->process($user, new Post());

        $this->assertFalse($result->getCanSeePrivate());
    }
}
