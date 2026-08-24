<?php

namespace App\Tests\Api;

use App\Entity\Game;
use App\Entity\GameRegistration;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class AdminExportControllerTest extends WebTestCase
{
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

        $token = $this->loginAndGetToken($client, $admin->getEmail(), $adminPassword);

        $client->request('GET', '/api/exports/games.csv?dateFrom=2026-07-01&dateTo=2026-07-31', server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ]);

        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame('content-type', 'text/csv; charset=UTF-8');

        $content = (string) $client->getResponse()->getContent();
        self::assertStringStartsWith("\xEF\xBB\xBF", $content);
        self::assertStringContainsString('Included export game', $content);
        self::assertStringNotContainsString('Excluded export game', $content);
        self::assertStringContainsString((string) $includedGame->getId(), $content);
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
        self::assertStringContainsString('Organizer export game', (string) $client->getResponse()->getContent());
        self::assertStringContainsString((string) $game->getId(), (string) $client->getResponse()->getContent());
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

        $token = $this->loginAndGetToken($client, $admin->getEmail(), $adminPassword);

        $client->request('GET', '/api/exports/users.csv?ageGroup=majeur&roles=ROLE_ADMIN', server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ]);

        self::assertResponseIsSuccessful();

        $content = (string) $client->getResponse()->getContent();
        self::assertStringContainsString($adultAdmin->getEmail(), $content);
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

        $content = (string) $client->getResponse()->getContent();
        self::assertStringContainsString($playerOne->getEmail(), $content);
        self::assertStringContainsString($playerTwo->getEmail(), $content);
        self::assertStringContainsString('Registrations export game', $content);
    }

    private function createGame(EntityManagerInterface $entityManager, string $title, string $startDateTime): Game
    {
        $game = new Game();
        $game->setTitle($title);
        $game->setDescription('Test game export');
        $game->setAddress('Terrain export');
        $game->setPrice(10.0);
        $game->setMaxPlaces(20);
        $game->setStartDateTime(new \DateTime($startDateTime));
        $game->setIsPublic(true);

        $entityManager->persist($game);
        $entityManager->flush();

        return $game;
    }

    private function skipIfDatabaseUnavailable(EntityManagerInterface $entityManager): void
    {
        try {
            $connection = $entityManager->getConnection();
            $connection->executeQuery('SELECT 1');

            $schemaManager = $connection->createSchemaManager();
            $tables = array_map('strtolower', $schemaManager->listTableNames());

            if (!in_array('users', $tables, true)) {
                $metadata = $entityManager->getMetadataFactory()->getAllMetadata();
                if ([] === $metadata) {
                    self::markTestSkipped('No Doctrine metadata available to initialize test schema.');

                    return;
                }

                $schemaTool = new SchemaTool($entityManager);
                $schemaTool->createSchema($metadata);
            }

            $this->skipIfRedisUnavailable();
        } catch (\Throwable $exception) {
            self::markTestSkipped('Database is not available for API integration test: '.$exception->getMessage());
        }
    }

    private function skipIfRedisUnavailable(): void
    {
        $redisUrl = $_SERVER['REDIS_URL'] ?? $_ENV['REDIS_URL'] ?? getenv('REDIS_URL');
        if (!\is_string($redisUrl) || '' === trim($redisUrl)) {
            self::markTestSkipped('Redis URL is missing for API integration test.');

            return;
        }

        $host = (string) (parse_url($redisUrl, PHP_URL_HOST) ?: '127.0.0.1');
        $port = (int) (parse_url($redisUrl, PHP_URL_PORT) ?: 6379);

        $socket = @stream_socket_client(
            sprintf('tcp://%s:%d', $host, $port),
            $errorCode,
            $errorMessage,
            0.2
        );

        if (false === $socket) {
            self::markTestSkipped(sprintf('Redis is not available for API integration test: %s', $errorMessage ?: (string) $errorCode));

            return;
        }

        fclose($socket);
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
        $user->setDateOfBirth(new \DateTime($dateOfBirth));
        $user->setRole($role);
        $user->setCanSeePrivate(false);
        $user->setPassword($passwordHasher->hashPassword($user, $plainPassword));

        $entityManager->persist($user);
        $entityManager->flush();

        return [$user, $plainPassword];
    }

    private function loginAndGetToken(KernelBrowser $client, string $email, string $plainPassword): string
    {
        $client->request('GET', '/api/csrf/login');
        self::assertResponseStatusCodeSame(200);

        $csrfPayload = json_decode($client->getResponse()->getContent(), true);
        self::assertIsArray($csrfPayload);
        self::assertArrayHasKey('csrfToken', $csrfPayload);
        self::assertIsString($csrfPayload['csrfToken']);

        $client->jsonRequest('POST', '/api/login', [
            'email'    => $email,
            'password' => $plainPassword,
        ], [
            'HTTP_X_CSRF_TOKEN' => $csrfPayload['csrfToken'],
        ]);

        self::assertResponseStatusCodeSame(200);

        $payload = json_decode($client->getResponse()->getContent(), true);
        self::assertIsArray($payload);
        self::assertArrayHasKey('token', $payload);
        self::assertIsString($payload['token']);

        return $payload['token'];
    }
}
