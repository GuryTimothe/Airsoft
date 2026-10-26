<?php

namespace App\Tests\Api;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UsersEndpointTest extends WebTestCase
{
    use RequiresIntegrationServices;
    use AuthenticatesThroughTheApi;

    public function testUsersCollectionExposesCanSeePrivate(): void
    {
        $client = static::createClient();

        $container = static::getContainer();
        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $adminEmail = sprintf('users-collection-admin-%s@example.com', uniqid('', true));
        $adminPassword = 'AdminUsers123!';
        $targetEmail = sprintf('users-collection-target-%s@example.com', uniqid('', true));

        $this->createUser($entityManager, $passwordHasher, $adminEmail, $adminPassword, 'ROLE_ADMIN', true);
        $this->createUser($entityManager, $passwordHasher, $targetEmail, 'TargetUsers123!', 'ROLE_USER', true);

        $token = $this->loginAndGetToken($client, $adminEmail, $adminPassword);

        $client->request('GET', '/api/users', server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ]);

        self::assertResponseStatusCodeSame(200);

        $payload = json_decode($client->getResponse()->getContent(), true);
        self::assertIsArray($payload);
        // API Platform 4 defaults hydra_prefix to false.
        self::assertArrayHasKey('member', $payload);
        self::assertIsArray($payload['member']);

        $targetUserPayload = null;
        foreach ($payload['member'] as $userPayload) {
            if (is_array($userPayload) && ($userPayload['email'] ?? null) === $targetEmail) {
                $targetUserPayload = $userPayload;
                break;
            }
        }

        self::assertIsArray($targetUserPayload);
        self::assertArrayHasKey('canSeePrivate', $targetUserPayload);
        self::assertTrue($targetUserPayload['canSeePrivate']);
    }

    private function createUser(
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        string $email,
        string $plainPassword,
        string $role,
        bool $canSeePrivate,
    ): User {
        $user = new User();
        $user->setLastname('Collection');
        $user->setFirstname('User');
        $user->setEmail($email);
        $user->setDateOfBirth(new \DateTimeImmutable('1990-01-01'));
        $user->setRole($role);
        $user->setCanSeePrivate($canSeePrivate);
        $user->setPassword($passwordHasher->hashPassword($user, $plainPassword));

        $entityManager->persist($user);
        $entityManager->flush();

        return $user;
    }
}
