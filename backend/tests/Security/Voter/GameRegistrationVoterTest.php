<?php

namespace App\Tests\Security\Voter;

use App\Entity\Game;
use App\Entity\GameRegistration;
use App\Entity\User;
use App\Security\Voter\GameRegistrationVoter;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;

final class GameRegistrationVoterTest extends TestCase
{
    private GameRegistrationVoter $voter;

    protected function setUp(): void
    {
        $this->voter = new GameRegistrationVoter();
    }

    private function createToken(?User $user): TokenInterface
    {
        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($user);

        return $token;
    }

    private function makePublicGame(): Game
    {
        $game = new Game();
        $game->setTitle('Public')->setAddress('Field')->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $game->setIsPublic(true);

        return $game;
    }

    private function makePrivateGame(): Game
    {
        $game = new Game();
        $game->setTitle('Private')->setAddress('Field')->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $game->setIsPublic(false);

        return $game;
    }

    // REGISTER_GAME

    public function testCanRegisterToPublicGame(): void
    {
        $user  = (new User())->setRole('ROLE_USER');
        $token = $this->createToken($user);

        $this->assertSame(1, $this->voter->vote($token, $this->makePublicGame(), [GameRegistrationVoter::REGISTER_GAME]));
    }

    public function testCannotRegisterToPrivateGameWithoutPermission(): void
    {
        $user  = (new User())->setRole('ROLE_USER')->setCanSeePrivate(false);
        $token = $this->createToken($user);

        $this->assertSame(-1, $this->voter->vote($token, $this->makePrivateGame(), [GameRegistrationVoter::REGISTER_GAME]));
    }

    public function testCanRegisterToPrivateGameWithCanSeePrivate(): void
    {
        $user  = (new User())->setRole('ROLE_USER')->setCanSeePrivate(true);
        $token = $this->createToken($user);

        $this->assertSame(1, $this->voter->vote($token, $this->makePrivateGame(), [GameRegistrationVoter::REGISTER_GAME]));
    }

    public function testCanRegisterToPrivateGameAsAdmin(): void
    {
        $user  = (new User())->setRole('ROLE_ADMIN');
        $token = $this->createToken($user);

        $this->assertSame(1, $this->voter->vote($token, $this->makePrivateGame(), [GameRegistrationVoter::REGISTER_GAME]));
    }

    public function testCannotRegisterWhenUnauthenticated(): void
    {
        $token = $this->createToken(null);

        $this->assertSame(-1, $this->voter->vote($token, $this->makePublicGame(), [GameRegistrationVoter::REGISTER_GAME]));
    }

    // DELETE_GAME_REGISTRATION

    public function testUserCanDeleteOwnRegistration(): void
    {
        $user         = (new User())->setRole('ROLE_USER');
        $registration = (new GameRegistration())->setUser($user);
        $token        = $this->createToken($user);

        $this->assertSame(1, $this->voter->vote($token, $registration, [GameRegistrationVoter::DELETE_GAME_REGISTRATION]));
    }

    public function testUserCannotDeleteOthersRegistration(): void
    {
        $owner        = (new User())->setRole('ROLE_USER');
        $otherUser    = (new User())->setRole('ROLE_USER');
        $registration = (new GameRegistration())->setUser($owner);
        $token        = $this->createToken($otherUser);

        $this->assertSame(-1, $this->voter->vote($token, $registration, [GameRegistrationVoter::DELETE_GAME_REGISTRATION]));
    }

    public function testAdminCanDeleteAnyRegistration(): void
    {
        $owner        = (new User())->setRole('ROLE_USER');
        $admin        = (new User())->setRole('ROLE_ADMIN');
        $registration = (new GameRegistration())->setUser($owner);
        $token        = $this->createToken($admin);

        $this->assertSame(1, $this->voter->vote($token, $registration, [GameRegistrationVoter::DELETE_GAME_REGISTRATION]));
    }

    public function testOrganizerCanDeleteAnyRegistration(): void
    {
        $owner        = (new User())->setRole('ROLE_USER');
        $organizer    = (new User())->setRole('ROLE_ORGANIZER');
        $registration = (new GameRegistration())->setUser($owner);
        $token        = $this->createToken($organizer);

        $this->assertSame(1, $this->voter->vote($token, $registration, [GameRegistrationVoter::DELETE_GAME_REGISTRATION]));
    }

    // PATCH_GAME_REGISTRATION

    public function testAdminCanPatchRegistration(): void
    {
        $owner        = (new User())->setRole('ROLE_USER');
        $admin        = (new User())->setRole('ROLE_ADMIN');
        $registration = (new GameRegistration())->setUser($owner);
        $token        = $this->createToken($admin);

        $this->assertSame(1, $this->voter->vote($token, $registration, [GameRegistrationVoter::PATCH_GAME_REGISTRATION]));
    }

    public function testOrganizerCanPatchRegistration(): void
    {
        $owner        = (new User())->setRole('ROLE_USER');
        $organizer    = (new User())->setRole('ROLE_ORGANIZER');
        $registration = (new GameRegistration())->setUser($owner);
        $token        = $this->createToken($organizer);

        $this->assertSame(1, $this->voter->vote($token, $registration, [GameRegistrationVoter::PATCH_GAME_REGISTRATION]));
    }

    public function testRegularUserCannotPatchRegistration(): void
    {
        $user         = (new User())->setRole('ROLE_USER');
        $registration = (new GameRegistration())->setUser($user);
        $token        = $this->createToken($user);

        $this->assertSame(-1, $this->voter->vote($token, $registration, [GameRegistrationVoter::PATCH_GAME_REGISTRATION]));
    }

    public function testUnsupportedAttributeIsAbstained(): void
    {
        $token = $this->createToken(null);

        $this->assertSame(0, $this->voter->vote($token, null, ['UNSUPPORTED_ATTR']));
    }
}
