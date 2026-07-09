<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Dto\GameRegistrationPresenceInput;
use App\Entity\GameRegistration;
use App\Repository\GameRegistrationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @implements ProcessorInterface<GameRegistrationPresenceInput, GameRegistration>
 */
class GameRegistrationPresenceProcessor implements ProcessorInterface
{
    public function __construct(
        private GameRegistrationRepository $gameRegistrationRepository,
        private EntityManagerInterface $entityManager,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        /** @var GameRegistrationPresenceInput $data */

        $id           = isset($uriVariables['id']) ? (int) $uriVariables['id'] : 0;
        $registration = $this->gameRegistrationRepository->find($id);

        if (!$registration instanceof GameRegistration) {
            throw new NotFoundHttpException('Inscription introuvable.');
        }

        $presence = $data->isPresent ?? $data->present;
        if (null === $presence) {
            throw new BadRequestHttpException('Le champ isPresent (ou present) est obligatoire.');
        }

        $registration->setIsPresent($presence);
        $this->entityManager->flush();

        return $registration;
    }
}
