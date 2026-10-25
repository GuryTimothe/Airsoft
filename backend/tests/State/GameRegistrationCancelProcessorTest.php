<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Delete;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Game;
use App\Entity\GameRegistration;
use App\Entity\User;
use App\State\GameRegistrationCancelProcessor;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

final class GameRegistrationCancelProcessorTest extends TestCase
{
    public function testSuccessfulCancellationSendsEmailToRegisteredUser(): void
    {
        $user = (new User())
            ->setFirstname('Jean')
            ->setEmail('jean@example.com');
        $game = (new Game())
            ->setTitle('Partie test')
            ->setStartDateTime(new \DateTimeImmutable('2026-09-12 14:30:00'));
        $registration = (new GameRegistration())
            ->setUser($user)
            ->setGame($game);
        $operation = new Delete();

        $removeProcessor = $this->createMock(ProcessorInterface::class);
        $removeProcessor->expects($this->once())
            ->method('process')
            ->with($registration, $operation, ['id' => 42], [])
            ->willReturn(null);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())
            ->method('send')
            ->with($this->callback(static function (Email $email): bool {
                return 'Inscription annulée : Partie test' === $email->getSubject()
                    && ['jean@example.com']                === array_map(
                        static fn ($address): string => $address->getAddress(),
                        $email->getTo(),
                    )
                    && str_contains($email->getTextBody() ?? '', '12/09/2026 à 14:30');
            }));

        $processor = new GameRegistrationCancelProcessor(
            $removeProcessor,
            $mailer,
            'noreply@example.com',
            $this->createMock(LoggerInterface::class),
            $this->createSecurity($user),
        );

        $processor->process($registration, $operation, ['id' => 42]);
    }

    public function testFailedCancellationDoesNotSendEmail(): void
    {
        $registration = (new GameRegistration())
            ->setUser((new User())->setEmail('jean@example.com'))
            ->setGame((new Game())->setTitle('Partie test')->setStartDateTime(new \DateTimeImmutable('+1 day')));
        $operation = new Delete();

        $removeProcessor = $this->createMock(ProcessorInterface::class);
        $removeProcessor->method('process')->willThrowException(new \RuntimeException('Suppression impossible'));

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->never())->method('send');

        $processor = new GameRegistrationCancelProcessor(
            $removeProcessor,
            $mailer,
            'noreply@example.com',
            $this->createMock(LoggerInterface::class),
            $this->createSecurity($registration->getUser()),
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Suppression impossible');
        $processor->process($registration, $operation);
    }

    public function testEmailFailureDoesNotFailSuccessfulCancellation(): void
    {
        $registration = (new GameRegistration())
            ->setUser((new User())->setFirstname('Jean')->setEmail('jean@example.com'))
            ->setGame((new Game())->setTitle('Partie test')->setStartDateTime(new \DateTimeImmutable('+1 day')));

        $removeProcessor = $this->createMock(ProcessorInterface::class);
        $removeProcessor->method('process')->willReturn(null);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->method('send')->willThrowException(new \RuntimeException('Serveur mail indisponible'));

        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects($this->once())
            ->method('error')
            ->with(
                'Game registration cancellation email delivery failed.',
                $this->callback(static fn (array $context): bool => 'SEC.GAME.REGISTRATION_CANCELLATION_EMAIL_FAILED' === $context['event_id']
                    && $context['exception'] instanceof \RuntimeException),
            );

        $processor = new GameRegistrationCancelProcessor(
            $removeProcessor,
            $mailer,
            'noreply@example.com',
            $logger,
            $this->createSecurity($registration->getUser()),
        );

        $processor->process($registration, new Delete());
    }

    public function testOrganizerRemovalUsesNeutralMessageWithoutActorIdentity(): void
    {
        $registeredUser = (new User())
            ->setFirstname('Jean')
            ->setEmail('jean@example.com');
        $organizer = (new User())
            ->setFirstname('Alice')
            ->setLastname('Martin')
            ->setRole('ROLE_ORGANIZER');
        $registration = (new GameRegistration())
            ->setUser($registeredUser)
            ->setGame(
                (new Game())
                    ->setTitle('Partie test')
                    ->setStartDateTime(new \DateTimeImmutable('2026-09-12 14:30:00')),
            );

        $removeProcessor = $this->createMock(ProcessorInterface::class);
        $removeProcessor->method('process')->willReturn(null);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())
            ->method('send')
            ->with($this->callback(static function (Email $email): bool {
                $textBody = $email->getTextBody() ?? '';
                $htmlBody = $email->getHtmlBody() ?? '';

                return 'Désinscription : Partie test' === $email->getSubject()
                    && str_contains($textBody, 'Vous avez été désinscrit de la partie "Partie test" par un organisateur.')
                    && !str_contains($textBody, '<strong>')
                    && str_contains($htmlBody, 'Vous avez été désinscrit de la partie <strong>Partie test</strong> par un organisateur.')
                    && !str_contains($textBody.$htmlBody, 'Alice')
                    && !str_contains($textBody.$htmlBody, 'Martin');
            }));

        $processor = new GameRegistrationCancelProcessor(
            $removeProcessor,
            $mailer,
            'noreply@example.com',
            $this->createMock(LoggerInterface::class),
            $this->createSecurity($organizer),
        );

        $processor->process($registration, new Delete());
    }

    private function createSecurity(?User $actor): Security
    {
        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        return $security;
    }
}
