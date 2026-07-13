<?php

namespace App\Tests\Dto;

use App\Dto\GameRegistrationInput;
use App\Dto\GameRegistrationPresenceInput;
use App\Dto\MeEmailUpdateInput;
use App\Dto\MePasswordUpdateInput;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Validation;

final class DtoInstantiationTest extends TestCase
{
    public function testGameRegistrationInputDefaultsAndConstraint(): void
    {
        $input = new GameRegistrationInput();
        $this->assertNull($input->game);

        $input->game = '/api/games/42';
        $this->assertSame('/api/games/42', $input->game);

        $validator  = Validation::createValidatorBuilder()->enableAttributeMapping()->getValidator();
        $violations = $validator->validate($input);
        $this->assertSame(0, count($violations));
    }

    public function testGameRegistrationInputBlankGameHasViolation(): void
    {
        $input       = new GameRegistrationInput();
        $input->game = '';

        $validator  = Validation::createValidatorBuilder()->enableAttributeMapping()->getValidator();
        $violations = $validator->validate($input);

        $paths = array_map(fn ($v) => $v->getPropertyPath(), iterator_to_array($violations));
        $this->assertContains('game', $paths);
    }

    public function testGameRegistrationPresenceInputDefaults(): void
    {
        $input = new GameRegistrationPresenceInput();
        $this->assertNull($input->isPresent);
        $this->assertNull($input->present);

        $input->isPresent = true;
        $this->assertTrue($input->isPresent);

        $input->present = false;
        $this->assertFalse($input->present);
    }

    public function testMeEmailUpdateInputDefaults(): void
    {
        $input = new MeEmailUpdateInput();
        $this->assertNull($input->email);
        $this->assertNull($input->currentPassword);

        $input->email           = 'new@example.com';
        $input->currentPassword = 'secret';

        $this->assertSame('new@example.com', $input->email);
        $this->assertSame('secret', $input->currentPassword);
    }

    public function testMeEmailUpdateInputValidConstraints(): void
    {
        $input                  = new MeEmailUpdateInput();
        $input->email           = 'new@example.com';
        $input->currentPassword = 'secret';

        $validator  = Validation::createValidatorBuilder()->enableAttributeMapping()->getValidator();
        $violations = $validator->validate($input, null, ['me:email:input']);
        $this->assertSame(0, count($violations));
    }

    public function testMeEmailUpdateInputInvalidEmail(): void
    {
        $input                  = new MeEmailUpdateInput();
        $input->email           = 'not-an-email';
        $input->currentPassword = 'secret';

        $validator  = Validation::createValidatorBuilder()->enableAttributeMapping()->getValidator();
        $violations = $validator->validate($input, null, ['me:email:input']);

        $paths = array_map(fn ($v) => $v->getPropertyPath(), iterator_to_array($violations));
        $this->assertContains('email', $paths);
    }

    public function testMePasswordUpdateInputDefaults(): void
    {
        $input = new MePasswordUpdateInput();
        $this->assertNull($input->currentPassword);
        $this->assertNull($input->newPassword);

        $input->currentPassword = 'old';
        $input->newPassword     = 'new12345';

        $this->assertSame('old', $input->currentPassword);
        $this->assertSame('new12345', $input->newPassword);
    }

    public function testMePasswordUpdateInputShortPasswordHasViolation(): void
    {
        $input                  = new MePasswordUpdateInput();
        $input->currentPassword = 'old';
        $input->newPassword     = '123';

        $validator  = Validation::createValidatorBuilder()->enableAttributeMapping()->getValidator();
        $violations = $validator->validate($input, null, ['me:password:input']);

        $paths = array_map(fn ($v) => $v->getPropertyPath(), iterator_to_array($violations));
        $this->assertContains('newPassword', $paths);
    }
}
