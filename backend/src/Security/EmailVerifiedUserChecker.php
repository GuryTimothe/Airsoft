<?php

namespace App\Security;

use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

final class EmailVerifiedUserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
        if ($user instanceof \App\Entity\User && !$user->isEmailVerified()) {
            throw new CustomUserMessageAuthenticationException('Veuillez valider votre adresse e-mail avant de vous connecter.');
        }
    }

    public function checkPostAuth(UserInterface $user): void
    {
    }
}
