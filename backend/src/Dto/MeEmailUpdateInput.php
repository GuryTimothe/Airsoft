<?php

namespace App\Dto;

use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

final class MeEmailUpdateInput
{
    #[Groups(['me:email:write'])]
    #[Assert\NotBlank(groups: ['me:email:input'])]
    #[Assert\Email(groups: ['me:email:input'])]
    public ?string $email = null;

    #[Groups(['me:email:write'])]
    #[Assert\NotBlank(groups: ['me:email:input'])]
    public ?string $currentPassword = null;
}
