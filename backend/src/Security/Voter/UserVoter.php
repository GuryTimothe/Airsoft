<?php

namespace App\Security\Voter;

use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @extends Voter<string, mixed>
 */
final class UserVoter extends Voter
{
    public const VIEW_ALL_USERS = 'VIEW_ALL_USERS';
    public const DELETE_USER    = 'DELETE_USER';
    public const CREATE_USER    = 'CREATE_USER';
    public const UPDATE_USER    = 'UPDATE_USER';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return match ($attribute) {
            self::VIEW_ALL_USERS => true,
            self::DELETE_USER    => $subject instanceof User,
            self::CREATE_USER    => $subject instanceof User,
            self::UPDATE_USER    => $subject instanceof User,
            default              => false,
        };
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        $roles = $user->getRoles();

        return match ($attribute) {
            self::VIEW_ALL_USERS => \in_array('ROLE_ADMIN', $roles, true) || \in_array('ROLE_SUPER_ADMIN', $roles, true),
            self::DELETE_USER    => $this->canDeleteUser($user, $subject),
            self::CREATE_USER    => $this->canCreateUser($user, $subject),
            self::UPDATE_USER    => $this->canUpdateUser($user),
            default              => false,
        };
    }

    private function canUpdateUser(User $user): bool
    {
        $roles = $user->getRoles();

        return \in_array('ROLE_ADMIN', $roles, true) || \in_array('ROLE_SUPER_ADMIN', $roles, true);
    }

    private function canCreateUser(User $user, User $subject): bool
    {
        $roles = $user->getRoles();

        if (\in_array('ROLE_SUPER_ADMIN', $roles, true)) {
            return true;
        }

        if (!\in_array('ROLE_ADMIN', $roles, true)) {
            return false;
        }

        return !\in_array($subject->getRole(), ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'], true);
    }

    private function canDeleteUser(User $user, User $subject): bool
    {
        $roles = $user->getRoles();

        if (\in_array('ROLE_SUPER_ADMIN', $roles, true)) {
            return true;
        }

        if (!\in_array('ROLE_ADMIN', $roles, true)) {
            return false;
        }

        return !\in_array($subject->getRole(), ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'], true);
    }
}
