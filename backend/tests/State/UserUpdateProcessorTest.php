<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Patch;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\EmailVerificationToken;
use App\Entity\User;
use App\State\UserUpdateProcessor;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Query;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\RawMessage;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

final class UserUpdateProcessorTest extends TestCase
{
    public function testAdminCanUpdateUserWithoutChangingPasswordAndWithAllowedRole(): void
    {
        $actor    = (new User())->setRole('ROLE_ADMIN');
        $previous = (new User())
            ->setRole('ROLE_USER')
            ->setPassword('hashed-password');
        $data = (new User())
            ->setRole('ROLE_ORGANIZER')
            ->setPassword('hashed-password');

        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor
            ->expects($this->once())
            ->method('process')
            ->with($data, $this->isInstanceOf(Patch::class), [], ['previous_data' => $previous])
            ->willReturn($data);

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $processor = new UserUpdateProcessor($persistProcessor, $security, new NullLogger(), 'test', 'test-secret');

        $this->assertSame($data, $processor->process($data, new Patch(), context: ['previous_data' => $previous]));
    }

    public function testUpdateRejectsPasswordChange(): void
    {
        $actor    = (new User())->setRole('ROLE_SUPER_ADMIN');
        $previous = (new User())
            ->setRole('ROLE_USER')
            ->setPassword('old-hash');
        $data = (new User())
            ->setRole('ROLE_USER')
            ->setPassword('new-hash');

        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor->expects($this->never())->method('process');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $processor = new UserUpdateProcessor($persistProcessor, $security, new NullLogger(), 'test', 'test-secret');

        $this->expectException(AccessDeniedException::class);
        $this->expectExceptionMessage('Password changes are not allowed on this route.');

        $processor->process($data, new Patch(), context: ['previous_data' => $previous]);
    }

    public function testUpdateWithoutPasswordKeepsPreviousPassword(): void
    {
        $actor    = (new User())->setRole('ROLE_ADMIN');
        $previous = (new User())
            ->setRole('ROLE_USER')
            ->setPassword('hashed-password');
        $data = (new User())->setRole('ROLE_USER');

        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor
            ->expects($this->once())
            ->method('process')
            ->with($data, $this->isInstanceOf(Patch::class), [], ['previous_data' => $previous])
            ->willReturn($data);

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $processor = new UserUpdateProcessor($persistProcessor, $security, new NullLogger(), 'test', 'test-secret');

        $result = $processor->process($data, new Patch(), context: ['previous_data' => $previous]);

        $this->assertSame($data, $result);
        $this->assertSame('hashed-password', $result->getPassword());
    }

    public function testAdminEmailChangeKeepsCurrentAddressAndSendsVerification(): void
    {
        $actor = (new User())
            ->setRole('ROLE_ADMIN')
            ->setFirstname('Alice')
            ->setLastname('Admin');
        $previous = (new User())
            ->setRole('ROLE_USER')
            ->setPassword('hashed-password')
            ->setEmail('old@example.com')
            ->setFirstname('Nina');
        $data = (new User())
            ->setRole('ROLE_USER')
            ->setPassword('hashed-password')
            ->setEmail('new@example.com')
            ->setFirstname('Nina');

        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor
            ->expects($this->once())
            ->method('process')
            ->willReturnCallback(function (User $user) use ($data): User {
                self::assertSame($data, $user);
                self::assertSame('old@example.com', $user->getEmail());

                return $user;
            });
        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);
        $query = $this->createMock(Query::class);
        $query->expects($this->once())->method('setParameter')->with('user', $data)->willReturnSelf();
        $query->expects($this->once())->method('execute');
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('createQuery')->willReturn($query);
        $entityManager->expects($this->once())->method('persist')->with($this->isInstanceOf(EmailVerificationToken::class));
        $entityManager->expects($this->once())->method('flush');
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())->method('send')->with($this->isInstanceOf(RawMessage::class));

        $processor = new UserUpdateProcessor(
            $persistProcessor,
            $security,
            new NullLogger(),
            'test',
            'test-secret',
            $entityManager,
            $mailer,
            'no-reply@example.com',
            'https://app.example.com',
        );

        $processor->process($data, new Patch(), context: ['previous_data' => $previous]);
    }

    public function testAdminCannotAssignAdminRole(): void
    {
        $actor    = (new User())->setRole('ROLE_ADMIN');
        $previous = (new User())
            ->setRole('ROLE_USER')
            ->setPassword('hashed-password');
        $data = (new User())
            ->setRole('ROLE_ADMIN')
            ->setPassword('hashed-password');

        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor->expects($this->never())->method('process');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $processor = new UserUpdateProcessor($persistProcessor, $security, new NullLogger(), 'test', 'test-secret');

        $this->expectException(AccessDeniedException::class);
        $this->expectExceptionMessage('Admins can only assign ROLE_USER or ROLE_ORGANIZER.');

        $processor->process($data, new Patch(), context: ['previous_data' => $previous]);
    }

    public function testSuperAdminCanAssignAdminRole(): void
    {
        $actor    = (new User())->setRole('ROLE_SUPER_ADMIN');
        $previous = (new User())
            ->setRole('ROLE_USER')
            ->setPassword('hashed-password');
        $data = (new User())
            ->setRole('ROLE_ADMIN')
            ->setPassword('hashed-password');

        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor
            ->expects($this->once())
            ->method('process')
            ->with($data, $this->isInstanceOf(Patch::class), [], ['previous_data' => $previous])
            ->willReturn($data);

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $processor = new UserUpdateProcessor($persistProcessor, $security, new NullLogger(), 'test', 'test-secret');

        $this->assertSame($data, $processor->process($data, new Patch(), context: ['previous_data' => $previous]));
    }

    public function testThrowsWhenNoPreviousData(): void
    {
        $data  = (new User())->setRole('ROLE_USER');
        $actor = (new User())->setRole('ROLE_ADMIN');

        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor->expects($this->never())->method('process');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $processor = new UserUpdateProcessor($persistProcessor, $security, new NullLogger(), 'test', 'test-secret');

        $this->expectException(\InvalidArgumentException::class);
        $processor->process($data, new Patch(), context: []);
    }

    public function testThrowsWhenNoAuthenticatedUser(): void
    {
        $previous = (new User())->setRole('ROLE_USER')->setPassword('hash');
        $data     = (new User())->setRole('ROLE_USER')->setPassword('hash');

        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor->expects($this->never())->method('process');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn(null);

        $processor = new UserUpdateProcessor($persistProcessor, $security, new NullLogger(), 'test', 'test-secret');

        $this->expectException(\Symfony\Component\Security\Core\Exception\AccessDeniedException::class);
        $processor->process($data, new Patch(), context: ['previous_data' => $previous]);
    }
}
