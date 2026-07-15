<?php

namespace App\Dto;

use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

final class MePasswordUpdateInput
{
    #[Groups(['me:password:write'])]
    #[Assert\NotBlank(groups: ['me:password:input'])]
    public ?string $currentPassword = null;

    #[Groups(['me:password:write'])]
    #[Assert\NotBlank(groups: ['me:password:input'])]
    #[Assert\Length(
        min: 12,
        minMessage: 'Le mot de passe doit contenir au moins 12 caractères.',
        groups: ['me:password:input']
    )]
    #[Assert\Regex(
        pattern: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/',
        message: 'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un symbole.',
        groups: ['me:password:input']
    )]
    public ?string $newPassword = null;
}
