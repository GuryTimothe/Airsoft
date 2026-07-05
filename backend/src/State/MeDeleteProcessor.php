<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

/**
 * @implements ProcessorInterface<User|null, mixed>
 */
class MeDeleteProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        $user = $data;
        if (null === $user) {
            $user = $this->security->getUser();
        }
        if (!$user instanceof User) {
            throw new AccessDeniedException('Authenticated user to delete is missing.');
        }

        $this->entityManager->remove($user);
        $this->entityManager->flush();

        return null;
    }
}
