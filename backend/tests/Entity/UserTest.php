<?php

namespace App\Tests\Entity;

use App\Entity\User;
use PHPUnit\Framework\TestCase;

final class UserTest extends TestCase
{
    public function testUserFieldsCanBeSetAndRetrieved(): void
    {
        $user = new User();
        $user->setLastname('Durand');
        $user->setFirstname('Lucas');
        $user->setEmail('lucas@example.com');
        $user->setPassword('secret');
        $user->setDateOfBirth(new \DateTimeImmutable('1990-02-14'));
        $user->setPseudo('Lulu');
        $user->setPhone('0601020304');
        $user->setRole('ROLE_ADMIN');
        $user->setAdminNotes('Profil prioritaire');
        $user->setCanSeePrivate(true);

        $this->assertSame('Durand', $user->getLastname());
        $this->assertSame('Lucas', $user->getFirstname());
        $this->assertSame('lucas@example.com', $user->getEmail());
        $this->assertSame('secret', $user->getPassword());
        $this->assertSame('1990-02-14', $user->getDateOfBirth()->format('Y-m-d'));
        $this->assertSame('Lulu', $user->getPseudo());
        $this->assertSame('0601020304', $user->getPhone());
        $this->assertSame('ROLE_ADMIN', $user->getRole());
        $this->assertSame('Profil prioritaire', $user->getAdminNotes());
        $this->assertTrue($user->canSeePrivate());
    }

    public function testUserDefaultsAndLifecycleCallbacksWork(): void
    {
        $user = new User();

        $this->assertSame('ROLE_USER', $user->getRole());
        $this->assertFalse($user->canSeePrivate());
        $this->assertInstanceOf(\DateTimeImmutable::class, $user->getCreatedAt());
        $this->assertInstanceOf(\DateTimeImmutable::class, $user->getUpdatedAt());

        $createdAtBefore = $user->getCreatedAt();
        $updatedAtBefore = $user->getUpdatedAt();

        $user->onPrePersist();

        $this->assertNotSame($createdAtBefore, $user->getCreatedAt());
        $this->assertNotSame($updatedAtBefore, $user->getUpdatedAt());

        $updatedAfterPersist = $user->getUpdatedAt();
        $user->onPreUpdate();

        $this->assertNotSame($updatedAfterPersist, $user->getUpdatedAt());
    }
}
