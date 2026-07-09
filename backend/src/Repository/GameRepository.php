<?php

namespace App\Repository;

use App\Entity\Game;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Game>
 */
class GameRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Game::class);
    }

    /**
     * @return list<Game>
     */
    public function findForExport(
        ?\DateTimeImmutable $dateFrom = null,
        ?\DateTimeImmutable $dateTo = null,
    ): array {
        $queryBuilder = $this->createQueryBuilder('game')
            ->orderBy('game.startDateTime', 'ASC');

        if (null !== $dateFrom) {
            $queryBuilder
                ->andWhere('game.startDateTime >= :dateFrom')
                ->setParameter('dateFrom', $dateFrom, Types::DATETIME_IMMUTABLE);
        }

        if (null !== $dateTo) {
            $queryBuilder
                ->andWhere('game.startDateTime <= :dateTo')
                ->setParameter('dateTo', $dateTo->setTime(23, 59, 59), Types::DATETIME_IMMUTABLE);
        }

        /** @var list<Game> $games */
        $games = $queryBuilder->getQuery()->getResult();

        return $games;
    }

    //    /**
    //     * @return Game[] Returns an array of Game objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('g')
    //            ->andWhere('g.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('g.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Game
    //    {
    //        return $this->createQueryBuilder('g')
    //            ->andWhere('g.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
