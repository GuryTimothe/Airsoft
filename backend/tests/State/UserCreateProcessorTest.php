<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Post;
use App\Entity\EmailVerificationToken;
use App\Entity\User;
use App\Repository\UserRepository;
use App\State\UserCreateProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\RawMessage;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserCreateProcessorTest extends TestCase
{
    public function testCreatesUnverifiedUserAndSendsEmail(): void
    {
        $admin = (new User())
            ->setFirstname('Alice')
            ->setLastname('Admin')
            ->setEmail('alice.admin@example.com');
        $user = (new User())
            ->setFirstname('Nina')
            ->setLastname('Roux')
            ->setEmail('nina@example.com')
            ->setPassword('plain-password')
            ->setDateOfBirth(new \DateTimeImmutable('1995-04-20'))
            ->setRole('ROLE_ORGANIZER');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager
            ->expects($this->exactly(2))
            ->method('persist')
            ->willReturnCallback(function (object $entity) use ($user): void {
                static $persistedUser = false;

                if (!$persistedUser) {
                    self::assertSame($user, $entity);
                    self::assertFalse($user->isEmailVerified());
                    $persistedUser = true;

                    return;
                }

                self::assertInstanceOf(EmailVerificationToken::class, $entity);
            });
        $entityManager->expects($this->once())->method('flush');

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher
            ->expects($this->once())
            ->method('hashPassword')
            ->with($user, 'plain-password')
            ->willReturn('hashed-password');

        $repository = $this->createMock(UserRepository::class);
        $repository->expects($this->once())->method('findOneBy')->with(['email' => 'nina@example.com'])->willReturn(null);

        $security = $this->createMock(Security::class);
        $security->expects($this->once())->method('getUser')->willReturn($admin);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer
            ->expects($this->once())
            ->method('send')
            ->with($this->isInstanceOf(RawMessage::class));

        $processor = new UserCreateProcessor(
            $entityManager,
            $passwordHasher,
            $repository,
            $security,
            $mailer,
            'no-reply@example.com',
            'https://app.example.com',
            $this->createMock(LoggerInterface::class),
        );

        $result = $processor->process($user, new Post());

        $this->assertSame('hashed-password', $user->getPassword());
        $this->assertTrue($user->getCanSeePrivate());
        $this->assertSame('Un e-mail de confirmation a été envoyé à l’utilisateur. Le compte sera visible après validation de son adresse e-mail.', $result->message);
    }

    public function testRejectsInvitationWhenEmailAlreadyBelongsToUser(): void
    {
        $user = (new User())
            ->setEmail('nina@example.com')
            ->setPassword('plain-password')
            ->setRole('ROLE_USER');

        $entityManager  = $this->createMock(EntityManagerInterface::class);
        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher->method('hashPassword')->willReturn('hashed-password');
        $repository = $this->createMock(UserRepository::class);
        $repository->method('findOneBy')->willReturn(new User());

        $processor = new UserCreateProcessor(
            $entityManager,
            $passwordHasher,
            $repository,
            $this->createMock(Security::class),
            $this->createMock(MailerInterface::class),
            'no-reply@example.com',
            'https://app.example.com',
            $this->createMock(LoggerInterface::class),
        );

        $this->expectException(\ApiPlatform\Validator\Exception\ValidationException::class);

        $processor->process($user, new Post());
    }

    public function testReplacesExistingUnverifiedUserWithSameEmail(): void
    {
        $existingUser = (new User())
            ->setEmail('nina@example.com')
            ->setEmailVerified(false);
        $user = (new User())
            ->setFirstname('Nina')
            ->setLastname('Roux')
            ->setEmail('nina@example.com')
            ->setPassword('plain-password')
            ->setDateOfBirth(new \DateTimeImmutable('1995-04-20'))
            ->setRole('ROLE_USER');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('remove')->with($existingUser);
        $entityManager->expects($this->exactly(2))->method('flush');
        $entityManager->expects($this->exactly(2))->method('persist');

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher->method('hashPassword')->willReturn('hashed-password');
        $repository = $this->createMock(UserRepository::class);
        $repository->method('findOneBy')->willReturn($existingUser);
        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn(null);
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())->method('send');

        $processor = new UserCreateProcessor(
            $entityManager,
            $passwordHasher,
            $repository,
            $security,
            $mailer,
            'no-reply@example.com',
            'https://app.example.com',
            $this->createMock(LoggerInterface::class),
        );

        $processor->process($user, new Post());
    }
}
