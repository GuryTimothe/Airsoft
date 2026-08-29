<?php

namespace App\Dto;

use Symfony\Component\Serializer\Annotation\Groups;

final class AdminUserInvitationOutput
{
    public function __construct(
        #[Groups(['admin:user:invitation:read'])]
        public readonly string $message,
    ) {
    }
}
