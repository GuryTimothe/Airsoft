<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Game;
use App\Entity\GameRegistration;
use App\Entity\User;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

/**
 * @implements ProcessorInterface<GameRegistration, void>
 */
final class GameRegistrationCancelProcessor implements ProcessorInterface
{
    /**
     * @param ProcessorInterface<GameRegistration, void> $removeProcessor
     */
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.remove_processor')]
        private ProcessorInterface $removeProcessor,
        private MailerInterface $mailer,
        #[Autowire('%env(MAILER_FROM)%')]
        private string $mailerFrom,
        #[Autowire(service: 'monolog.logger.security')]
        private LoggerInterface $logger,
        private Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        $user = $data->getUser();
        $game = $data->getGame();

        $this->removeProcessor->process($data, $operation, $uriVariables, $context);

        if ($user instanceof User && $game instanceof Game) {
            $this->sendCancellationEmail($user, $game, $this->wasRemovedByOrganizer($user));
        }
    }

    private function wasRemovedByOrganizer(User $registeredUser): bool
    {
        $actor = $this->security->getUser();
        if (!$actor instanceof User || $actor === $registeredUser) {
            return false;
        }

        return array_intersect($actor->getRoles(), ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ORGANIZER']) !== [];
    }

    private function sendCancellationEmail(User $user, Game $game, bool $removedByOrganizer): void
    {
        $date          = $game->getStartDateTime();
        $formattedDate = $date->format('d/m/Y à H:i');
        $textMessage   = $removedByOrganizer
            ? sprintf('Vous avez été désinscrit de la partie "%s" par un organisateur.', $game->getTitle())
            : sprintf('Votre inscription à la partie "%s" du %s a bien été annulée.', $game->getTitle(), $formattedDate);
        $htmlMessage = $removedByOrganizer
            ? sprintf(
                'Vous avez été désinscrit de la partie <strong>%s</strong> par un organisateur.',
                htmlspecialchars($game->getTitle(), ENT_QUOTES),
            )
            : sprintf(
                'Votre inscription à la partie <strong>%s</strong> du %s a bien été annulée.',
                htmlspecialchars($game->getTitle(), ENT_QUOTES),
                htmlspecialchars($formattedDate, ENT_QUOTES),
            );
        $subject = $removedByOrganizer
            ? sprintf('Désinscription : %s', $game->getTitle())
            : sprintf('Inscription annulée : %s', $game->getTitle());

        try {
            $this->mailer->send(
                (new Email())
                    ->from($this->mailerFrom)
                    ->to($user->getEmail())
                    ->subject($subject)
                    ->text(sprintf("Bonjour %s,\n\n%s\n\nÀ bientôt !", $user->getFirstname(), $textMessage))
                    ->html(sprintf(
                        '<p>Bonjour %s,</p><p>%s</p><p>À bientôt !</p>',
                        htmlspecialchars($user->getFirstname(), ENT_QUOTES),
                        $htmlMessage,
                    )),
            );
        } catch (\Throwable $exception) {
            $this->logger->error('Game registration cancellation email delivery failed.', [
                'event_id'  => 'SEC.GAME.REGISTRATION_CANCELLATION_EMAIL_FAILED',
                'exception' => $exception,
            ]);
        }
    }
}
