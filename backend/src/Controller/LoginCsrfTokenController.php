<?php

declare(strict_types=1);

namespace App\Controller;

use App\Security\Jwt\LoginCsrfManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class LoginCsrfTokenController extends AbstractController
{
    public function __construct(
        private readonly LoginCsrfManager $loginCsrfManager,
    ) {
    }

    #[Route('/api/csrf/token', methods: ['GET'])]
    #[Route('/api/csrf/login', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        $token = $this->loginCsrfManager->generateToken();

        return new JsonResponse([
            'csrfToken' => $token,
        ]);
    }
}
