<?php

namespace App\Filter;

use ApiPlatform\Doctrine\Orm\Filter\FilterInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use Doctrine\ORM\QueryBuilder;

final class UserNameSearchFilter implements FilterInterface
{
    public function apply(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $value = $context['filters']['search'] ?? null;
        if (!\is_string($value) || '' === trim($value)) {
            return;
        }

        $alias     = $queryBuilder->getRootAliases()[0];
        $parameter = $queryNameGenerator->generateParameterName('nameSearch');
        $searchBy  = $context['filters']['searchBy'] ?? 'lastname';
        $field     = 'firstname' === $searchBy ? 'firstname' : 'lastname';

        $queryBuilder
            ->andWhere(sprintf(
                'LOWER(%1$s.%2$s) LIKE :%3$s',
                $alias,
                $field,
                $parameter,
            ))
            ->setParameter($parameter, '%'.mb_strtolower(trim($value)).'%');
    }

    public function getDescription(string $resourceClass): array
    {
        return [
            'search' => [
                'property'    => 'lastname',
                'type'        => 'string',
                'required'    => false,
                'description' => 'Free-text search matching the selected firstname or lastname field.',
            ],
            'searchBy' => [
                'property'    => 'searchBy',
                'type'        => 'string',
                'required'    => false,
                'description' => 'Search target field: firstname or lastname.',
            ],
        ];
    }
}
