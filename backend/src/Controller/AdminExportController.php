<?php

namespace App\Controller;

use App\Entity\Game;
use App\Entity\User;
use App\Repository\GameRegistrationRepository;
use App\Repository\GameRepository;
use App\Repository\UserRepository;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
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
        #[Autowire(service: 'monolog.logger.security')]
        private readonly LoggerInterface $logger,
        #[Autowire('%kernel.environment%')]
        private readonly string $environment,
        #[Autowire('%kernel.secret%')]
        private readonly string $appSecret,
    ) {
    }

    #[Route('/games.csv', methods: ['GET'])]
    public function exportGames(Request $request): StreamedResponse
    {
        $this->denyAccessUnlessGrantedAdminOrSuperAdminOrOrganizer();

        $dateFrom = $this->parseDate($request->query->get('dateFrom'), 'dateFrom');
        $dateTo   = $this->parseDate($request->query->get('dateTo'), 'dateTo');

        $games = $this->gameRepository->findForExport($dateFrom, $dateTo);

        $this->logAdminAction('SEC.ADMIN.EXPORT_GAMES', $request, [
            'reason_code'     => 'EXPORT_REQUESTED',
            'games_count'     => \count($games),
            'filters_applied' => [
                'dateFrom' => null !== $dateFrom,
                'dateTo'   => null !== $dateTo,
            ],
            'message' => 'Admin exported games CSV.',
        ]);

        return $this->createGamePlayersCsvResponse($games);
    }

    #[Route('/games/{id}/registrations.csv', methods: ['GET'], requirements: ['id' => '\\d+'])]
    public function exportGameRegistrations(int $id, Request $request): StreamedResponse
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

        $this->logAdminAction('SEC.ADMIN.EXPORT_GAME_REGISTRATIONS', $request, [
            'reason_code'         => 'EXPORT_REQUESTED',
            'target_type'         => 'game',
            'target_id_hash'      => hash_hmac('sha256', sprintf('game:%d', $id), $this->appSecret),
            'registrations_count' => \count($registrations),
            'message'             => 'Admin exported game registrations CSV.',
        ]);

        return $this->createCsvResponse(
            sprintf('partie_%d_inscriptions_export', $id),
            [
                'Titre de la partie',
                'Nom',
                'Prénom',
                'Email',
                'Pseudo',
                'Rôle',
                'Présence',
                'Inscription le',
            ],
            array_map(
                static function ($registration): array {
                    $user = $registration->getUser();

                    return [
                        $registration->getGame()?->getTitle() ?? '',
                        $user?->getLastname()                 ?? '',
                        $user?->getFirstname()                ?? '',
                        $user?->getEmail()                    ?? '',
                        $user?->getPseudo()                   ?? '',
                        self::formatRegistrationExportRole($user?->getRole()),
                        $registration->isPresent() ? 'Présent' : 'Absent',
                        $registration->getCreatedAt()->format('d/m/Y H:i'),
                    ];
                },
                $registrations,
            ),
            'dmY',
        );
    }

    #[Route('/users.csv', methods: ['GET'])]
    public function exportUsers(Request $request): StreamedResponse
    {
        $this->denyAccessUnlessGrantedAdminOrSuperAdmin();

        $queryParams = $request->query->all();
        $isMinor     = $this->parseMinorFilter($request->query->get('ageGroup'));
        $roles       = $this->parseRolesFilter($queryParams['roles'] ?? null);

        $users = $this->userRepository->findForExport($isMinor, $roles);

        $this->logAdminAction('SEC.ADMIN.EXPORT_USERS', $request, [
            'reason_code'     => 'EXPORT_REQUESTED',
            'users_count'     => \count($users),
            'filters_applied' => [
                'ageGroup' => null !== $isMinor,
                'roles'    => []   !== $roles,
            ],
            'message' => 'Admin exported users CSV.',
        ]);

        return $this->createCsvResponse(
            'utilisateurs_export',
            [
                'Nom',
                'Prénom',
                'Email',
                'Pseudo',
                'Tel',
                'Date de naissance',
                'Âge',
                'Rôle',
                'Accès parties privées',
                'Contact d\'urgence : Nom',
                'Contact d\'urgence : Prénom',
                'Contact d\'urgence : Email',
                'Contact d\'urgence : Tel',
                'Création du compte le',
            ],
            array_map(
                fn (User $user): array => [
                    $user->getLastname(),
                    $user->getFirstname(),
                    $user->getEmail(),
                    $user->getPseudo() ?? '',
                    self::formatSpreadsheetText($user->getPhone()),
                    $user->getDateOfBirth()->format('Y-m-d'),
                    $this->isMinor($user) ? 'Mineur' : 'Majeur',
                    self::formatRegistrationExportRole($user->getRole()),
                    $user->getCanSeePrivate() ? 'Autorisé' : 'Refusé',
                    $user->getEmergencyContactLastname()  ?? '',
                    $user->getEmergencyContactFirstname() ?? '',
                    $user->getEmergencyContactEmail()     ?? '',
                    self::formatSpreadsheetText($user->getEmergencyContactPhone()),
                    $user->getCreatedAt()?->format('d/m/Y') ?? '',
                ],
                $users,
            ),
            'dmY',
        );
    }

    private function denyAccessUnlessGrantedAdminOrSuperAdmin(): void
    {
        if ($this->isGranted('ROLE_ADMIN') || $this->isGranted('ROLE_SUPER_ADMIN')) {
            return;
        }

        $this->denyAccessUnlessGranted('ROLE_ADMIN');
    }

    private static function formatRegistrationExportRole(?string $role): string
    {
        return match ($role) {
            'ROLE_USER'        => 'utilisateur',
            'ROLE_ADMIN'       => 'admin',
            'ROLE_SUPER_ADMIN' => 'super admin',
            'ROLE_ORGANIZER'   => 'organisateur',
            default            => $role ?? '',
        };
    }

    private static function formatSpreadsheetText(?string $value): string
    {
        if (null === $value || '' === $value) {
            return '';
        }

        return sprintf('="%s"', str_replace('"', '""', $value));
    }

    private function denyAccessUnlessGrantedAdminOrSuperAdminOrOrganizer(): void
    {
        if (
            $this->isGranted('ROLE_ADMIN')
            || $this->isGranted('ROLE_SUPER_ADMIN')
            || $this->isGranted('ROLE_ORGANIZER')
        ) {
            return;
        }

        $this->denyAccessUnlessGranted('ROLE_ADMIN');
    }

    /**
     * @param array<string, mixed> $context
     */
    private function logAdminAction(string $eventId, ?Request $request, array $context): void
    {
        $actor       = $this->getUser();
        $actorIdHash = null;
        if ($actor instanceof User && null !== $actor->getId()) {
            $actorIdHash = hash_hmac('sha256', sprintf('user:%d', $actor->getId()), $this->appSecret);
        }

        $baseContext = [
            'event_id'       => $eventId,
            'event_category' => 'admin_action',
            'severity'       => 'WARNING',
            'outcome'        => 'success',
            'action'         => 'export',
            'service'        => 'backend-api',
            'environment'    => $this->environment,
            'actor_type'     => $actor instanceof User ? 'user' : 'anonymous',
            'actor_id_hash'  => $actorIdHash,
        ];

        if ($request instanceof Request) {
            $baseContext['request_id']       = (string) ($request->headers->get('X-Request-Id') ?? '');
            $baseContext['correlation_id']   = (string) ($request->headers->get('X-Correlation-Id') ?? '');
            $baseContext['http_method']      = $request->getMethod();
            $baseContext['http_path']        = $request->getPathInfo();
            $baseContext['source_ip_masked'] = $this->maskIp($request->getClientIp());
            $baseContext['http_status']      = 200;
        }

        $this->logger->warning('Security admin action executed.', array_merge($baseContext, $context));
    }

    private function maskIp(?string $ip): string
    {
        if (null === $ip || '' === $ip) {
            return 'unknown';
        }

        if (false !== filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $parts = explode('.', $ip);
            if (4 === \count($parts)) {
                return sprintf('%s.%s.%s.0/24', $parts[0], $parts[1], $parts[2]);
            }
        }

        if (false !== filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $parts = explode(':', $ip);
            if (\count($parts) >= 3) {
                return sprintf('%s:%s:%s::/48', $parts[0], $parts[1], $parts[2]);
            }
        }

        return 'unknown';
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

                $gameTitle     = $game->getTitle();
                $gameAddress   = $game->getAddress();
                $gamePrice     = $game->getPrice();
                $gameMaxPlaces = $game->getMaxPlaces();
                $gameDate      = $game->getStartDateTime()->format('d/m/Y H:i');

                fputcsv($handle, ['Partie', $gameTitle], ';', '"', '');
                fputcsv($handle, ['Adresse', $gameAddress], ';', '"', '');
                fputcsv($handle, ['PAF', number_format($gamePrice, 2, '.', '').' EUR'], ';', '"', '');
                fputcsv($handle, ['Nombre de places', (string) $gameMaxPlaces], ';', '"', '');
                fputcsv($handle, ['Date', $gameDate], ';', '"', '');
                fputcsv($handle, [], ';', '"', '');
                fputcsv($handle, ['Nom', 'Prénom', 'Âge', 'Email', 'Tel', 'Présence'], ';', '"', '');

                if ([] === $registrations) {
                    fputcsv($handle, ['Aucun joueur inscrit', '', '', '', '', ''], ';', '"', '');
                }

                foreach ($registrations as $registration) {
                    $user = $registration->getUser();

                    fputcsv($handle, [
                        $user?->getLastname()  ?? '',
                        $user?->getFirstname() ?? '',
                        $user instanceof User ? ($this->isMinor($user) ? 'Mineur' : 'Majeur') : '',
                        $user?->getEmail() ?? '',
                        $user?->getPhone() ?? '',
                        $registration->isPresent() ? 'Present' : 'Absent',
                    ], ';', '"', '');
                }

                fputcsv($handle, [], ';', '"', '');
                fputcsv($handle, [], ';', '"', '');
            }

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set(
            'Content-Disposition',
            sprintf('attachment; filename="parties_export_%s.csv"', (new \DateTimeImmutable())->format('dmY')),
        );

        return $response;
    }

    /**
     * @param list<string> $headers
     * @param list<array<int, bool|int|float|string|null>> $rows
     */
    private function createCsvResponse(string $filenamePrefix, array $headers, array $rows, string $filenameDateFormat = 'Ymd_His'): StreamedResponse
    {
        $response = new StreamedResponse(function () use ($headers, $rows): void {
            $handle = fopen('php://output', 'wb');

            if (false === $handle) {
                throw new \RuntimeException('Impossible de preparer le flux CSV.');
            }

            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $headers, ';', '"', '');

            foreach ($rows as $row) {
                fputcsv($handle, $row, ';', '"', '');
            }

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set(
            'Content-Disposition',
            sprintf('attachment; filename="%s_%s.csv"', $filenamePrefix, (new \DateTimeImmutable())->format($filenameDateFormat)),
        );

        return $response;
    }
}
