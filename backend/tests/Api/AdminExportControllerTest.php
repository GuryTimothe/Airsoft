<?php

namespace App\Tests\Api;

use App\Entity\Game;
use App\Entity\GameRegistration;
use App\Entity\EmergencyContact;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class AdminExportControllerTest extends WebTestCase
{
    use RequiresIntegrationServices;
    use AuthenticatesThroughTheApi;

    public function testAnonymousCannotExportGames(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/exports/games.csv');

        self::assertResponseStatusCodeSame(401);
    }

    public function testUserCannotExportUsers(): void
    {
        $client    = static::createClient();
        $container = static::getContainer();

        $entityManager  = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        [$user, $plainPassword] = $this->createUser($entityManager, $passwordHasher, 'ROLE_USER', '1990-01-01');
        $token                  = $this->loginAndGetToken($client, $user->getEmail(), $plainPassword);

        $client->request('GET', '/api/exports/users.csv', server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ]);

        self::assertResponseStatusCodeSame(403);
    }

    public function testAdminCanExportGamesFilteredByDate(): void
    {
        $client    = static::createClient();
        $container = static::getContainer();

        $entityManager  = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        [$admin, $adminPassword] = $this->createUser($entityManager, $passwordHasher, 'ROLE_ADMIN', '1990-01-01');
        $includedGame            = $this->createGame($entityManager, 'Included export game', '2026-07-12 10:00:00');
        $this->createGame($entityManager, 'Excluded export game', '2026-08-15 10:00:00');

        // The age column only appears on a player row, so the game needs one
        // registration for the "Majeur" assertion below to mean anything.
        [$adultPlayer] = $this->createUser($entityManager, $passwordHasher, 'ROLE_USER', '1993-01-01');
        $registration  = new GameRegistration();
        $registration->setGame($includedGame);
        $registration->setUser($adultPlayer);
        $entityManager->persist($registration);
        $entityManager->flush();

        $token = $this->loginAndGetToken($client, $admin->getEmail(), $adminPassword);

        $client->request('GET', '/api/exports/games.csv?dateFrom=2026-07-01&dateTo=2026-07-31', server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ]);

        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame('content-type', 'text/csv; charset=UTF-8');
        self::assertResponseHeaderSame(
            'content-disposition',
            sprintf('attachment; filename="parties_export_%s.csv"', (new \DateTimeImmutable())->format('dmY')),
        );

        $content = $this->streamedContent($client);
        self::assertStringStartsWith("\xEF\xBB\xBF", $content);
        self::assertStringContainsString('Included export game', $content);
        self::assertStringContainsString('Nom;Prénom;Âge;Email;Tel;Présence', $content);
        self::assertStringContainsString('Majeur', $content);
        self::assertStringNotContainsString('Excluded export game', $content);
    }

    public function testOrganizerCanExportGames(): void
    {
        $client    = static::createClient();
        $container = static::getContainer();

        $entityManager  = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        [$organizer, $organizerPassword] = $this->createUser($entityManager, $passwordHasher, 'ROLE_ORGANIZER', '1990-01-01');
        $game                            = $this->createGame($entityManager, 'Organizer export game', '2026-07-20 10:00:00');

        $token = $this->loginAndGetToken($client, $organizer->getEmail(), $organizerPassword);

        $client->request('GET', '/api/exports/games.csv', server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ]);

        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame('content-type', 'text/csv; charset=UTF-8');
        $content = $this->streamedContent($client);
        self::assertStringContainsString('Organizer export game', $content);
    }

    public function testAdminCanExportUsersFilteredByAgeGroupAndRole(): void
    {
        $client    = static::createClient();
        $container = static::getContainer();

        $entityManager  = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        [$admin, $adminPassword] = $this->createUser($entityManager, $passwordHasher, 'ROLE_ADMIN', '1990-01-01');
        [$adultAdmin]            = $this->createUser($entityManager, $passwordHasher, 'ROLE_ADMIN', '1992-02-02');
        [$minorAdmin]            = $this->createUser($entityManager, $passwordHasher, 'ROLE_ADMIN', '2012-02-02');
        [$adultUser]             = $this->createUser($entityManager, $passwordHasher, 'ROLE_USER', '1995-02-02');
        // The "Accès parties privées" column reads Refusé for everyone unless a
        // user actually has the flag, which the "Autorisé" assertion below needs.
        $adultAdmin->setCanSeePrivate(true);
        $adultAdmin->setPhone('0612345678');
        $adultAdmin->setEmergencyContact(
            (new EmergencyContact())
                ->setLastname('Contact')
                ->setFirstname('Urgence')
                ->setEmail('contact-export@example.com')
                ->setPhone('0712345678')
        );
        $entityManager->flush();

        $token = $this->loginAndGetToken($client, $admin->getEmail(), $adminPassword);

        $client->request('GET', '/api/exports/users.csv?ageGroup=majeur&roles=ROLE_ADMIN', server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ]);

        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame(
            'content-disposition',
            sprintf('attachment; filename="utilisateurs_export_%s.csv"', (new \DateTimeImmutable())->format('dmY')),
        );

        $content = $this->streamedContent($client);
        $header = strtok(substr($content, 3), "\n");
        self::assertSame('Nom;Prénom;Email;Pseudo;Tel;"Date de naissance";Âge;Rôle;"Accès parties privées";"Contact d\'urgence : Nom";"Contact d\'urgence : Prénom";"Contact d\'urgence : Email";"Contact d\'urgence : Tel";"Création du compte le"', rtrim((string) $header, "\r"));
        self::assertStringContainsString($adultAdmin->getEmail(), $content);
        self::assertStringContainsString('admin', $content);
        self::assertStringNotContainsString('ROLE_ADMIN', $content);
        self::assertStringContainsString('Majeur', $content);
        self::assertStringContainsString('Autorisé', $content);
        self::assertStringContainsString('=""0612345678""', $content);
        self::assertStringContainsString('=""0712345678""', $content);
        self::assertStringContainsString($adultAdmin->getCreatedAt()?->format('d/m/Y') ?? '', $content);
        self::assertStringNotContainsString($adultAdmin->getCreatedAt()?->format(DATE_ATOM) ?? '', $content);
        self::assertStringNotContainsString('updatedAt', $content);
        self::assertStringNotContainsString($minorAdmin->getEmail(), $content);
        self::assertStringNotContainsString($adultUser->getEmail(), $content);
    }

    public function testAdminCanExportRegistrationsForAGame(): void
    {
        $client    = static::createClient();
        $container = static::getContainer();

        $entityManager  = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        [$admin, $adminPassword] = $this->createUser($entityManager, $passwordHasher, 'ROLE_ADMIN', '1990-01-01');
        [$playerOne]             = $this->createUser($entityManager, $passwordHasher, 'ROLE_USER', '1993-01-01');
        [$playerTwo]             = $this->createUser($entityManager, $passwordHasher, 'ROLE_USER', '1994-01-01');
        $game                    = $this->createGame($entityManager, 'Registrations export game', '2026-07-20 10:00:00');

        $registrationOne = new GameRegistration();
        $registrationOne->setGame($game);
        $registrationOne->setUser($playerOne);
        $registrationOne->setIsPresent(true);
        $entityManager->persist($registrationOne);

        $registrationTwo = new GameRegistration();
        $registrationTwo->setGame($game);
        $registrationTwo->setUser($playerTwo);
        $registrationTwo->setIsPresent(false);
        $entityManager->persist($registrationTwo);
        $entityManager->flush();

        $token = $this->loginAndGetToken($client, $admin->getEmail(), $adminPassword);

        $client->request('GET', '/api/exports/games/'.$game->getId().'/registrations.csv', server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ]);

        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame(
            'content-disposition',
            sprintf('attachment; filename="partie_%d_inscriptions_export_%s.csv"', $game->getId(), (new \DateTimeImmutable())->format('dmY')),
        );

        $content = $this->streamedContent($client);
        $header = strtok(substr($content, 3), "\n");
        self::assertSame('"Titre de la partie";Nom;Prénom;Email;Pseudo;Rôle;Présence;"Inscription le"', rtrim((string) $header, "\r"));
        self::assertStringContainsString($playerOne->getEmail(), $content);
        self::assertStringContainsString($playerTwo->getEmail(), $content);
        self::assertStringContainsString('utilisateur', $content);
        self::assertStringNotContainsString('ROLE_USER', $content);
        self::assertStringContainsString('Présent', $content);
        self::assertStringContainsString('Absent', $content);
        self::assertStringContainsString('Registrations export game', $content);
        self::assertMatchesRegularExpression('/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/', $content);
        self::assertStringNotContainsString($registrationOne->getCreatedAt()->format(DATE_ATOM), $content);
    }

    private function createGame(EntityManagerInterface $entityManager, string $title, string $startDateTime): Game
    {
        $game = new Game();
        $game->setTitle($title);
        $game->setDescription('Test game export');
        $game->setAddress('Terrain export');
        $game->setPrice(10.0);
        $game->setMaxPlaces(20);
        $game->setStartDateTime(new \DateTimeImmutable($startDateTime));
        $game->setIsPublic(true);

        $entityManager->persist($game);
        $entityManager->flush();

        return $game;
    }

    /**
     * @return array{0: User, 1: string}
     */
    private function createUser(
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        string $role,
        string $dateOfBirth,
    ): array {
        $email         = sprintf('export-%s@example.com', uniqid('', true));
        $plainPassword = 'Password123!';

        $user = new User();
        $user->setLastname('Export');
        $user->setFirstname('User');
        $user->setEmail($email);
        $user->setDateOfBirth(new \DateTimeImmutable($dateOfBirth));
        $user->setRole($role);
        $user->setCanSeePrivate(false);
        $user->setPassword($passwordHasher->hashPassword($user, $plainPassword));

        $entityManager->persist($user);
        $entityManager->flush();

        return [$user, $plainPassword];
    }

    /**
     * The export controllers return a StreamedResponse, whose body a callback
     * writes when the response is sent. getResponse()->getContent() is empty
     * for one: the browser already ran that callback during the request and
     * kept the output (HttpKernelBrowser::filterResponse), and a stream is only
     * sent once. The captured body is on the BrowserKit response.
     */
    private function streamedContent(KernelBrowser $client): string
    {
        return (string) $client->getInternalResponse()->getContent();
    }
}
