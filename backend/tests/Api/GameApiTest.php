<?php

namespace App\Tests\Api;

use App\Entity\Game;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class GameApiTest extends WebTestCase
{
    use RequiresIntegrationServices;
    use AuthenticatesThroughTheApi;

    public function testGamesCollectionIsPublicAndHidesPrivateGamesForAnonymous(): void
    {
        $client = static::createClient();
        $entityManager = static::getContainer()->get(EntityManagerInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $publicGame = $this->createGame($entityManager, 'Public game for anonymous', true);
        $privateGame = $this->createGame($entityManager, 'Private game for anonymous', false);

        $client->request('GET', '/api/games');

        self::assertResponseStatusCodeSame(200);

        $ids = $this->extractGameIds($client);
        self::assertContains($publicGame->getId(), $ids);
        self::assertNotContains($privateGame->getId(), $ids);
    }

    public function testGamesCollectionHidesPrivateGamesForAuthenticatedUserWithoutPermission(): void
    {
        $client = static::createClient();
        $container = static::getContainer();

        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $publicGame = $this->createGame($entityManager, 'Public game for regular user', true);
        $privateGame = $this->createGame($entityManager, 'Private game for regular user', false);

        [$user, $plainPassword] = $this->createUser($entityManager, $passwordHasher, false);
        $token = $this->loginAndGetToken($client, $user->getEmail(), $plainPassword);

        $client->request('GET', '/api/games', server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ]);

        self::assertResponseStatusCodeSame(200);

        $ids = $this->extractGameIds($client);
        self::assertContains($publicGame->getId(), $ids);
        self::assertNotContains($privateGame->getId(), $ids);
    }

    public function testGamesCollectionIncludesPrivateGamesForAuthorizedUser(): void
    {
        $client = static::createClient();
        $container = static::getContainer();

        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $publicGame = $this->createGame($entityManager, 'Public game for privileged user', true);
        $privateGame = $this->createGame($entityManager, 'Private game for privileged user', false);

        [$user, $plainPassword] = $this->createUser($entityManager, $passwordHasher, true);
        $token = $this->loginAndGetToken($client, $user->getEmail(), $plainPassword);

        $client->request('GET', '/api/games', server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ]);

        self::assertResponseStatusCodeSame(200);

        $ids = $this->extractGameIds($client);
        self::assertContains($publicGame->getId(), $ids);
        self::assertContains($privateGame->getId(), $ids);
    }

    private function createGame(EntityManagerInterface $entityManager, string $title, bool $isPublic): Game
    {
        $game = new Game();
        $game->setTitle($title);
        $game->setDescription('Visibility test game');
        $game->setAddress('Terrain de test');
        $game->setPrice(10.0);
        $game->setMaxPlaces(10);
        $game->setStartDateTime(new \DateTimeImmutable('+2 days'));
        $game->setIsPublic($isPublic);

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
        bool $canSeePrivate,
    ): array {
        $email = sprintf('games-visibility-%s@example.com', uniqid('', true));
        $plainPassword = 'Password123!';

        $user = new User();
        $user->setLastname('Player');
        $user->setFirstname('Test');
        $user->setEmail($email);
        $user->setDateOfBirth(new \DateTimeImmutable('1993-01-01'));
        $user->setRole('ROLE_USER');
        $user->setCanSeePrivate($canSeePrivate);
        $user->setPassword($passwordHasher->hashPassword($user, $plainPassword));

        $entityManager->persist($user);
        $entityManager->flush();

        return [$user, $plainPassword];
    }

    /**
     * @return list<int>
     */
    private function extractGameIds(KernelBrowser $client): array
    {
        $payload = json_decode($client->getResponse()->getContent(), true);
        self::assertIsArray($payload);
        // API Platform 4 defaults hydra_prefix to false, so collections come
        // back with "member" rather than "hydra:member".
        self::assertArrayHasKey('member', $payload);
        self::assertIsArray($payload['member']);

        $ids = [];
        foreach ($payload['member'] as $member) {
            if (!is_array($member)) {
                continue;
            }

            $id = $member['id'] ?? null;
            if (is_numeric($id)) {
                $ids[] = (int) $id;
            }
        }

        return $ids;
    }
}
