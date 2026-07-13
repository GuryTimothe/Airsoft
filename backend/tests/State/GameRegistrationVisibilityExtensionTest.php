<?php

namespace App\Tests\State;

use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\GetCollection;
use App\Entity\GameRegistration;
use App\Entity\User;
use App\State\GameRegistrationVisibilityExtension;
use Doctrine\ORM\QueryBuilder;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;

final class GameRegistrationVisibilityExtensionTest extends TestCase
{
    private function createExtension(bool $isAdmin = false, ?User $user = null): GameRegistrationVisibilityExtension
    {
        $security = $this->createMock(Security::class);
        $security->method('isGranted')->willReturnCallback(function (string $attr) use ($isAdmin) {
            return $isAdmin && \in_array($attr, ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ORGANIZER'], true);
        });
        $security->method('getUser')->willReturn($user);

        return new GameRegistrationVisibilityExtension($security);
    }

    private function createQueryBuilder(string $alias = 'o'): QueryBuilder
    {
        $qb = $this->createMock(QueryBuilder::class);
        $qb->method('getRootAliases')->willReturn([$alias]);

        return $qb;
    }

    public function testDoesNotFilterWhenResourceIsNotGameRegistration(): void
    {
        $extension = $this->createExtension();
        $qb        = $this->createQueryBuilder();
        $qb->expects($this->never())->method('andWhere');

        $extension->applyToCollection(
            $qb,
            $this->createMock(QueryNameGeneratorInterface::class),
            \stdClass::class,
        );
    }

    public function testDoesNotFilterForAdmin(): void
    {
        $extension = $this->createExtension(isAdmin: true);
        $qb        = $this->createQueryBuilder();
        $qb->expects($this->never())->method('andWhere');

        $extension->applyToCollection(
            $qb,
            $this->createMock(QueryNameGeneratorInterface::class),
            GameRegistration::class,
        );
    }

    public function testFiltersToCurrentUserForNonAdmin(): void
    {
        $user      = new User();
        $extension = $this->createExtension(user: $user);
        $qb        = $this->createQueryBuilder();
        $qb->expects($this->once())->method('andWhere')->with('o.user = :currentUser')->willReturn($qb);
        $qb->expects($this->once())->method('setParameter')->with('currentUser', $user)->willReturn($qb);

        $extension->applyToCollection(
            $qb,
            $this->createMock(QueryNameGeneratorInterface::class),
            GameRegistration::class,
        );
    }

    public function testBlocksAllWhenUserNotAuthenticated(): void
    {
        $extension = $this->createExtension(user: null);
        $qb        = $this->createQueryBuilder();
        $qb->expects($this->once())->method('andWhere')->with('1 = 0')->willReturn($qb);

        $extension->applyToCollection(
            $qb,
            $this->createMock(QueryNameGeneratorInterface::class),
            GameRegistration::class,
        );
    }

    public function testApplyToItemAlsoFiltersForNonAdmin(): void
    {
        $user      = new User();
        $extension = $this->createExtension(user: $user);
        $qb        = $this->createQueryBuilder();
        $qb->expects($this->once())->method('andWhere')->with('o.user = :currentUser')->willReturn($qb);
        $qb->expects($this->once())->method('setParameter')->with('currentUser', $user)->willReturn($qb);

        $extension->applyToItem(
            $qb,
            $this->createMock(QueryNameGeneratorInterface::class),
            GameRegistration::class,
            ['id' => 1],
        );
    }
}
