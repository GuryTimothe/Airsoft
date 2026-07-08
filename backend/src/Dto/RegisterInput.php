<?php

namespace App\Dto;

use ApiPlatform\Metadata\ApiProperty;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

class RegisterInput
{
    #[ApiProperty]
    #[Groups(['user:write'])]
    #[Assert\NotBlank(message: 'Le prénom est requis.')]
    #[Assert\Length(min: 2, max: 255)]
    public ?string $firstname = null;

    #[ApiProperty]
    #[Groups(['user:write'])]
    #[Assert\NotBlank(message: 'Le nom est requis.')]
    #[Assert\Length(min: 2, max: 255)]
    public ?string $lastname = null;

    #[ApiProperty]
    #[Groups(['user:write'])]
    #[Assert\NotBlank(message: 'L\'email est requis.')]
    #[Assert\Email(message: 'L\'email n\'est pas valide.')]
    public ?string $email = null;

    #[ApiProperty]
    #[Groups(['user:write'])]
    #[Assert\NotBlank(message: 'Le mot de passe est requis.')]
    #[Assert\Length(min: 8, max: 255, minMessage: 'Le mot de passe doit contenir au moins 8 caractères.')]
    public ?string $password = null;

    #[ApiProperty]
    #[Groups(['user:write'])]
    #[Assert\NotNull(message: 'La date de naissance est requise.')]
    public ?\DateTimeImmutable $dateOfBirth = null;

    #[ApiProperty]
    #[Groups(['user:write'])]
    #[Assert\Length(max: 255)]
    public ?string $emergencyContact = null;

    #[ApiProperty]
    #[Groups(['user:write'])]
    #[Assert\Length(max: 100)]
    public ?string $pseudo = null;

    #[ApiProperty]
    #[Groups(['user:write'])]
    #[Assert\Length(max: 20)]
    public ?string $phone = null;

    #[Assert\Callback]
    public function validateEmergencyContactForMinor(
        ExecutionContextInterface $context,
    ): void {
        if (null === $this->dateOfBirth) {
            return;
        }

        $today = new \DateTimeImmutable('today');
        $isMinor = $this->dateOfBirth->diff($today)->y < 18;

        if ($isMinor && empty($this->emergencyContact)) {
            $context->buildViolation('Le contact d\'urgence est obligatoire pour un mineur.')
                ->atPath('emergencyContact')
                ->addViolation();
        }
    }
}
