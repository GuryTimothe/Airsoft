<?php

namespace App\Tests\Entity;

use App\Entity\EmergencyContact;
use App\Entity\User;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Validation;

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
        $emergencyContact = (new EmergencyContact())
            ->setLastname('Parent')
            ->setFirstname('Lucas')
            ->setEmail('parent@example.com')
            ->setPhone('0600000000');
        $user->setEmergencyContact($emergencyContact);
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
        $this->assertSame($emergencyContact, $user->getEmergencyContact());
        $this->assertSame('Parent', $user->getEmergencyContactLastname());
        $this->assertSame('Lucas', $user->getEmergencyContactFirstname());
        $this->assertSame('parent@example.com', $user->getEmergencyContactEmail());
        $this->assertSame('0600000000', $user->getEmergencyContactPhone());
        $this->assertSame('Lulu', $user->getPseudo());
        $this->assertSame('0601020304', $user->getPhone());
        $this->assertSame('ROLE_ADMIN', $user->getRole());
        $this->assertSame('Profil prioritaire', $user->getAdminNotes());
        $this->assertTrue($user->getCanSeePrivate());
    }

    public function testUserDefaultsAndLifecycleCallbacksWork(): void
    {
        $user = new User();

        $this->assertSame('ROLE_USER', $user->getRole());
        $this->assertFalse($user->getCanSeePrivate());
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

    public function testEmergencyContactIsRequiredForMinor(): void
    {
        $validator = Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->getValidator();

        $minorWithoutContact = new User();
        $minorWithoutContact->setLastname('Durand');
        $minorWithoutContact->setFirstname('Lucas');
        $minorWithoutContact->setEmail('lucas-minor@example.com');
        $minorWithoutContact->setPassword('secret');
        $minorWithoutContact->setDateOfBirth(new \DateTimeImmutable('2010-05-15'));
        $minorWithoutContact->setRole('ROLE_USER');

        $minorViolations = $validator->validate($minorWithoutContact);
        $this->assertGreaterThan(0, $minorViolations->count());

        $adultWithoutContact = new User();
        $adultWithoutContact->setLastname('Martin');
        $adultWithoutContact->setFirstname('Alex');
        $adultWithoutContact->setEmail('alex-adult@example.com');
        $adultWithoutContact->setPassword('secret');
        $adultWithoutContact->setDateOfBirth(new \DateTimeImmutable('1995-05-15'));
        $adultWithoutContact->setRole('ROLE_USER');

        $adultViolations = $validator->validate($adultWithoutContact);

        $this->assertSame(0, $adultViolations->count());
    }
}
