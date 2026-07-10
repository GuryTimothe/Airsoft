<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Post;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Dto\GameRegistrationInput;
use App\Entity\Game;
use App\Entity\GameRegistration;
use App\Entity\User;
use App\Repository\GameRegistrationRepository;
use App\Repository\GameRepository;
use App\State\GameRegistrationCreateProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
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
        $security->method('isGranted')->willReturnCallback(function (string $attr) use ($isAdmin) {
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

        return new GameRegistrationCreateProcessor($security, $validator, $gameRepo, $registrationRepo, $entityManager);
    }

    public function testThrowsBadRequestWhenGameReferenceIsInvalid(): void
    {
        $user = new User();
        $processor = $this->createProcessor($user, null);

        $input = new GameRegistrationInput();
        $input->game = 'not-a-valid-reference';

        $this->expectException(BadRequestHttpException::class);
        $processor->process($input, new Post());
    }

    public function testThrowsBadRequestWhenGameReferenceIsEmpty(): void
    {
        $user = new User();
        $processor = $this->createProcessor($user, null);

        $input = new GameRegistrationInput();
        $input->game = '';

        $this->expectException(BadRequestHttpException::class);
        $processor->process($input, new Post());
    }

    public function testThrowsNotFoundWhenGameDoesNotExist(): void
    {
        $user = new User();
        $processor = $this->createProcessor($user, null);

        $input = new GameRegistrationInput();
        $input->game = '42';

        $this->expectException(NotFoundHttpException::class);
        $processor->process($input, new Post());
    }

    public function testThrowsAccessDeniedWhenUnauthenticated(): void
    {
        $processor = $this->createProcessor(null, $this->createGame());

        $input = new GameRegistrationInput();
        $input->game = '1';

        $this->expectException(AccessDeniedHttpException::class);
        $processor->process($input, new Post());
    }

    public function testThrowsConflictWhenAlreadyRegistered(): void
    {
        $user = new User();
        $game = $this->createGame();
        $existing = new GameRegistration();
        $processor = $this->createProcessor($user, $game, $existing);

        $input = new GameRegistrationInput();
        $input->game = '/api/games/1';

        $this->expectException(ConflictHttpException::class);
        $this->expectExceptionMessage('déjà inscrit');
        $processor->process($input, new Post());
    }

    public function testThrowsAccessDeniedWhenGameIsPrivateAndUserCannotSeePrivate(): void
    {
        $user = (new User())->setCanSeePrivate(false);
        $game = $this->createGame(false);
        $processor = $this->createProcessor($user, $game);

        $input = new GameRegistrationInput();
        $input->game = '1';

        $this->expectException(AccessDeniedHttpException::class);
        $this->expectExceptionMessage('partie privée');
        $processor->process($input, new Post());
    }

    public function testThrowsConflictWhenGameIsFull(): void
    {
        $user = new User();
        $game = $this->createGame(true, 5);
        $processor = $this->createProcessor($user, $game, null, 5, false);

        $input = new GameRegistrationInput();
        $input->game = '1';

        $this->expectException(ConflictHttpException::class);
        $this->expectExceptionMessage('plus de place');
        $processor->process($input, new Post());
    }

    public function testSuccessfulRegistrationWithNumericGameId(): void
    {
        $user = new User();
        $game = $this->createGame(true, 20);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('persist');
        $entityManager->expects($this->once())->method('flush');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($user);
        $security->method('isGranted')->willReturn(false);

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        $gameRepo = $this->createMock(GameRepository::class);
        $gameRepo->method('find')->willReturn($game);

        $registrationRepo = $this->createMock(GameRegistrationRepository::class);
        $registrationRepo->method('findOneBy')->willReturn(null);
        $registrationRepo->method('countByGame')->willReturn(0);

        $processor = new GameRegistrationCreateProcessor($security, $validator, $gameRepo, $registrationRepo, $entityManager);

        $input = new GameRegistrationInput();
        $input->game = '1';

        $result = $processor->process($input, new Post());

        $this->assertInstanceOf(GameRegistration::class, $result);
        $this->assertSame($game, $result->getGame());
        $this->assertSame($user, $result->getUser());
    }

    public function testSuccessfulRegistrationWithIriGameReference(): void
    {
        $user = new User();
        $game = $this->createGame(true, 20);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('persist');
        $entityManager->expects($this->once())->method('flush');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($user);
        $security->method('isGranted')->willReturn(false);

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        $gameRepo = $this->createMock(GameRepository::class);
        $gameRepo->method('find')->willReturn($game);

        $registrationRepo = $this->createMock(GameRegistrationRepository::class);
        $registrationRepo->method('findOneBy')->willReturn(null);
        $registrationRepo->method('countByGame')->willReturn(0);

        $processor = new GameRegistrationCreateProcessor($security, $validator, $gameRepo, $registrationRepo, $entityManager);

        $input = new GameRegistrationInput();
        $input->game = '/api/games/42';

        $result = $processor->process($input, new Post());

        $this->assertInstanceOf(GameRegistration::class, $result);
    }

    public function testAdminCanRegisterWhenGameIsFull(): void
    {
        $user = (new User())->setRole('ROLE_ADMIN');
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

        $processor = new GameRegistrationCreateProcessor($security, $validator, $gameRepo, $registrationRepo, $entityManager);

        $input = new GameRegistrationInput();
        $input->game = '1';

        $result = $processor->process($input, new Post());
        $this->assertInstanceOf(GameRegistration::class, $result);
    }
}
