<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Security\User\UserLoaderInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository implements UserLoaderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * Addresses identify an account case-insensitively: nobody expects
     * "John@example.com" and "john@example.com" to be different people, and
     * mail transport treats the domain that way regardless.
     *
     * Every identity lookup goes through here so the whole surface agrees.
     * It did not before: password reset lowercased its needle while
     * registration stored the address as typed and login compared it exactly,
     * so anyone who signed up with a capital letter could never reset.
     */
    public function findOneByEmailCaseInsensitive(string $email): ?User
    {
        $normalized = mb_strtolower(trim($email));

        if ('' === $normalized) {
            return null;
        }

        return $this->createQueryBuilder('user')
            ->andWhere('LOWER(user.email) = :email')
            ->setParameter('email', $normalized)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Used by the security layer instead of the entity provider's exact match on
     * the email property, so a login is case-insensitive too.
     */
    public function loadUserByIdentifier(string $identifier): ?UserInterface
    {
        return $this->findOneByEmailCaseInsensitive($identifier);
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
