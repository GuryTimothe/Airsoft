<?php

namespace App\State;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\GameRegistration;
use App\Entity\User;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

class GameRegistrationVisibilityExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
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
        $this->restrictToCurrentUserForNonAdmin($queryBuilder, $resourceClass);
    }

    public function applyToItem(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        array $identifiers,
        ?Operation $operation = null,
        array $context = [],
    ): void {
        $this->restrictToCurrentUserForNonAdmin($queryBuilder, $resourceClass);
    }

    private function restrictToCurrentUserForNonAdmin(QueryBuilder $queryBuilder, string $resourceClass): void
    {
        if (GameRegistration::class !== $resourceClass || $this->security->isGranted('ROLE_ADMIN')) {
            return;
        }

        $user      = $this->security->getUser();
        $rootAlias = $queryBuilder->getRootAliases()[0] ?? null;

        if (!$user instanceof User || null === $rootAlias) {
            $queryBuilder->andWhere('1 = 0');

            return;
        }

        $queryBuilder
            ->andWhere(sprintf('%s.user = :currentUser', $rootAlias))
            ->setParameter('currentUser', $user);
    }
}
