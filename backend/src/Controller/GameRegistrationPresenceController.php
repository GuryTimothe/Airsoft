<?php

namespace App\Controller;

use App\Entity\GameRegistration;
use App\Entity\User;
use App\Repository\GameRegistrationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;

final class GameRegistrationPresenceController extends AbstractController
{
    public function __construct(
        #[Autowire(service: 'monolog.logger.security')]
        private readonly LoggerInterface $logger,
        #[Autowire('%kernel.environment%')]
        private readonly string $environment,
        #[Autowire('%kernel.secret%')]
        private readonly string $appSecret,
    ) {
    }

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

        $actor = $this->getUser();
        $this->logger->warning('Security registration presence updated by admin.', [
            'event_id'       => 'SEC.ADMIN.PRESENCE_UPDATED',
            'event_category' => 'admin_action',
            'severity'       => 'WARNING',
            'outcome'        => 'success',
            'action'         => 'registration_presence_update',
            'service'        => 'backend-api',
            'environment'    => $this->environment,
            'actor_type'     => $actor instanceof User ? 'user' : 'anonymous',
            'actor_id_hash'  => $actor instanceof User && null !== $actor->getId()
                ? hash_hmac('sha256', sprintf('user:%d', $actor->getId()), $this->appSecret)
                : null,
            'target_type'    => 'game_registration',
            'target_id_hash' => hash_hmac('sha256', sprintf('registration:%d', $id), $this->appSecret),
            'http_method'    => $request->getMethod(),
            'http_path'      => $request->getPathInfo(),
            'http_status'    => JsonResponse::HTTP_OK,
            'reason_code'    => 'ADMIN_UPDATE',
            'message'        => 'Registration presence updated by privileged actor.',
        ]);

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
