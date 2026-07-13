<?php

namespace App\Tests\Security\Voter;

use App\Entity\Game;
use App\Entity\User;
use App\Security\Voter\GameVoter;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;

final class GameVoterTest extends TestCase
{
    private GameVoter $voter;

    protected function setUp(): void
    {
        $this->voter = new GameVoter();
    }

    private function createToken(?User $user): TokenInterface
    {
        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($user);

        return $token;
    }

    public function testListGamesIsAlwaysAllowed(): void
    {
        $token = $this->createToken(null);

        $this->assertSame(1, $this->voter->vote($token, null, [GameVoter::LIST_GAMES]));
    }

    public function testViewPublicGameAllowedForAnyone(): void
    {
        $game = new Game();
        $game->setTitle('T');
        $game->setAddress('A');
        $game->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $game->setIsPublic(true);

        $token = $this->createToken(null);

        $this->assertSame(1, $this->voter->vote($token, $game, [GameVoter::VIEW_GAME]));
    }

    public function testViewPrivateGameDeniedForUnauthenticatedUser(): void
    {
        $game = new Game();
        $game->setTitle('T');
        $game->setAddress('A');
        $game->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $game->setIsPublic(false);

        $token = $this->createToken(null);

        $this->assertSame(-1, $this->voter->vote($token, $game, [GameVoter::VIEW_GAME]));
    }

    public function testViewPrivateGameDeniedForUserWithoutCanSeePrivate(): void
    {
        $game = new Game();
        $game->setTitle('T');
        $game->setAddress('A');
        $game->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $game->setIsPublic(false);

        $user  = (new User())->setRole('ROLE_USER')->setCanSeePrivate(false);
        $token = $this->createToken($user);

        $this->assertSame(-1, $this->voter->vote($token, $game, [GameVoter::VIEW_GAME]));
    }

    public function testViewPrivateGameAllowedForAdminRole(): void
    {
        $game = new Game();
        $game->setTitle('T');
        $game->setAddress('A');
        $game->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $game->setIsPublic(false);

        $user  = (new User())->setRole('ROLE_ADMIN');
        $token = $this->createToken($user);

        $this->assertSame(1, $this->voter->vote($token, $game, [GameVoter::VIEW_GAME]));
    }

    public function testViewPrivateGameAllowedForUserWithCanSeePrivate(): void
    {
        $game = new Game();
        $game->setTitle('T');
        $game->setAddress('A');
        $game->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $game->setIsPublic(false);

        $user  = (new User())->setRole('ROLE_USER')->setCanSeePrivate(true);
        $token = $this->createToken($user);

        $this->assertSame(1, $this->voter->vote($token, $game, [GameVoter::VIEW_GAME]));
    }

    public function testCreateGameDeniedForRegularUser(): void
    {
        $user  = (new User())->setRole('ROLE_USER');
        $token = $this->createToken($user);

        $this->assertSame(-1, $this->voter->vote($token, null, [GameVoter::CREATE_GAME]));
    }

    public function testCreateGameDeniedForUnauthenticated(): void
    {
        $token = $this->createToken(null);

        $this->assertSame(-1, $this->voter->vote($token, null, [GameVoter::CREATE_GAME]));
    }

    public function testCreateGameAllowedForOrganizer(): void
    {
        $user  = (new User())->setRole('ROLE_ORGANIZER');
        $token = $this->createToken($user);

        $this->assertSame(1, $this->voter->vote($token, null, [GameVoter::CREATE_GAME]));
    }

    public function testCreateGameAllowedForAdmin(): void
    {
        $user  = (new User())->setRole('ROLE_ADMIN');
        $token = $this->createToken($user);

        $this->assertSame(1, $this->voter->vote($token, null, [GameVoter::CREATE_GAME]));
    }

    public function testUpdateGameAllowedForAdmin(): void
    {
        $game  = new Game();
        $game->setTitle('T')->setAddress('A')->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $user  = (new User())->setRole('ROLE_ADMIN');
        $token = $this->createToken($user);

        $this->assertSame(1, $this->voter->vote($token, $game, [GameVoter::UPDATE_GAME]));
    }

    public function testUpdateGameDeniedForRegularUser(): void
    {
        $game  = new Game();
        $game->setTitle('T')->setAddress('A')->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $user  = (new User())->setRole('ROLE_USER');
        $token = $this->createToken($user);

        $this->assertSame(-1, $this->voter->vote($token, $game, [GameVoter::UPDATE_GAME]));
    }

    public function testDeleteGameAllowedForOrganizer(): void
    {
        $game  = new Game();
        $game->setTitle('T')->setAddress('A')->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $user  = (new User())->setRole('ROLE_ORGANIZER');
        $token = $this->createToken($user);

        $this->assertSame(1, $this->voter->vote($token, $game, [GameVoter::DELETE_GAME]));
    }

    public function testUnsupportedAttributeIsAbstained(): void
    {
        $token = $this->createToken(null);

        $this->assertSame(0, $this->voter->vote($token, null, ['UNSUPPORTED_ATTRIBUTE']));
    }

    public function testCreateGameAllowedForSuperAdmin(): void
    {
        $user  = (new User())->setRole('ROLE_SUPER_ADMIN');
        $token = $this->createToken($user);

        $this->assertSame(1, $this->voter->vote($token, null, [GameVoter::CREATE_GAME]));
    }

    public function testUpdateGameAllowedForOrganizer(): void
    {
        $game  = new Game();
        $game->setTitle('T')->setAddress('A')->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $user  = (new User())->setRole('ROLE_ORGANIZER');
        $token = $this->createToken($user);

        $this->assertSame(1, $this->voter->vote($token, $game, [GameVoter::UPDATE_GAME]));
    }

    public function testDeleteGameAllowedForAdmin(): void
    {
        $game  = new Game();
        $game->setTitle('T')->setAddress('A')->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $user  = (new User())->setRole('ROLE_ADMIN');
        $token = $this->createToken($user);

        $this->assertSame(1, $this->voter->vote($token, $game, [GameVoter::DELETE_GAME]));
    }

    public function testDeleteGameAllowedForSuperAdmin(): void
    {
        $game  = new Game();
        $game->setTitle('T')->setAddress('A')->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $user  = (new User())->setRole('ROLE_SUPER_ADMIN');
        $token = $this->createToken($user);

        $this->assertSame(1, $this->voter->vote($token, $game, [GameVoter::DELETE_GAME]));
    }

    public function testViewGameWithInvalidSubjectType(): void
    {
        $token = $this->createToken(null);

        $this->assertSame(0, $this->voter->vote($token, 'invalid_string', [GameVoter::VIEW_GAME]));
    }

    public function testUpdateGameWithInvalidSubjectType(): void
    {
        $token = $this->createToken(null);

        $this->assertSame(0, $this->voter->vote($token, 'invalid', [GameVoter::UPDATE_GAME]));
    }

    public function testDeleteGameWithInvalidSubjectType(): void
    {
        $token = $this->createToken(null);

        $this->assertSame(0, $this->voter->vote($token, 123, [GameVoter::DELETE_GAME]));
    }
}
