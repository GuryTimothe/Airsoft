<?php

namespace App\Tests\Api;

use App\Entity\Game;
use App\Entity\GameRegistration;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class GameRegistrationApiTest extends WebTestCase
{
    use RequiresIntegrationServices;
    use AuthenticatesThroughTheApi;

    public function testRegistrationRequiresAuthentication(): void
    {
        $client = static::createClient();
        $entityManager = static::getContainer()->get(EntityManagerInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $game = $this->createGame($entityManager, 'Game auth required', 10);

        // Carries a CSRF token so the request reaches the firewall: without one
        // LoginCsrfRequestSubscriber answers 403 before authentication runs,
        // which says nothing about whether the endpoint requires a login.
        $client->jsonRequest('POST', '/api/game_registrations', [
            'game' => '/api/games/'.$game->getId(),
        ], [
            'HTTP_X_CSRF_TOKEN' => $this->fetchCsrfToken($client),
        ]);

        self::assertResponseStatusCodeSame(401);
    }

    public function testUserCanRegisterCancelAndFullCapacityBlocksAdditionalRegistration(): void
    {
        $client = static::createClient();
        $container = static::getContainer();

        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $game = $this->createGame($entityManager, 'Game limited', 1);
        [$playerOne, $playerOnePassword] = $this->createUser($entityManager, $passwordHasher, 'ROLE_USER');
        [$playerTwo, $playerTwoPassword] = $this->createUser($entityManager, $passwordHasher, 'ROLE_USER');

        $playerOneToken = $this->loginAndGetToken($client, $playerOne->getEmail(), $playerOnePassword);

        $client->jsonRequest('POST', '/api/game_registrations', [
            'game' => '/api/games/'.$game->getId(),
        ], [
            'HTTP_AUTHORIZATION' => 'Bearer '.$playerOneToken,
        ]);

        self::assertResponseStatusCodeSame(201);

        $registrationPayload = json_decode($client->getResponse()->getContent(), true);
        self::assertIsArray($registrationPayload);
        self::assertArrayHasKey('id', $registrationPayload);
        self::assertIsNumeric($registrationPayload['id']);

        $playerTwoToken = $this->loginAndGetToken($client, $playerTwo->getEmail(), $playerTwoPassword);

        $client->jsonRequest('POST', '/api/game_registrations', [
            'game' => '/api/games/'.$game->getId(),
        ], [
            'HTTP_AUTHORIZATION' => 'Bearer '.$playerTwoToken,
        ]);

        self::assertResponseStatusCodeSame(409);

        $client->request('DELETE', '/api/game_registrations/'.$registrationPayload['id'], server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$playerOneToken,
        ]);

        self::assertResponseStatusCodeSame(204);
    }

    public function testAdminCanForceCancelAnotherPlayerRegistration(): void
    {
        $client = static::createClient();
        $container = static::getContainer();

        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $game = $this->createGame($entityManager, 'Game admin cancel', 10);
        [$admin, $adminPassword] = $this->createUser($entityManager, $passwordHasher, 'ROLE_ADMIN');
        [$player] = $this->createUser($entityManager, $passwordHasher, 'ROLE_USER');

        $registration = new GameRegistration();
        $registration->setGame($game);
        $registration->setUser($player);
        $entityManager->persist($registration);
        $entityManager->flush();

        $adminToken = $this->loginAndGetToken($client, $admin->getEmail(), $adminPassword);

        $client->request('DELETE', '/api/game_registrations/'.$registration->getId(), server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$adminToken,
        ]);

        self::assertResponseStatusCodeSame(204);
        self::assertNull($entityManager->find(GameRegistration::class, $registration->getId()));
    }

    public function testAdminCanRegisterToPublicGame(): void
    {
        $client = static::createClient();
        $container = static::getContainer();

        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $game = $this->createGame($entityManager, 'Game admin register', 10);
        [$admin, $adminPassword] = $this->createUser($entityManager, $passwordHasher, 'ROLE_ADMIN');
        $adminToken = $this->loginAndGetToken($client, $admin->getEmail(), $adminPassword);

        $client->jsonRequest('POST', '/api/game_registrations', [
            'game' => '/api/games/'.$game->getId(),
        ], [
            'HTTP_AUTHORIZATION' => 'Bearer '.$adminToken,
        ]);

        self::assertResponseStatusCodeSame(201);

        $registrationPayload = json_decode($client->getResponse()->getContent(), true);
        self::assertIsArray($registrationPayload);
        self::assertSame($admin->getId(), $registrationPayload['userId'] ?? null);
        self::assertSame($game->getId(), $registrationPayload['gameId'] ?? null);
    }

    public function testAdminCanRegisterToFullPublicGame(): void
    {
        $client = static::createClient();
        $container = static::getContainer();

        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $game = $this->createGame($entityManager, 'Game admin full register', 1);
        [$admin, $adminPassword] = $this->createUser($entityManager, $passwordHasher, 'ROLE_ADMIN');
        [$player] = $this->createUser($entityManager, $passwordHasher, 'ROLE_USER');

        $registration = new GameRegistration();
        $registration->setGame($game);
        $registration->setUser($player);
        $entityManager->persist($registration);
        $entityManager->flush();

        $adminToken = $this->loginAndGetToken($client, $admin->getEmail(), $adminPassword);

        $client->jsonRequest('POST', '/api/game_registrations', [
            'game' => '/api/games/'.$game->getId(),
        ], [
            'HTTP_AUTHORIZATION' => 'Bearer '.$adminToken,
        ]);

        self::assertResponseStatusCodeSame(201);
    }

    public function testRegularUserCannotRegisterToPrivateGame(): void
    {
        $client = static::createClient();
        $container = static::getContainer();

        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $game = $this->createGame($entityManager, 'Private game', 10);
        $game->setIsPublic(false);
        $entityManager->flush();

        [$player, $playerPassword] = $this->createUser($entityManager, $passwordHasher, 'ROLE_USER');
        $token = $this->loginAndGetToken($client, $player->getEmail(), $playerPassword);

        $client->jsonRequest('POST', '/api/game_registrations', [
            'game' => '/api/games/'.$game->getId(),
        ], [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ]);

        self::assertResponseStatusCodeSame(403);
    }

    public function testMyRegistrationsEndpointReturnsOnlyCurrentUserRegistrations(): void
    {
        $client = static::createClient();
        $container = static::getContainer();

        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $game = $this->createGame($entityManager, 'Game my registrations', 10);
        [$playerOne, $playerOnePassword] = $this->createUser($entityManager, $passwordHasher, 'ROLE_USER');
        [$playerTwo] = $this->createUser($entityManager, $passwordHasher, 'ROLE_USER');

        $registrationOne = new GameRegistration();
        $registrationOne->setGame($game);
        $registrationOne->setUser($playerOne);
        $entityManager->persist($registrationOne);

        $registrationTwo = new GameRegistration();
        $registrationTwo->setGame($game);
        $registrationTwo->setUser($playerTwo);
        $entityManager->persist($registrationTwo);
        $entityManager->flush();

        $token = $this->loginAndGetToken($client, $playerOne->getEmail(), $playerOnePassword);

        $client->request('GET', '/api/game_registrations/mine', server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ]);

        self::assertResponseStatusCodeSame(200);

        $payload = json_decode($client->getResponse()->getContent(), true);
        self::assertIsArray($payload);
        // API Platform 4 defaults hydra_prefix to false.
        self::assertArrayHasKey('member', $payload);
        self::assertIsArray($payload['member']);
        self::assertCount(1, $payload['member']);
        self::assertSame($playerOne->getId(), $payload['member'][0]['userId'] ?? null);
    }

    public function testAdminCanToggleRegistrationPresenceTrueAndFalse(): void
    {
        $client = static::createClient();
        $container = static::getContainer();

        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $game = $this->createGame($entityManager, 'Game presence toggle', 10);
        [$admin, $adminPassword] = $this->createUser($entityManager, $passwordHasher, 'ROLE_ADMIN');
        [$player] = $this->createUser($entityManager, $passwordHasher, 'ROLE_USER');

        $registration = new GameRegistration();
        $registration->setGame($game);
        $registration->setUser($player);
        $entityManager->persist($registration);
        $entityManager->flush();

        self::assertFalse($registration->isPresent());

        $adminToken = $this->loginAndGetToken($client, $admin->getEmail(), $adminPassword);

        $client->request('PATCH', '/api/game_registrations/'.$registration->getId(), server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$adminToken,
            'CONTENT_TYPE' => 'application/merge-patch+json',
        ], content: json_encode(['isPresent' => true], JSON_THROW_ON_ERROR));

        self::assertResponseStatusCodeSame(200);

        self::assertTrue($this->isPresentInDatabase((int) $registration->getId()));

        $client->request('PATCH', '/api/game_registrations/'.$registration->getId(), server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$adminToken,
            'CONTENT_TYPE' => 'application/merge-patch+json',
        ], content: json_encode(['present' => false], JSON_THROW_ON_ERROR));

        self::assertResponseStatusCodeSame(200);

        self::assertFalse($this->isPresentInDatabase((int) $registration->getId()));
    }

    public function testOrganizerCanToggleRegistrationPresence(): void
    {
        $client = static::createClient();
        $container = static::getContainer();

        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $game = $this->createGame($entityManager, 'Organizer presence toggle', 10);
        [$organizer, $organizerPassword] = $this->createUser($entityManager, $passwordHasher, 'ROLE_ORGANIZER');
        [$player] = $this->createUser($entityManager, $passwordHasher, 'ROLE_USER');

        $registration = new GameRegistration();
        $registration->setGame($game);
        $registration->setUser($player);
        $entityManager->persist($registration);
        $entityManager->flush();

        $organizerToken = $this->loginAndGetToken($client, $organizer->getEmail(), $organizerPassword);

        $client->request('PATCH', '/api/game_registrations/'.$registration->getId(), server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$organizerToken,
            'CONTENT_TYPE' => 'application/merge-patch+json',
        ], content: json_encode(['isPresent' => true], JSON_THROW_ON_ERROR));

        self::assertResponseStatusCodeSame(200);

        self::assertTrue($this->isPresentInDatabase((int) $registration->getId()));

        $client->request('GET', '/api/game_registrations?game.id='.$game->getId(), server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$organizerToken,
        ]);

        self::assertResponseIsSuccessful();
        self::assertStringContainsString('"isPresent":true', (string) $client->getResponse()->getContent());
    }

    private function createGame(EntityManagerInterface $entityManager, string $title, int $maxPlaces): Game
    {
        $game = new Game();
        $game->setTitle($title);
        $game->setDescription('Test game');
        $game->setAddress('Terrain de test');
        $game->setPrice(10.0);
        $game->setMaxPlaces($maxPlaces);
        $game->setStartDateTime(new \DateTimeImmutable('+2 days'));
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
    ): array {
        $email = sprintf('registration-%s@example.com', uniqid('', true));
        $plainPassword = 'Password123!';

        $user = new User();
        $user->setLastname('Player');
        $user->setFirstname('Test');
        $user->setEmail($email);
        $user->setDateOfBirth(new \DateTimeImmutable('1993-01-01'));
        $user->setRole($role);
        $user->setCanSeePrivate(false);
        $user->setPassword($passwordHasher->hashPassword($user, $plainPassword));

        $entityManager->persist($user);
        $entityManager->flush();

        return [$user, $plainPassword];
    }

    /**
     * Every request reboots the kernel, so the entity manager captured at the
     * top of a test, and the entities it loaded, are detached by the time the
     * response comes back: refresh() on one throws "is not managed". This reads
     * the row again through the container the last request left behind.
     */
    private function isPresentInDatabase(int $registrationId): bool
    {
        $entityManager = static::getContainer()->get(EntityManagerInterface::class);
        $entityManager->clear();

        $registration = $entityManager->find(GameRegistration::class, $registrationId);
        self::assertNotNull($registration);

        return $registration->isPresent();
    }
}
