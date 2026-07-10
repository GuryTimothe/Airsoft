<?php

namespace App\Security\Voter;

use App\Entity\Game;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @extends Voter<string, mixed>
 */
final class GameVoter extends Voter
{
    public const LIST_GAMES  = 'LIST_GAMES';
    public const VIEW_GAME   = 'VIEW_GAME';
    public const CREATE_GAME = 'CREATE_GAME';
    public const UPDATE_GAME = 'UPDATE_GAME';
    public const DELETE_GAME = 'DELETE_GAME';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return match ($attribute) {
            self::LIST_GAMES                     => true,
            self::VIEW_GAME                      => $subject instanceof Game,
            self::CREATE_GAME                    => true,
            self::UPDATE_GAME, self::DELETE_GAME => $subject instanceof Game,
            default                              => false,
        };
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        if (self::LIST_GAMES === $attribute) {
            return true;
        }

        if (self::VIEW_GAME === $attribute && $subject instanceof Game) {
            if ($subject->isPublic()) {
                return true;
            }

            $user = $token->getUser();

            return $user instanceof User && $this->canAccessPrivateGames($user);
        }

        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        return match ($attribute) {
            self::CREATE_GAME => $this->canCreateGame($user),
            self::UPDATE_GAME => $this->canUpdateGame($user),
            self::DELETE_GAME => $this->canDeleteGame($user),
            default           => false,
        };
    }

    private function canCreateGame(User $user): bool
    {
        $roles = $user->getRoles();

        return \in_array('ROLE_ADMIN', $roles, true)
            || \in_array('ROLE_SUPER_ADMIN', $roles, true)
            || \in_array('ROLE_ORGANIZER', $roles, true);
    }

    private function canUpdateGame(User $user): bool
    {
        return $this->canCreateGame($user);
    }

    private function canDeleteGame(User $user): bool
    {
        return $this->canCreateGame($user);
    }

    private function canAccessPrivateGames(User $user): bool
    {
        $roles = $user->getRoles();

        if (\in_array('ROLE_ADMIN', $roles, true)) {
            return true;
        }

        return $user->getCanSeePrivate();
    }
}
