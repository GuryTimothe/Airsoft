<?php

namespace App\Security\Voter;

use App\Entity\Game;
use App\Entity\GameRegistration;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @extends Voter<string, mixed>
 */
final class GameRegistrationVoter extends Voter
{
    public const REGISTER_GAME            = 'REGISTER_GAME';
    public const PATCH_GAME_REGISTRATION  = 'PATCH_GAME_REGISTRATION';
    public const DELETE_GAME_REGISTRATION = 'DELETE_GAME_REGISTRATION';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return match ($attribute) {
            self::REGISTER_GAME            => $subject instanceof Game,
            self::PATCH_GAME_REGISTRATION  => $subject instanceof GameRegistration,
            self::DELETE_GAME_REGISTRATION => $subject instanceof GameRegistration,
            default                        => false,
        };
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        return match ($attribute) {
            self::REGISTER_GAME            => $this->canRegisterToGame($user, $subject),
            self::PATCH_GAME_REGISTRATION  => $this->canPatchRegistration($user, $subject),
            self::DELETE_GAME_REGISTRATION => $this->canDeleteRegistration($user, $subject),
            default                        => false,
        };
    }

    private function canRegisterToGame(User $user, mixed $subject): bool
    {
        if (!$subject instanceof Game) {
            return false;
        }

        if ($subject->isPublic()) {
            return true;
        }

        return $this->canAccessPrivateGames($user);
    }

    private function canAccessPrivateGames(User $user): bool
    {
        $roles = $user->getRoles();

        if (\in_array('ROLE_ADMIN', $roles, true)) {
            return true;
        }

        return $user->getCanSeePrivate();
    }

    private function canDeleteRegistration(User $user, mixed $subject): bool
    {
        if (!$subject instanceof GameRegistration) {
            return false;
        }

        $roles = $user->getRoles();

        if (
            \in_array('ROLE_ADMIN', $roles, true)
            || \in_array('ROLE_SUPER_ADMIN', $roles, true)
            || \in_array('ROLE_ORGANIZER', $roles, true)
        ) {
            return true;
        }

        return $subject->getUser() === $user;
    }

    private function canPatchRegistration(User $user, mixed $subject): bool
    {
        if (!$subject instanceof GameRegistration) {
            return false;
        }

        return $this->hasRegistrationManagementRole($user);
    }

    private function hasRegistrationManagementRole(User $user): bool
    {
        $roles = $user->getRoles();

        return \in_array('ROLE_ADMIN', $roles, true)
            || \in_array('ROLE_SUPER_ADMIN', $roles, true)
            || \in_array('ROLE_ORGANIZER', $roles, true);
    }
}
