<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Patch;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Dto\MeEmailUpdateInput;
use App\Dto\MeUpdateOutput;
use App\Entity\EmailVerificationToken;
use App\Entity\User;
use App\Repository\UserRepository;
use App\State\MeEmailUpdateProcessor;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Query;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\RawMessage;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class MeEmailUpdateProcessorTest extends TestCase
{
    public function testEmailChangeKeepsCurrentEmailAndSendsVerification(): void
    {
        $payload = new MeEmailUpdateInput();
        $payload->email = 'new@example.com';
        $payload->currentPassword = 'good-password';
        $actor = (new User())
            ->setFirstname('Alex')
            ->setEmail('old@example.com')
            ->setPassword('hashed-password');

        $query = $this->createMock(Query::class);
        $query->expects($this->once())->method('setParameter')->with('user', $actor)->willReturnSelf();
        $query->expects($this->once())->method('execute');
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('createQuery')->willReturn($query);
        $entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->isInstanceOf(EmailVerificationToken::class));
        $entityManager->expects($this->once())->method('flush');

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher->expects($this->once())->method('isPasswordValid')->with($actor, 'good-password')->willReturn(true);
        $repository = $this->createMock(UserRepository::class);
        $repository->expects($this->once())->method('findOneBy')->with(['email' => 'new@example.com'])->willReturn(null);
        $jwtManager = $this->createMock(JWTTokenManagerInterface::class);
        $jwtManager->expects($this->once())->method('create')->with($actor)->willReturn('renewed.jwt.token');
        $security = $this->createMock(Security::class);
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())->method('send')->with($this->isInstanceOf(RawMessage::class));

        $processor = new MeEmailUpdateProcessor(
            $entityManager,
            $passwordHasher,
            $jwtManager,
            $security,
            $repository,
            $mailer,
            'no-reply@example.com',
            'https://app.example.com',
            $this->createMock(LoggerInterface::class),
        );

        $result = $processor->process($payload, new Patch(uriTemplate: '/me/email'), context: ['previous_data' => $actor]);

        $this->assertInstanceOf(MeUpdateOutput::class, $result);
        $this->assertSame('old@example.com', $result->user->getEmail());
        $this->assertSame('renewed.jwt.token', $result->token);
    }

    public function testEmailChangeFailsWhenCurrentPasswordIsInvalid(): void
    {
        $payload = new MeEmailUpdateInput();
        $payload->email = 'new@example.com';
        $payload->currentPassword = 'bad-password';
        $actor = (new User())->setEmail('old@example.com')->setPassword('hashed-password');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('persist');
        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher->expects($this->once())->method('isPasswordValid')->willReturn(false);

        $processor = new MeEmailUpdateProcessor(
            $entityManager,
            $passwordHasher,
            $this->createMock(JWTTokenManagerInterface::class),
            $this->createMock(Security::class),
            $this->createMock(UserRepository::class),
            $this->createMock(MailerInterface::class),
            'no-reply@example.com',
            'https://app.example.com',
            $this->createMock(LoggerInterface::class),
        );

        $this->expectException(ValidationException::class);
        $processor->process($payload, new Patch(uriTemplate: '/me/email'), context: ['previous_data' => $actor]);
    }
}
