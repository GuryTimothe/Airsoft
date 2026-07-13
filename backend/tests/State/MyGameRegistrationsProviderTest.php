<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\GetCollection;
use App\Entity\GameRegistration;
use App\Entity\User;
use App\Repository\GameRegistrationRepository;
use App\State\MyGameRegistrationsProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

final class MyGameRegistrationsProviderTest extends TestCase
{
    public function testThrowsAccessDeniedWhenNotAuthenticated(): void
    {
        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn(null);

        $repository = $this->createMock(GameRegistrationRepository::class);

        $provider = new MyGameRegistrationsProvider($security, $repository);

        $this->expectException(AccessDeniedException::class);

        $provider->provide(new GetCollection());
    }

    public function testReturnsRegistrationsForCurrentUser(): void
    {
        $user = new User();

        $reg1 = new GameRegistration();
        $reg2 = new GameRegistration();

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($user);

        $repository = $this->createMock(GameRegistrationRepository::class);
        $repository
            ->expects($this->once())
            ->method('findBy')
            ->with(['user' => $user], ['createdAt' => 'DESC'])
            ->willReturn([$reg1, $reg2]);

        $provider = new MyGameRegistrationsProvider($security, $repository);

        $result = $provider->provide(new GetCollection());

        $this->assertIsArray($result);
        $this->assertCount(2, $result);
        $this->assertSame($reg1, $result[0]);
        $this->assertSame($reg2, $result[1]);
    }

    public function testReturnsEmptyArrayWhenUserHasNoRegistrations(): void
    {
        $user = new User();

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($user);

        $repository = $this->createMock(GameRegistrationRepository::class);
        $repository->method('findBy')->willReturn([]);

        $provider = new MyGameRegistrationsProvider($security, $repository);

        $result = $provider->provide(new GetCollection());

        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }
}
