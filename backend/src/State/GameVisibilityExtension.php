<?php

namespace App\State;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Game;
use App\Entity\User;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

class GameVisibilityExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    public function __construct(private Security $security)
    {
    }

    public function applyToCollection(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        ?Operation $operation = null,
        array $context = [],
    ): void {
        $this->restrictPrivateGamesForUnauthorizedUsers($queryBuilder, $resourceClass);
    }

    public function applyToItem(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        array $identifiers,
        ?Operation $operation = null,
        array $context = [],
    ): void {
        $this->restrictPrivateGamesForUnauthorizedUsers($queryBuilder, $resourceClass);
    }

    private function restrictPrivateGamesForUnauthorizedUsers(QueryBuilder $queryBuilder, string $resourceClass): void
    {
        if (Game::class !== $resourceClass) {
            return;
        }

        $user = $this->security->getUser();

        if ($this->security->isGranted('ROLE_ADMIN')) {
            return;
        }

        if ($user instanceof User && $user->canSeePrivate()) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0] ?? null;
        if (null === $rootAlias) {
            return;
        }

        $queryBuilder
            ->andWhere(sprintf('%s.isPublic = :isPublic', $rootAlias))
            ->setParameter('isPublic', true);
    }
}
