<?php

namespace App\Repository;

use App\Entity\Game;
use App\Entity\GameRegistration;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<GameRegistration>
 */
class GameRegistrationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, GameRegistration::class);
    }

    public function countByGame(Game $game): int
    {
        return (int) $this->createQueryBuilder('registration')
            ->select('COUNT(registration.id)')
            ->andWhere('registration.game = :game')
            ->setParameter('game', $game)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
