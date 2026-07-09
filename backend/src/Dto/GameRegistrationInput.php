<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class GameRegistrationInput
{
    #[Assert\NotBlank(message: 'La partie est obligatoire.')]
    public ?string $game = null;
}
