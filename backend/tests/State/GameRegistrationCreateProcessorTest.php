<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Post;
use App\Dto\GameRegistrationInput;
use App\Entity\Game;
use App\Entity\GameRegistration;
use App\Entity\User;
use App\Repository\GameRegistrationRepository;
use App\Repository\GameRepository;
use App\State\GameRegistrationCreateProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class GameRegistrationCreateProcessorTest extends TestCase
{
    private function createGame(bool $isPublic = true, int $maxPlaces = 20): Game
    {
        $game = new Game();
        $game->setTitle('Test');
        $game->setAddress('Terrain');
        $game->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $game->setPrice(10.0);
        $game->setMaxPlaces($maxPlaces);
        $game->setIsPublic($isPublic);

        return $game;
    }

    private function createProcessor(
        ?User $user,
        ?Game $game,
        ?GameRegistration $existing = null,
        int $registrationCount = 0,
        bool $isAdmin = false,
    ): GameRegistrationCreateProcessor {
        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($user);
        $security->method('isGranted')->willReturnCallback(function (string $attr, mixed $subject = null) use ($isAdmin) {
            if ('REGISTER_GAME' === $attr) {
                return $subject instanceof Game && ($subject->isPublic() || $isAdmin);
            }

            return $isAdmin && \in_array($attr, ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'], true);
        });

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        $gameRepo = $this->createMock(GameRepository::class);
        $gameRepo->method('find')->willReturn($game);

        $registrationRepo = $this->createMock(GameRegistrationRepository::class);
        $registrationRepo->method('findOneBy')->willReturn($existing);
        $registrationRepo->method('countByGame')->willReturn($registrationCount);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $mailer        = $this->createMock(MailerInterface::class);
        $logger        = $this->createMock(LoggerInterface::class);

        return new GameRegistrationCreateProcessor($security, $validator, $gameRepo, $registrationRepo, $entityManager, $mailer, 'noreply@example.com', $logger);
    }

    public function testThrowsBadRequestWhenGameReferenceIsInvalid(): void
    {
        $user      = new User();
        $processor = $this->createProcessor($user, null);

        $input       = new GameRegistrationInput();
        $input->game = 'not-a-valid-reference';

        $this->expectException(BadRequestHttpException::class);
        $processor->process($input, new Post());
    }

    public function testThrowsBadRequestWhenGameReferenceIsEmpty(): void
    {
        $user      = new User();
        $processor = $this->createProcessor($user, null);

        $input       = new GameRegistrationInput();
        $input->game = '';

        $this->expectException(BadRequestHttpException::class);
        $processor->process($input, new Post());
    }

    public function testThrowsNotFoundWhenGameDoesNotExist(): void
    {
        $user      = new User();
        $processor = $this->createProcessor($user, null);

        $input       = new GameRegistrationInput();
        $input->game = '42';

        $this->expectException(NotFoundHttpException::class);
        $processor->process($input, new Post());
    }

    public function testThrowsAccessDeniedWhenUnauthenticated(): void
    {
        $processor = $this->createProcessor(null, $this->createGame());

        $input       = new GameRegistrationInput();
        $input->game = '1';

        $this->expectException(AccessDeniedHttpException::class);
        $processor->process($input, new Post());
    }

    public function testThrowsConflictWhenAlreadyRegistered(): void
    {
        $user      = new User();
        $game      = $this->createGame();
        $existing  = new GameRegistration();
        $processor = $this->createProcessor($user, $game, $existing);

        $input       = new GameRegistrationInput();
        $input->game = '/api/games/1';

        $this->expectException(ConflictHttpException::class);
        $this->expectExceptionMessage('déjà inscrit');
        $processor->process($input, new Post());
    }

    public function testThrowsAccessDeniedWhenGameIsPrivateAndUserCannotSeePrivate(): void
    {
        $user      = (new User())->setCanSeePrivate(false);
        $game      = $this->createGame(false);
        $processor = $this->createProcessor($user, $game);

        $input       = new GameRegistrationInput();
        $input->game = '1';

        $this->expectException(AccessDeniedHttpException::class);
        $this->expectExceptionMessage('partie privée');
        $processor->process($input, new Post());
    }

    public function testThrowsConflictWhenGameIsFull(): void
    {
        $user      = new User();
        $game      = $this->createGame(true, 5);
        $processor = $this->createProcessor($user, $game, null, 5, false);

        $input       = new GameRegistrationInput();
        $input->game = '1';

        $this->expectException(ConflictHttpException::class);
        $this->expectExceptionMessage('plus de place');
        $processor->process($input, new Post());
    }

    public function testSuccessfulRegistrationWithNumericGameId(): void
    {
        $user = (new User())
            ->setFirstname('Jean')
            ->setEmail('jean@example.com');
        $game = $this->createGame(true, 20);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('persist');
        $entityManager->expects($this->once())->method('flush');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($user);
        $security->method('isGranted')->willReturnCallback(function (string $attr, mixed $subject = null) {
            return 'REGISTER_GAME' === $attr && $subject instanceof Game && $subject->isPublic();
        });

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        $gameRepo = $this->createMock(GameRepository::class);
        $gameRepo->method('find')->willReturn($game);

        $registrationRepo = $this->createMock(GameRegistrationRepository::class);
        $registrationRepo->method('findOneBy')->willReturn(null);
        $registrationRepo->method('countByGame')->willReturn(0);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())
            ->method('send')
            ->with($this->callback(static function (Email $email): bool {
                return 'Inscription confirmée : Test' === $email->getSubject()
                    && ['jean@example.com']           === array_map(
                        static fn ($address): string => $address->getAddress(),
                        $email->getTo(),
                    );
            }));
        $logger = $this->createMock(LoggerInterface::class);

        $processor = new GameRegistrationCreateProcessor($security, $validator, $gameRepo, $registrationRepo, $entityManager, $mailer, 'noreply@example.com', $logger);

        $input       = new GameRegistrationInput();
        $input->game = '1';

        $result = $processor->process($input, new Post());

        $this->assertInstanceOf(GameRegistration::class, $result);
        $this->assertSame($game, $result->getGame());
        $this->assertSame($user, $result->getUser());
    }

    public function testSuccessfulRegistrationWithIriGameReference(): void
    {
        $user = (new User())
            ->setFirstname('Jean')
            ->setEmail('jean@example.com');
        $game = $this->createGame(true, 20);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('persist');
        $entityManager->expects($this->once())->method('flush');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($user);
        $security->method('isGranted')->willReturnCallback(function (string $attr, mixed $subject = null) {
            return 'REGISTER_GAME' === $attr && $subject instanceof Game && $subject->isPublic();
        });

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        $gameRepo = $this->createMock(GameRepository::class);
        $gameRepo->method('find')->willReturn($game);

        $registrationRepo = $this->createMock(GameRegistrationRepository::class);
        $registrationRepo->method('findOneBy')->willReturn(null);
        $registrationRepo->method('countByGame')->willReturn(0);

        $mailer = $this->createMock(MailerInterface::class);
        $logger = $this->createMock(LoggerInterface::class);

        $processor = new GameRegistrationCreateProcessor($security, $validator, $gameRepo, $registrationRepo, $entityManager, $mailer, 'noreply@example.com', $logger);

        $input       = new GameRegistrationInput();
        $input->game = '/api/games/42';

        $result = $processor->process($input, new Post());

        $this->assertInstanceOf(GameRegistration::class, $result);
    }

    public function testAdminCanRegisterWhenGameIsFull(): void
    {
        $user = (new User())
            ->setFirstname('Admin')
            ->setEmail('admin@example.com')
            ->setRole('ROLE_ADMIN');
        $game = $this->createGame(true, 1);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('persist');
        $entityManager->expects($this->once())->method('flush');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($user);
        $security->method('isGranted')->willReturn(true);

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        $gameRepo = $this->createMock(GameRepository::class);
        $gameRepo->method('find')->willReturn($game);

        $registrationRepo = $this->createMock(GameRegistrationRepository::class);
        $registrationRepo->method('findOneBy')->willReturn(null);
        $registrationRepo->method('countByGame')->willReturn(1);

        $mailer = $this->createMock(MailerInterface::class);
        $logger = $this->createMock(LoggerInterface::class);

        $processor = new GameRegistrationCreateProcessor($security, $validator, $gameRepo, $registrationRepo, $entityManager, $mailer, 'noreply@example.com', $logger);

        $input       = new GameRegistrationInput();
        $input->game = '1';

        $result = $processor->process($input, new Post());
        $this->assertInstanceOf(GameRegistration::class, $result);
    }
}
