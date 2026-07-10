<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Dto\GameRegistrationInput;
use App\Entity\GameRegistration;
use App\Entity\User;
use App\Repository\GameRegistrationRepository;
use App\Repository\GameRepository;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * @implements ProcessorInterface<GameRegistrationInput, GameRegistration>
 */
class GameRegistrationCreateProcessor implements ProcessorInterface
{
    public function __construct(
        private Security $security,
        private ValidatorInterface $validator,
        private GameRepository $gameRepository,
        private GameRegistrationRepository $gameRegistrationRepository,
        private EntityManagerInterface $entityManager,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        /** @var GameRegistrationInput $data */

        $violations = $this->validator->validate($data);
        if (count($violations) > 0) {
            throw new ValidationException($violations);
        }

        $user = $this->security->getUser();
        if (!$user instanceof User) {
            throw new AccessDeniedHttpException('Vous devez être connecté pour vous inscrire.');
        }

        $gameId = $this->extractGameId($data->game ?? '');
        if (null === $gameId) {
            throw new BadRequestHttpException('La référence de partie est invalide.');
        }

        $game = $this->gameRepository->find($gameId);
        if (null === $game) {
            throw new NotFoundHttpException('Partie introuvable.');
        }

        if (!$game->isPublic() && !$this->security->isGranted('ROLE_ADMIN') && !$user->getCanSeePrivate()) {
            throw new AccessDeniedHttpException('Vous ne pouvez pas vous inscrire à cette partie privée.');
        }

        $existing = $this->gameRegistrationRepository->findOneBy([
            'game' => $game,
            'user' => $user,
        ]);
        if (null !== $existing) {
            throw new ConflictHttpException('Vous êtes déjà inscrit à cette partie.');
        }

        if (
            !$this->security->isGranted('ROLE_ADMIN')
            && !$this->security->isGranted('ROLE_SUPER_ADMIN')
            && $this->gameRegistrationRepository->countByGame($game) >= $game->getMaxPlaces()
        ) {
            throw new ConflictHttpException('Il n\'y a plus de place disponible pour cette partie.');
        }

        $registration = new GameRegistration();
        $registration->setGame($game);
        $registration->setUser($user);
        $registration->setIsPresent(false);

        try {
            $this->entityManager->persist($registration);
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            throw new ConflictHttpException('Vous êtes déjà inscrit à cette partie.');
        }

        return $registration;
    }

    private function extractGameId(string $gameReference): ?int
    {
        $trimmed = trim($gameReference);
        if ('' === $trimmed) {
            return null;
        }

        if (ctype_digit($trimmed)) {
            return (int) $trimmed;
        }

        if (preg_match('#^/api/games/(?<id>\d+)$#', $trimmed, $matches)) {
            return (int) $matches['id'];
        }

        return null;
    }
}
