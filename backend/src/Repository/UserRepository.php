<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * @param list<string> $roles
     *
     * @return list<User>
     */
    public function findForExport(?bool $isMinor = null, array $roles = []): array
    {
        $queryBuilder = $this->createQueryBuilder('user')
            ->orderBy('user.lastname', 'ASC')
            ->addOrderBy('user.firstname', 'ASC');

        if (null !== $isMinor) {
            $adultCutoff = new \DateTimeImmutable('today -18 years');

            if ($isMinor) {
                $queryBuilder->andWhere('user.dateOfBirth > :adultCutoff');
            } else {
                $queryBuilder->andWhere('user.dateOfBirth <= :adultCutoff');
            }

            $queryBuilder->setParameter('adultCutoff', $adultCutoff, Types::DATE_IMMUTABLE);
        }

        if ([] !== $roles) {
            $queryBuilder
                ->andWhere('user.role IN (:roles)')
                ->setParameter('roles', $roles);
        }

        /** @var list<User> $users */
        $users = $queryBuilder->getQuery()->getResult();

        return $users;
    }
}
