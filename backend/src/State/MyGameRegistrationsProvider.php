<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\GameRegistration;
use App\Entity\User;
use App\Repository\GameRegistrationRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

/**
 * @implements ProviderInterface<iterable<GameRegistration>>
 */
class MyGameRegistrationsProvider implements ProviderInterface
{
    public function __construct(
        private Security $security,
        private GameRegistrationRepository $gameRegistrationRepository,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): iterable
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            throw new AccessDeniedException('Authenticated user not found.');
        }

        return $this->gameRegistrationRepository->findBy(
            ['user' => $user],
            ['createdAt' => 'DESC'],
        );
    }
}
