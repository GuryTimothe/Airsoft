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
    #[Assert\Length(min: 8, groups: ['me:password:input'])]
    public ?string $newPassword = null;
}
