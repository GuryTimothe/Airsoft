<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Predis\Client as RedisClient;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class HealthController
{
    public function __construct(
        private readonly Connection $connection,
    ) {
    }

    #[Route('/health', name: 'health_check', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        $checks  = [];
        $healthy = true;

        try {
            $this->connection->executeQuery('SELECT 1');
            $checks['database'] = 'ok';
        } catch (\Throwable $e) {
            $checks['database'] = 'error';
            $healthy            = false;
        }

        try {
            $redis = new RedisClient($_ENV['REDIS_URL'] ?? 'redis://127.0.0.1:6379');
            $redis->ping();
            $checks['redis'] = 'ok';
        } catch (\Throwable $e) {
            $checks['redis'] = 'error';
            $healthy         = false;
        }

        return new JsonResponse(
            ['status' => $healthy ? 'ok' : 'error', 'checks' => $checks],
            $healthy ? 200 : 503
        );
    }
}
