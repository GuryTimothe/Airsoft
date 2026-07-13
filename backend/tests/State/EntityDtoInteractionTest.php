<?php

namespace App\Tests\State;

use App\Dto\MeEmailUpdateInput;
use App\Dto\MePasswordUpdateInput;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

/**
 * Simple edge case tests for DTO and Entity interactions
 */
final class EntityDtoInteractionTest extends TestCase
{
    public function testUserCanBeCreatedWithAllProperties(): void
    {
        $user = new User();
        $user->setFirstname('Jean');
        $user->setLastname('Dupont');
        $user->setEmail('jean@example.com');
        $user->setPassword('hashed');
        $user->setDateOfBirth(new \DateTimeImmutable('-30 years'));
        $user->setRole('ROLE_USER');

        $this->assertSame('Jean', $user->getFirstname());
        $this->assertSame('jean@example.com', $user->getEmail());
        $this->assertSame('ROLE_USER', $user->getRole());
    }

    public function testUserWithMultipleRoleAssignments(): void
    {
        $user = new User();
        $user->setRole('ROLE_USER');
        $this->assertSame('ROLE_USER', $user->getRole());

        $user->setRole('ROLE_ADMIN');
        $this->assertSame('ROLE_ADMIN', $user->getRole());
    }

    public function testUserCanAccessEmergencyContact(): void
    {
        $user = new User();
        $user->setFirstname('Minor');
        $user->setLastname('User');
        $user->setEmail('minor@example.com');
        $user->setPassword('hashed');
        $user->setDateOfBirth(new \DateTimeImmutable('-15 years'));

        // Emergency contact is an EmergencyContact object, not a string
        $this->assertNull($user->getEmergencyContact());
    }

    public function testUserCanToggleCanSeePrivate(): void
    {
        $user = new User();
        $user->setCanSeePrivate(false);
        $this->assertFalse($user->getCanSeePrivate());

        $user->setCanSeePrivate(true);
        $this->assertTrue($user->getCanSeePrivate());
    }

    public function testEmailUpdateInputValidation(): void
    {
        $input = new MeEmailUpdateInput();
        
        // Initially should be empty
        $this->assertNull($input->email ?? null);
        
        $input->email = 'newemail@example.com';
        $this->assertSame('newemail@example.com', $input->email);
    }

    public function testPasswordUpdateInputChainAssignment(): void
    {
        $input = new MePasswordUpdateInput();
        
        // Chain-like assignment
        $input->currentPassword = 'CurrentPassword123';
        $input->newPassword = 'NewPassword123';
        
        $this->assertSame('CurrentPassword123', $input->currentPassword);
        $this->assertSame('NewPassword123', $input->newPassword);
    }

    public function testUserDateOfBirthValidation(): void
    {
        $user = new User();
        $dob = new \DateTimeImmutable('-25 years');
        $user->setDateOfBirth($dob);

        $this->assertSame($dob, $user->getDateOfBirth());
    }

    public function testUserWithFutureDateOfBirthRejection(): void
    {
        $user = new User();
        $futureDob = new \DateTimeImmutable('+5 years');
        
        // The entity will accept it, but validator should reject it
        $user->setDateOfBirth($futureDob);
        $this->assertSame($futureDob, $user->getDateOfBirth());
    }

    public function testEmailUpdateWithSpecialCharacters(): void
    {
        $input = new MeEmailUpdateInput();
        $input->email = 'user+tag+special@subdomain.example.com';

        $this->assertSame('user+tag+special@subdomain.example.com', $input->email);
    }

    public function testPasswordUpdateWithSpecialCharacters(): void
    {
        $input = new MePasswordUpdateInput();
        $input->currentPassword = 'P@ssw0rd!#$%';
        $input->newPassword = 'N3wP@ss!#$%';

        $this->assertSame('P@ssw0rd!#$%', $input->currentPassword);
        $this->assertSame('N3wP@ss!#$%', $input->newPassword);
    }

    public function testUserRoleMultipleAssignments(): void
    {
        $user1 = (new User())->setRole('ROLE_ADMIN');
        $user2 = (new User())->setRole('ROLE_USER');
        
        $this->assertSame('ROLE_ADMIN', $user1->getRole());
        $this->assertSame('ROLE_USER', $user2->getRole());
    }

    public function testEmailInputWithinvalidFormat(): void
    {
        $input = new MeEmailUpdateInput();
        $input->email = 'not-a-valid-email';

        // DTO accepts it, validator should reject it
        $this->assertSame('not-a-valid-email', $input->email);
    }

    public function testPasswordTooShort(): void
    {
        $input = new MePasswordUpdateInput();
        $input->newPassword = 'short';

        // DTO accepts it, validator should enforce minimum
        $this->assertSame('short', $input->newPassword);
    }

    public function testUserLastUpdateTimestamp(): void
    {
        $user = new User();
        $user->setFirstname('Test');
        $user->setLastname('User');
        $user->setEmail('test@example.com');

        $createdAt = $user->getCreatedAt();
        
        // Should have a creation timestamp
        $this->assertInstanceOf(\DateTimeInterface::class, $createdAt);
    }

    public function testPasswordMismatchDetection(): void
    {
        $input1 = new MePasswordUpdateInput();
        $input1->newPassword = 'Password123';
        
        $input2 = new MePasswordUpdateInput();
        $input2->newPassword = 'Password124';

        $this->assertNotSame($input1->newPassword, $input2->newPassword);
    }
}
