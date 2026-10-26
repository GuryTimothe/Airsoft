<?php

namespace App\Tests\Api;

use App\Entity\PasswordResetToken;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * An address identifies an account whatever its case. Registration stores it as
 * the user typed it, so both the login and the password reset have to match it
 * case-insensitively; the reset used to lowercase its needle while the stored
 * address kept its capitals, which locked those accounts out for good.
 */
final class EmailCaseInsensitivityTest extends WebTestCase
{
    use RequiresIntegrationServices;
    use AuthenticatesThroughTheApi;

    public function testLoginAcceptsACaseThatDiffersFromTheStoredAddress(): void
    {
        $client    = static::createClient();
        $container = static::getContainer();

        $entityManager  = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $storedEmail   = sprintf('Mixed.Case-%s@Example.com', uniqid('', true));
        $plainPassword = 'CaseLogin123!';
        $this->createUser($entityManager, $passwordHasher, $storedEmail, $plainPassword);

        // loginAndGetToken asserts 200, so a case-sensitive provider fails here.
        $token = $this->loginAndGetToken($client, mb_strtolower($storedEmail), $plainPassword);

        self::assertNotSame('', $token);
    }

    public function testPasswordResetFindsAnAddressStoredWithCapitals(): void
    {
        $client    = static::createClient();
        $container = static::getContainer();

        $entityManager  = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $this->skipIfDatabaseUnavailable($entityManager);

        $storedEmail = sprintf('Reset.Case-%s@Example.com', uniqid('', true));
        $user        = $this->createUser($entityManager, $passwordHasher, $storedEmail, 'CaseReset123!');
        $userId      = (int) $user->getId();

        // /api/password-reset/* is exempt from the CSRF gate, and the endpoint
        // answers the same whether or not it found anyone, so the created token
        // is the only observable proof that the lookup succeeded.
        $client->jsonRequest('POST', '/api/password-reset/request', [
            'email' => mb_strtoupper($storedEmail),
        ]);

        self::assertResponseIsSuccessful();
        self::assertSame(1, $this->countResetTokens($userId));
    }

    private function countResetTokens(int $userId): int
    {
        $entityManager = static::getContainer()->get(EntityManagerInterface::class);
        $entityManager->clear();

        return (int) $entityManager->createQuery(
            'SELECT COUNT(token.id) FROM '.PasswordResetToken::class.' token WHERE token.user = :user'
        )
            ->setParameter('user', $userId)
            ->getSingleScalarResult();
    }

    private function createUser(
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        string $email,
        string $plainPassword,
    ): User {
        $user = new User();
        $user->setLastname('Case');
        $user->setFirstname('Sensitive');
        $user->setEmail($email);
        $user->setDateOfBirth(new \DateTimeImmutable('1990-01-01'));
        $user->setRole('ROLE_USER');
        $user->setPassword($passwordHasher->hashPassword($user, $plainPassword));
        $user->setEmailVerified(true);

        $entityManager->persist($user);
        $entityManager->flush();

        return $user;
    }
}
