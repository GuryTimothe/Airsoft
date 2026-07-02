<?php

namespace App\Dto;

use App\Entity\User;
use Symfony\Component\Serializer\Annotation\Groups;

final class MeUpdateOutput
{
    public function __construct(
        #[Groups(['me:update:read'])]
        public User $user,
        #[Groups(['me:update:read'])]
        public string $token,
    ) {
    }
}
