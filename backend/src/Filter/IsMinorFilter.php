<?php

namespace App\Filter;

use ApiPlatform\Doctrine\Orm\Filter\FilterInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use Doctrine\ORM\QueryBuilder;

/**
 * Filters users by age category via `?isMinor=true|false` (age computed from dateOfBirth).
 */
final class IsMinorFilter implements FilterInterface
{
    public function apply(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $value = $context['filters']['isMinor'] ?? null;
        if (null === $value) {
            return;
        }

        $isMinor = filter_var($value, \FILTER_VALIDATE_BOOLEAN, \FILTER_NULL_ON_FAILURE);
        if (null === $isMinor) {
            return;
        }

        $alias      = $queryBuilder->getRootAliases()[0];
        $parameter  = $queryNameGenerator->generateParameterName('isMinorCutoff');
        $cutoffDate = (new \DateTimeImmutable('today'))->modify('-18 years');

        if ($isMinor) {
            $queryBuilder->andWhere(sprintf('%s.dateOfBirth > :%s', $alias, $parameter));
        } else {
            $queryBuilder->andWhere(sprintf('%s.dateOfBirth <= :%s', $alias, $parameter));
        }

        $queryBuilder->setParameter($parameter, $cutoffDate);
    }

    public function getDescription(string $resourceClass): array
    {
        return [
            'isMinor' => [
                'property'    => 'dateOfBirth',
                'type'        => 'bool',
                'required'    => false,
                'description' => 'Filter users by age category: true for minors (age < 18), false for adults.',
            ],
        ];
    }
}
