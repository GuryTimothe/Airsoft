<?php

namespace App\Controller;

use App\Entity\GameRegistration;
use App\Repository\GameRegistrationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;

final class GameRegistrationPresenceController extends AbstractController
{
    #[Route('/api/game_registrations/{id}/presence', methods: ['PATCH'], requirements: ['id' => '\\d+'])]
    public function __invoke(
        int $id,
        Request $request,
        GameRegistrationRepository $gameRegistrationRepository,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $registration = $gameRegistrationRepository->find($id);
        if (!$registration instanceof GameRegistration) {
            throw $this->createNotFoundException('Inscription introuvable.');
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            throw new BadRequestHttpException('Payload JSON invalide.');
        }

        $presence = $payload['isPresent'] ?? $payload['present'] ?? null;
        if (!is_bool($presence)) {
            throw new BadRequestHttpException('Le champ isPresent (ou present) doit etre un booleen.');
        }

        $registration->setIsPresent($presence);
        $entityManager->flush();

        return $this->json([
            'id'            => $registration->getId(),
            'gameId'        => $registration->getGameId(),
            'userId'        => $registration->getUserId(),
            'userFirstname' => $registration->getUserFirstname(),
            'userLastname'  => $registration->getUserLastname(),
            'userEmail'     => $registration->getUserEmail(),
            'isPresent'     => $registration->isPresent(),
            'createdAt'     => $registration->getCreatedAt()->format(DATE_ATOM),
        ]);
    }
}
