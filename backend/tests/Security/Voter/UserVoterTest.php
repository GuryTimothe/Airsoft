<?php

namespace App\Tests\Security\Voter;

use App\Entity\User;
use App\Security\Voter\UserVoter;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;

final class UserVoterTest extends TestCase
{
    public function testAdminCanDeleteRegularUser(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_ADMIN');
        $target = (new User())->setRole('ROLE_USER');

        $this->assertSame(1, $voter->vote($this->createToken($actor), $target, [UserVoter::DELETE_USER]));
    }

    public function testAdminCannotDeleteAdmin(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_ADMIN');
        $target = (new User())->setRole('ROLE_ADMIN');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), $target, [UserVoter::DELETE_USER]));
    }

    public function testAdminCannotDeleteSuperAdmin(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_ADMIN');
        $target = (new User())->setRole('ROLE_SUPER_ADMIN');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), $target, [UserVoter::DELETE_USER]));
    }

    public function testSuperAdminCanDeleteAdmin(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_SUPER_ADMIN');
        $target = (new User())->setRole('ROLE_ADMIN');

        $this->assertSame(1, $voter->vote($this->createToken($actor), $target, [UserVoter::DELETE_USER]));
    }

    public function testUserCannotDeleteAnotherUser(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_USER');
        $target = (new User())->setRole('ROLE_USER');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), $target, [UserVoter::DELETE_USER]));
    }

    public function testUserCannotDeleteThemself(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_USER');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), $actor, [UserVoter::DELETE_USER]));
    }

    public function testOrganizerCannotDeleteAnotherUser(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_ORGANIZER');
        $target = (new User())->setRole('ROLE_USER');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), $target, [UserVoter::DELETE_USER]));
    }

    public function testOrganizerCannotDeleteThemself(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_ORGANIZER');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), $actor, [UserVoter::DELETE_USER]));
    }

    public function testAdminCanCreateRegularUser(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_ADMIN');
        $target = (new User())->setRole('ROLE_USER');

        $this->assertSame(1, $voter->vote($this->createToken($actor), $target, [UserVoter::CREATE_USER]));
    }

    public function testAdminCannotCreateAdmin(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_ADMIN');
        $target = (new User())->setRole('ROLE_ADMIN');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), $target, [UserVoter::CREATE_USER]));
    }

    public function testAdminCannotCreateSuperAdmin(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_ADMIN');
        $target = (new User())->setRole('ROLE_SUPER_ADMIN');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), $target, [UserVoter::CREATE_USER]));
    }

    public function testSuperAdminCanCreateAdmin(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_SUPER_ADMIN');
        $target = (new User())->setRole('ROLE_ADMIN');

        $this->assertSame(1, $voter->vote($this->createToken($actor), $target, [UserVoter::CREATE_USER]));
    }

    public function testUserCannotCreateUser(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_USER');
        $target = (new User())->setRole('ROLE_USER');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), $target, [UserVoter::CREATE_USER]));
    }

    public function testOrganizerCannotCreateUser(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_ORGANIZER');
        $target = (new User())->setRole('ROLE_USER');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), $target, [UserVoter::CREATE_USER]));
    }

    public function testAdminCanViewAllUsers(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_ADMIN');

        $this->assertSame(1, $voter->vote($this->createToken($actor), null, [UserVoter::VIEW_ALL_USERS]));
    }

    public function testSuperAdminCanViewAllUsers(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_SUPER_ADMIN');

        $this->assertSame(1, $voter->vote($this->createToken($actor), null, [UserVoter::VIEW_ALL_USERS]));
    }

    public function testUserCannotViewAllUsers(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_USER');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), null, [UserVoter::VIEW_ALL_USERS]));
    }

    public function testOrganizerCannotViewAllUsers(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_ORGANIZER');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), null, [UserVoter::VIEW_ALL_USERS]));
    }

    public function testAdminCanUpdateUser(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_ADMIN');
        $target = (new User())->setRole('ROLE_USER');

        $this->assertSame(1, $voter->vote($this->createToken($actor), $target, [UserVoter::UPDATE_USER]));
    }

    public function testSuperAdminCanUpdateUser(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_SUPER_ADMIN');
        $target = (new User())->setRole('ROLE_USER');

        $this->assertSame(1, $voter->vote($this->createToken($actor), $target, [UserVoter::UPDATE_USER]));
    }

    public function testUserCannotUpdateUser(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_USER');
        $target = (new User())->setRole('ROLE_USER');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), $target, [UserVoter::UPDATE_USER]));
    }

    public function testOrganizerCannotUpdateUser(): void
    {
        $voter = new UserVoter();
        $actor = (new User())->setRole('ROLE_ORGANIZER');
        $target = (new User())->setRole('ROLE_USER');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), $target, [UserVoter::UPDATE_USER]));
    }

    private function createToken(User $user): TokenInterface
    {
        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($user);

        return $token;
    }
}