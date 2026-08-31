<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Dto\GameRegistrationInput;
use App\Entity\Game;
use App\Entity\GameRegistration;
use App\Entity\User;
use App\Repository\GameRegistrationRepository;
use App\Repository\GameRepository;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
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
        private MailerInterface $mailer,
        #[Autowire('%env(MAILER_FROM)%')]
        private string $mailerFrom,
        #[Autowire(service: 'monolog.logger.security')]
        private LoggerInterface $logger,
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

        if (!$this->security->isGranted('REGISTER_GAME', $game)) {
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

        $this->sendConfirmationEmail($user, $game);

        return $registration;
    }

    private const DAYS = [
        'Sunday'   => 'dimanche', 'Monday' => 'lundi', 'Tuesday' => 'mardi', 'Wednesday' => 'mercredi',
        'Thursday' => 'jeudi', 'Friday' => 'vendredi', 'Saturday' => 'samedi',
    ];

    private const MONTHS = [
        1 => 'janvier', 2 => 'février', 3 => 'mars', 4 => 'avril', 5 => 'mai', 6 => 'juin',
        7 => 'juillet', 8 => 'août', 9 => 'septembre', 10 => 'octobre', 11 => 'novembre', 12 => 'décembre',
    ];

    private function sendConfirmationEmail(User $user, Game $game): void
    {
        $date          = $game->getStartDateTime();
        $formattedDate = sprintf(
            '%s %d %s %d à %s',
            self::DAYS[$date->format('l')],
            (int) $date->format('j'),
            self::MONTHS[(int) $date->format('n')],
            (int) $date->format('Y'),
            $date->format('H:i'),
        );

        try {
            $this->mailer->send(
                (new Email())
                    ->from($this->mailerFrom)
                    ->to($user->getEmail())
                    ->subject(sprintf('Inscription confirmée : %s', $game->getTitle()))
                    ->text(sprintf("Bonjour %s,\n\nVous êtes bien inscrit(e) à la partie \"%s\".\n\nDate : %s\n\nÀ bientôt !", $user->getFirstname(), $game->getTitle(), $formattedDate))
                    ->html(sprintf(
                        '<p>Bonjour %s,</p><p>Vous êtes bien inscrit(e) à la partie <strong>%s</strong>.</p><p>Date : %s</p><p>À bientôt !</p>',
                        htmlspecialchars($user->getFirstname(), ENT_QUOTES),
                        htmlspecialchars($game->getTitle(), ENT_QUOTES),
                        htmlspecialchars($formattedDate, ENT_QUOTES),
                    )),
            );
        } catch (\Throwable $exception) {
            $this->logger->error('Game registration confirmation email delivery failed.', [
                'event_id'  => 'SEC.GAME.REGISTRATION_EMAIL_FAILED',
                'exception' => $exception,
            ]);
        }
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
