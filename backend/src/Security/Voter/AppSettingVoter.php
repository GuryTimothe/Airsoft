<?php

namespace App\Security\Voter;

use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @extends Voter<string, mixed>
 */
final class AppSettingVoter extends Voter
{
    public const MANAGE_APP_SETTINGS = 'MANAGE_APP_SETTINGS';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return self::MANAGE_APP_SETTINGS === $attribute;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        $roles = $user->getRoles();

        return \in_array('ROLE_ADMIN', $roles, true) || \in_array('ROLE_SUPER_ADMIN', $roles, true);
    }
}
