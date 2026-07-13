<?php

namespace App\Tests\State;

use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\GetCollection;
use App\Entity\Game;
use App\Entity\User;
use App\State\GameVisibilityExtension;
use Doctrine\ORM\QueryBuilder;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;

final class GameVisibilityExtensionTest extends TestCase
{
    private function createExtension(bool $isAdmin = false, ?User $user = null): GameVisibilityExtension
    {
        $security = $this->createMock(Security::class);
        $security->method('isGranted')->willReturnCallback(fn (string $attr) => $isAdmin && 'ROLE_ADMIN' === $attr);
        $security->method('getUser')->willReturn($user);

        return new GameVisibilityExtension($security);
    }

    private function createQueryBuilder(string $alias = 'o'): QueryBuilder
    {
        $qb = $this->createMock(QueryBuilder::class);
        $qb->method('getRootAliases')->willReturn([$alias]);

        return $qb;
    }

    public function testDoesNotFilterWhenResourceIsNotGame(): void
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
            Game::class,
        );
    }

    public function testDoesNotFilterForUserWithCanSeePrivate(): void
    {
        $user = (new User())->setCanSeePrivate(true);
        $extension = $this->createExtension(user: $user);
        $qb        = $this->createQueryBuilder();
        $qb->expects($this->never())->method('andWhere');

        $extension->applyToCollection(
            $qb,
            $this->createMock(QueryNameGeneratorInterface::class),
            Game::class,
        );
    }

    public function testFiltersToPublicOnlyForRegularUser(): void
    {
        $user      = (new User())->setCanSeePrivate(false);
        $extension = $this->createExtension(user: $user);
        $qb        = $this->createQueryBuilder();
        $qb->expects($this->once())->method('andWhere')->with('o.isPublic = :isPublic')->willReturn($qb);
        $qb->expects($this->once())->method('setParameter')->with('isPublic', true)->willReturn($qb);

        $extension->applyToCollection(
            $qb,
            $this->createMock(QueryNameGeneratorInterface::class),
            Game::class,
        );
    }

    public function testFiltersToPublicOnlyForUnauthenticatedUser(): void
    {
        $extension = $this->createExtension(user: null);
        $qb        = $this->createQueryBuilder();
        $qb->expects($this->once())->method('andWhere')->with('o.isPublic = :isPublic')->willReturn($qb);
        $qb->expects($this->once())->method('setParameter')->with('isPublic', true)->willReturn($qb);

        $extension->applyToCollection(
            $qb,
            $this->createMock(QueryNameGeneratorInterface::class),
            Game::class,
        );
    }

    public function testApplyToItemAlsoFiltersForRegularUser(): void
    {
        $user      = (new User())->setCanSeePrivate(false);
        $extension = $this->createExtension(user: $user);
        $qb        = $this->createQueryBuilder();
        $qb->expects($this->once())->method('andWhere')->willReturn($qb);
        $qb->expects($this->once())->method('setParameter')->willReturn($qb);

        $extension->applyToItem(
            $qb,
            $this->createMock(QueryNameGeneratorInterface::class),
            Game::class,
            ['id' => 1],
        );
    }

    public function testDoesNotCrashWhenNoRootAlias(): void
    {
        $user      = (new User())->setCanSeePrivate(false);
        $extension = $this->createExtension(user: $user);

        $qb = $this->createMock(\Doctrine\ORM\QueryBuilder::class);
        $qb->method('getRootAliases')->willReturn([]);
        $qb->expects($this->never())->method('andWhere');

        $extension->applyToCollection(
            $qb,
            $this->createMock(QueryNameGeneratorInterface::class),
            Game::class,
        );
    }
}
