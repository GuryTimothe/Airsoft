<?php

namespace App\Controller;

use App\Entity\Game;
use App\Entity\User;
use App\Repository\GameRegistrationRepository;
use App\Repository\GameRepository;
use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/exports')]
final class AdminExportController extends AbstractController
{
    public function __construct(
        private readonly GameRepository $gameRepository,
        private readonly UserRepository $userRepository,
        private readonly GameRegistrationRepository $gameRegistrationRepository,
    ) {
    }

    #[Route('/games.csv', methods: ['GET'])]
    public function exportGames(Request $request): StreamedResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $dateFrom = $this->parseDate($request->query->get('dateFrom'), 'dateFrom');
        $dateTo   = $this->parseDate($request->query->get('dateTo'), 'dateTo');

        $games = $this->gameRepository->findForExport($dateFrom, $dateTo);

        return $this->createGamePlayersCsvResponse($games);
    }

    #[Route('/games/{id}/registrations.csv', methods: ['GET'], requirements: ['id' => '\\d+'])]
    public function exportGameRegistrations(int $id): StreamedResponse
    {
        if (
            !$this->isGranted('ROLE_ADMIN')
            && !$this->isGranted('ROLE_SUPER_ADMIN')
            && !$this->isGranted('ROLE_ORGANIZER')
        ) {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');
        }

        $game = $this->gameRepository->find($id);
        if (!$game instanceof Game) {
            throw new NotFoundHttpException('Partie introuvable.');
        }

        $registrations = $this->gameRegistrationRepository->findForGameExport($game);

        return $this->createCsvResponse(
            sprintf('game_%d_registrations_export', $id),
            [
                'registrationId',
                'gameId',
                'gameTitle',
                'userId',
                'lastname',
                'firstname',
                'email',
                'pseudo',
                'role',
                'isPresent',
                'registeredAt',
            ],
            array_map(
                static function ($registration): array {
                    $user = $registration->getUser();

                    return [
                        $registration->getId(),
                        $registration->getGameId(),
                        $registration->getGame()?->getTitle() ?? '',
                        $registration->getUserId(),
                        $user?->getLastname()  ?? '',
                        $user?->getFirstname() ?? '',
                        $user?->getEmail()     ?? '',
                        $user?->getPseudo()    ?? '',
                        $user?->getRole()      ?? '',
                        $registration->isPresent() ? '1' : '0',
                        $registration->getCreatedAt()->format(DATE_ATOM),
                    ];
                },
                $registrations,
            ),
        );
    }

    #[Route('/users.csv', methods: ['GET'])]
    public function exportUsers(Request $request): StreamedResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $queryParams = $request->query->all();
        $isMinor     = $this->parseMinorFilter($request->query->get('ageGroup'));
        $roles       = $this->parseRolesFilter($queryParams['roles'] ?? null);

        $users = $this->userRepository->findForExport($isMinor, $roles);

        return $this->createCsvResponse(
            'users_export',
            [
                'id',
                'lastname',
                'firstname',
                'email',
                'pseudo',
                'phone',
                'dateOfBirth',
                'isMinor',
                'role',
                'canSeePrivate',
                'emergencyContactLastname',
                'emergencyContactFirstname',
                'emergencyContactEmail',
                'emergencyContactPhone',
                'createdAt',
                'updatedAt',
            ],
            array_map(
                fn (User $user): array => [
                    $user->getId(),
                    $user->getLastname(),
                    $user->getFirstname(),
                    $user->getEmail(),
                    $user->getPseudo() ?? '',
                    $user->getPhone()  ?? '',
                    $user->getDateOfBirth()->format('Y-m-d'),
                    $this->isMinor($user) ? '1' : '0',
                    $user->getRole(),
                    $user->getCanSeePrivate() ? '1' : '0',
                    $user->getEmergencyContactLastname()      ?? '',
                    $user->getEmergencyContactFirstname()     ?? '',
                    $user->getEmergencyContactEmail()         ?? '',
                    $user->getEmergencyContactPhone()         ?? '',
                    $user->getCreatedAt()?->format(DATE_ATOM) ?? '',
                    $user->getUpdatedAt()?->format(DATE_ATOM) ?? '',
                ],
                $users,
            ),
        );
    }

    private function parseDate(mixed $value, string $parameterName): ?\DateTimeImmutable
    {
        if (null === $value || '' === $value) {
            return null;
        }

        if (!is_string($value)) {
            throw new BadRequestHttpException(sprintf('Le parametre %s est invalide.', $parameterName));
        }

        $date = \DateTimeImmutable::createFromFormat('Y-m-d', $value);
        if (!$date instanceof \DateTimeImmutable || $date->format('Y-m-d') !== $value) {
            throw new BadRequestHttpException(sprintf('Le parametre %s doit etre au format YYYY-MM-DD.', $parameterName));
        }

        return $date;
    }

    /**
     * @return list<string>
     */
    private function parseRolesFilter(mixed $rolesRaw): array
    {
        $roles = [];

        if (is_array($rolesRaw) && [] !== $rolesRaw) {
            foreach ($rolesRaw as $role) {
                if (is_string($role) && '' !== trim($role)) {
                    $roles[] = trim($role);
                }
            }
        } elseif (is_string($rolesRaw) && '' !== trim($rolesRaw)) {
            foreach (explode(',', $rolesRaw) as $role) {
                $trimmedRole = trim($role);
                if ('' !== $trimmedRole) {
                    $roles[] = $trimmedRole;
                }
            }
        }

        return array_values(array_unique($roles));
    }

    private function parseMinorFilter(mixed $value): ?bool
    {
        if (null === $value || '' === $value) {
            return null;
        }

        if (!is_string($value)) {
            throw new BadRequestHttpException('Le filtre ageGroup est invalide.');
        }

        return match (mb_strtolower(trim($value))) {
            'mineur', 'minor'          => true,
            'majeur', 'major', 'adult' => false,
            'tous', 'both', 'all'      => null,
            default                    => throw new BadRequestHttpException('Le filtre ageGroup doit valoir mineur, majeur ou tous.'),
        };
    }

    private function isMinor(User $user): bool
    {
        $today     = new \DateTimeImmutable('today');
        $birthDate = \DateTimeImmutable::createFromInterface($user->getDateOfBirth());

        return $birthDate->diff($today)->y < 18;
    }

    private function computeAge(User $user): int
    {
        $today     = new \DateTimeImmutable('today');
        $birthDate = \DateTimeImmutable::createFromInterface($user->getDateOfBirth());

        return $birthDate->diff($today)->y;
    }

    /**
     * @param list<Game> $games
     */
    private function createGamePlayersCsvResponse(array $games): StreamedResponse
    {
        $response = new StreamedResponse(function () use ($games): void {
            $handle = fopen('php://output', 'wb');

            if (false === $handle) {
                throw new \RuntimeException('Impossible de preparer le flux CSV.');
            }

            fwrite($handle, "\xEF\xBB\xBF");

            foreach ($games as $game) {
                $registrations = $this->gameRegistrationRepository->findForGameExport($game);

                fputcsv($handle, ['Partie', $game->getTitle()], ';');
                fputcsv($handle, ['Adresse', $game->getAddress()], ';');
                fputcsv($handle, ['PAF', number_format($game->getPrice(), 2, '.', '').' EUR'], ';');
                fputcsv($handle, ['Nombre de places', (string) $game->getMaxPlaces()], ';');
                fputcsv($handle, ['Date', $game->getStartDateTime()->format('d/m/Y H:i')], ';');
                fputcsv($handle, [], ';');
                fputcsv($handle, ['Nom', 'Prenom', 'Age', 'Adresse mail', 'Tel', 'Presence'], ';');

                if ([] === $registrations) {
                    fputcsv($handle, ['Aucun joueur inscrit', '', '', '', '', ''], ';');
                }

                foreach ($registrations as $registration) {
                    $user = $registration->getUser();

                    fputcsv($handle, [
                        $user?->getLastname()  ?? '',
                        $user?->getFirstname() ?? '',
                        $user instanceof User ? (string) $this->computeAge($user) : '',
                        $user?->getEmail() ?? '',
                        $user?->getPhone() ?? '',
                        $registration->isPresent() ? 'Present' : 'Absent',
                    ], ';');
                }

                fputcsv($handle, [], ';');
                fputcsv($handle, [], ';');
            }

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set(
            'Content-Disposition',
            sprintf('attachment; filename="games_players_export_%s.csv"', (new \DateTimeImmutable())->format('Ymd_His')),
        );

        return $response;
    }

    /**
     * @param list<string> $headers
     * @param list<array<int, bool|int|float|string|null>> $rows
     */
    private function createCsvResponse(string $filenamePrefix, array $headers, array $rows): StreamedResponse
    {
        $response = new StreamedResponse(function () use ($headers, $rows): void {
            $handle = fopen('php://output', 'wb');

            if (false === $handle) {
                throw new \RuntimeException('Impossible de preparer le flux CSV.');
            }

            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $headers, ';');

            foreach ($rows as $row) {
                fputcsv($handle, $row, ';');
            }

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set(
            'Content-Disposition',
            sprintf('attachment; filename="%s_%s.csv"', $filenamePrefix, (new \DateTimeImmutable())->format('Ymd_His')),
        );

        return $response;
    }
}
