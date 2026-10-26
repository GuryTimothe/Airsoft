<?php

namespace App\Tests\Api;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class MeEndpointTest extends WebTestCase
{
    use RequiresIntegrationServices;
    use AuthenticatesThroughTheApi;

    public function testGetMeDoesNotExposeCanSeePrivate(): void
    {
        $client = static::createClient();

        $container = static::getContainer();
        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $email = sprintf('me-read-%s@example.com', uniqid('', true));
        $plainPassword = 'ReadMe123!';

        $this->createUser($entityManager, $passwordHasher, $email, $plainPassword);
        $token = $this->loginAndGetToken($client, $email, $plainPassword);

        $client->request('GET', '/api/me', server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ]);

        self::assertResponseStatusCodeSame(200);

        $payload = json_decode($client->getResponse()->getContent(), true);
        self::assertIsArray($payload);
        self::assertArrayNotHasKey('canSeePrivate', $payload);
        self::assertArrayNotHasKey('can_see_private', $payload);
        self::assertSame('ROLE_USER', $payload['role']);
        self::assertSame($email, $payload['email']);
    }

    public function testDeleteMeRemovesAccountAndPreventsFutureLogin(): void
    {
        $client = static::createClient();

        $container = static::getContainer();
        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);
        $userRepository = $container->get(UserRepository::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $email = sprintf('me-delete-%s@example.com', uniqid('', true));
        $plainPassword = 'DeleteMe123!';

        $user = $this->createUser($entityManager, $passwordHasher, $email, $plainPassword);

        $token = $this->loginAndGetToken($client, $email, $plainPassword);

        $client->request('DELETE', '/api/me', server: [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ]);

        self::assertResponseStatusCodeSame(204);
        self::assertNull($userRepository->find($user->getId()));

        // Deliberately not loginAndGetToken: this login has to fail. It still
        // needs a CSRF token, or LoginCsrfRequestSubscriber answers 403 before
        // the credentials are ever checked.
        $client->jsonRequest('POST', '/api/login', [
            'email' => $email,
            'password' => $plainPassword,
        ], [
            'HTTP_X_CSRF_TOKEN' => $this->fetchCsrfToken($client),
        ]);

        self::assertResponseStatusCodeSame(401);
    }

    private function createUser(
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        string $email,
        string $plainPassword,
    ): User {
        $user = new User();
        $user->setLastname('Delete');
        $user->setFirstname('Me');
        $user->setEmail($email);
        $user->setDateOfBirth(new \DateTimeImmutable('1990-01-01'));
        $user->setRole('ROLE_USER');
        $user->setCanSeePrivate(false);
        $user->setPassword($passwordHasher->hashPassword($user, $plainPassword));

        $entityManager->persist($user);
        $entityManager->flush();

        return $user;
    }
}
