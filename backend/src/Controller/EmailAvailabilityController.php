<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class EmailAvailabilityController extends AbstractController
{
    public function __construct(
        private readonly UserRepository $userRepository,
    ) {
    }

    #[Route('/api/register/check-email', methods: ['GET'])]
    public function __invoke(Request $request): JsonResponse
    {
        $email = trim((string) $request->query->get('email', ''));

        if ('' === $email || false === filter_var($email, \FILTER_VALIDATE_EMAIL)) {
            return new JsonResponse(['available' => true]);
        }

        $existingUser = $this->userRepository->findOneBy(['email' => $email]);
        $available    = !$existingUser || !$existingUser->isEmailVerified();

        return new JsonResponse(['available' => $available]);
    }
}
