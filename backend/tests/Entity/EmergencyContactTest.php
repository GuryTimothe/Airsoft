<?php

namespace App\Tests\Entity;

use App\Entity\EmergencyContact;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

final class EmergencyContactTest extends TestCase
{
    public function testDefaultValues(): void
    {
        $contact = new EmergencyContact();

        $this->assertNull($contact->getId());
        $this->assertSame('', $contact->getLastname());
        $this->assertSame('', $contact->getFirstname());
        $this->assertSame('', $contact->getEmail());
        $this->assertSame('', $contact->getPhone());
        $this->assertNull($contact->getUser());
    }

    public function testSettersReturnSelf(): void
    {
        $contact = new EmergencyContact();

        $result = $contact->setLastname('Dupont');
        $this->assertSame($contact, $result);

        $result = $contact->setFirstname('Marie');
        $this->assertSame($contact, $result);

        $result = $contact->setEmail('marie@example.com');
        $this->assertSame($contact, $result);

        $result = $contact->setPhone('0601020304');
        $this->assertSame($contact, $result);
    }

    public function testGettersReturnSetValues(): void
    {
        $contact = new EmergencyContact();
        $contact->setLastname('Dupont');
        $contact->setFirstname('Marie');
        $contact->setEmail('marie@example.com');
        $contact->setPhone('0601020304');

        $this->assertSame('Dupont', $contact->getLastname());
        $this->assertSame('Marie', $contact->getFirstname());
        $this->assertSame('marie@example.com', $contact->getEmail());
        $this->assertSame('0601020304', $contact->getPhone());
    }

    public function testSetUser(): void
    {
        $contact = new EmergencyContact();
        $user = new User();

        $result = $contact->setUser($user);
        $this->assertSame($contact, $result);
        $this->assertSame($user, $contact->getUser());
    }

    public function testSetUserToNull(): void
    {
        $contact = new EmergencyContact();
        $contact->setUser(new User());
        $contact->setUser(null);

        $this->assertNull($contact->getUser());
    }

    public function testIsCompleteReturnsTrueWhenAllFieldsFilled(): void
    {
        $contact = new EmergencyContact();
        $contact->setLastname('Dupont');
        $contact->setFirstname('Marie');
        $contact->setEmail('marie@example.com');
        $contact->setPhone('0601020304');

        $this->assertTrue($contact->isComplete());
    }

    public function testIsCompleteReturnsFalseWhenLastnameEmpty(): void
    {
        $contact = new EmergencyContact();
        $contact->setFirstname('Marie');
        $contact->setEmail('marie@example.com');
        $contact->setPhone('0601020304');

        $this->assertFalse($contact->isComplete());
    }

    public function testIsCompleteReturnsFalseWhenFirstnameEmpty(): void
    {
        $contact = new EmergencyContact();
        $contact->setLastname('Dupont');
        $contact->setEmail('marie@example.com');
        $contact->setPhone('0601020304');

        $this->assertFalse($contact->isComplete());
    }

    public function testIsCompleteReturnsFalseWhenEmailEmpty(): void
    {
        $contact = new EmergencyContact();
        $contact->setLastname('Dupont');
        $contact->setFirstname('Marie');
        $contact->setPhone('0601020304');

        $this->assertFalse($contact->isComplete());
    }

    public function testIsCompleteReturnsFalseWhenPhoneEmpty(): void
    {
        $contact = new EmergencyContact();
        $contact->setLastname('Dupont');
        $contact->setFirstname('Marie');
        $contact->setEmail('marie@example.com');

        $this->assertFalse($contact->isComplete());
    }

    public function testIsCompleteReturnsFalseWhenOnlyWhitespace(): void
    {
        $contact = new EmergencyContact();
        $contact->setLastname('   ');
        $contact->setFirstname('Marie');
        $contact->setEmail('marie@example.com');
        $contact->setPhone('0601020304');

        $this->assertFalse($contact->isComplete());
    }

    public function testFluentChaining(): void
    {
        $contact = (new EmergencyContact())
            ->setLastname('Dupont')
            ->setFirstname('Marie')
            ->setEmail('marie@example.com')
            ->setPhone('0601020304');

        $this->assertTrue($contact->isComplete());
    }
}
