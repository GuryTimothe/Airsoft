<?php

namespace App\Tests\Security\Voter;

use App\Entity\User;
use App\Security\Voter\AppSettingVoter;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;

final class AppSettingVoterTest extends TestCase
{
    public function testAdminCanManageAppSettings(): void
    {
        $voter = new AppSettingVoter();
        $actor = (new User())->setRole('ROLE_ADMIN');

        $this->assertSame(1, $voter->vote($this->createToken($actor), null, [AppSettingVoter::MANAGE_APP_SETTINGS]));
    }

    public function testSuperAdminCanManageAppSettings(): void
    {
        $voter = new AppSettingVoter();
        $actor = (new User())->setRole('ROLE_SUPER_ADMIN');

        $this->assertSame(1, $voter->vote($this->createToken($actor), null, [AppSettingVoter::MANAGE_APP_SETTINGS]));
    }

    public function testOrganizerCannotManageAppSettings(): void
    {
        $voter = new AppSettingVoter();
        $actor = (new User())->setRole('ROLE_ORGANIZER');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), null, [AppSettingVoter::MANAGE_APP_SETTINGS]));
    }

    public function testUserCannotManageAppSettings(): void
    {
        $voter = new AppSettingVoter();
        $actor = (new User())->setRole('ROLE_USER');

        $this->assertSame(-1, $voter->vote($this->createToken($actor), null, [AppSettingVoter::MANAGE_APP_SETTINGS]));
    }

    private function createToken(User $user): TokenInterface
    {
        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($user);

        return $token;
    }
}