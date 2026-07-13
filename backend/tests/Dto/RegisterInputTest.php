<?php

namespace App\Tests\Dto;

use App\Dto\RegisterInput;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Validation;

final class RegisterInputTest extends TestCase
{
    private function makeInput(string $dob, ?string $emergencyContact = null): RegisterInput
    {
        $input                   = new RegisterInput();
        $input->firstname        = 'Jean';
        $input->lastname         = 'Dupont';
        $input->email            = 'jean@example.com';
        $input->password         = 'Password123';
        $input->dateOfBirth      = new \DateTimeImmutable($dob);
        $input->emergencyContact = $emergencyContact;

        return $input;
    }

    private function getValidator(): \Symfony\Component\Validator\Validator\ValidatorInterface
    {
        return Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->getValidator();
    }

    public function testAdultWithoutEmergencyContactIsValid(): void
    {
        $input = $this->makeInput('-25 years');

        $violations = $this->getValidator()->validate($input);

        $paths = array_map(fn ($v) => $v->getPropertyPath(), iterator_to_array($violations));
        $this->assertNotContains('emergencyContact', $paths);
    }

    public function testMinorWithoutEmergencyContactHasViolation(): void
    {
        $input = $this->makeInput('-15 years');

        $violations = $this->getValidator()->validate($input);

        $paths = array_map(fn ($v) => $v->getPropertyPath(), iterator_to_array($violations));
        $this->assertContains('emergencyContact', $paths);
    }

    public function testMinorWithEmergencyContactIsValid(): void
    {
        $input = $this->makeInput('-15 years', 'Parent - 0612345678');

        $violations = $this->getValidator()->validate($input);

        $paths = array_map(fn ($v) => $v->getPropertyPath(), iterator_to_array($violations));
        $this->assertNotContains('emergencyContact', $paths);
    }

    public function testNullDateOfBirthSkipsMinorCheck(): void
    {
        $input              = new RegisterInput();
        $input->firstname   = 'Jean';
        $input->lastname    = 'Dupont';
        $input->email       = 'jean@example.com';
        $input->password    = 'Password123';
        $input->dateOfBirth = null;

        // Should not throw and should not add emergencyContact violation
        $violations = $this->getValidator()->validate($input);

        $paths = array_map(fn ($v) => $v->getPropertyPath(), iterator_to_array($violations));
        $this->assertNotContains('emergencyContact', $paths);
    }

    public function testBlankFirstnameHasViolation(): void
    {
        $input            = $this->makeInput('-25 years');
        $input->firstname = '';

        $violations = $this->getValidator()->validate($input);

        $paths = array_map(fn ($v) => $v->getPropertyPath(), iterator_to_array($violations));
        $this->assertContains('firstname', $paths);
    }

    public function testInvalidEmailHasViolation(): void
    {
        $input        = $this->makeInput('-25 years');
        $input->email = 'not-an-email';

        $violations = $this->getValidator()->validate($input);

        $paths = array_map(fn ($v) => $v->getPropertyPath(), iterator_to_array($violations));
        $this->assertContains('email', $paths);
    }

    public function testPasswordTooShortHasViolation(): void
    {
        $input           = $this->makeInput('-25 years');
        $input->password = '123';

        $violations = $this->getValidator()->validate($input);

        $paths = array_map(fn ($v) => $v->getPropertyPath(), iterator_to_array($violations));
        $this->assertContains('password', $paths);
    }
}
