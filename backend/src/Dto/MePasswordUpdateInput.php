<?php

namespace App\Dto;

use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

final class MePasswordUpdateInput
{
    #[Groups(['me:password:write'])]
    #[Assert\NotBlank(groups: ['me:password:input'])]
    public ?string $currentPassword = null;

    #[Groups(['me:password:write'])]
    #[Assert\NotBlank(groups: ['me:password:input'])]
    public ?string $newPassword = null;

    #[Assert\Callback(groups: ['me:password:input'])]
    public function validatePasswordPolicy(ExecutionContextInterface $context): void
    {
        if (!\is_string($this->newPassword) || '' === trim($this->newPassword)) {
            return;
        }

        if (\strlen($this->newPassword) < 12) {
            $context->buildViolation('Le mot de passe doit contenir au moins 12 caractères.')
                ->atPath('newPassword')
                ->addViolation();
        }

        if (!preg_match('/[a-z]/', $this->newPassword)) {
            $context->buildViolation('Le mot de passe doit contenir au moins une minuscule.')
                ->atPath('newPassword')
                ->addViolation();
        }

        if (!preg_match('/[A-Z]/', $this->newPassword)) {
            $context->buildViolation('Le mot de passe doit contenir au moins une majuscule.')
                ->atPath('newPassword')
                ->addViolation();
        }

        if (!preg_match('/\d/', $this->newPassword)) {
            $context->buildViolation('Le mot de passe doit contenir au moins un chiffre.')
                ->atPath('newPassword')
                ->addViolation();
        }

        if (!preg_match('/[^\w\s]/', $this->newPassword)) {
            $context->buildViolation('Le mot de passe doit contenir au moins un symbole.')
                ->atPath('newPassword')
                ->addViolation();
        }
    }
}
