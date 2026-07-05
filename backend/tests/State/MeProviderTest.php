<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Get;
use App\Entity\User;
use App\State\MeProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

final class MeProviderTest extends TestCase
{
    public function testProvideReturnsAuthenticatedUser(): void
    {
        $user = (new User())->setRole('ROLE_USER');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($user);

        $provider = new MeProvider($security);

        $this->assertSame($user, $provider->provide(new Get(uriTemplate: '/me')));
    }

    public function testProvideThrowsWhenAuthenticatedUserIsMissing(): void
    {
        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn(null);

        $provider = new MeProvider($security);

        $this->expectException(AccessDeniedException::class);
        $provider->provide(new Get(uriTemplate: '/me'));
    }
}
