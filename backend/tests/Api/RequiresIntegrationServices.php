<?php

namespace App\Tests\Api;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;

/**
 * Database and Redis guards shared by the API integration tests.
 *
 * Both services are required: fixtures are written through Doctrine, and
 * logging in stores the JWT nonce in Redis.
 *
 * These guards used to be copied into each test case, and the copies drifted.
 * DBAL 4 made Connection::connect() protected, so every copy calling it threw
 * an Error that the catch reported as "Database is not available" — 15 tests
 * skipped unconditionally, whatever services were running. One implementation
 * here means one behaviour, and a failure that is about the services again.
 */
trait RequiresIntegrationServices
{
    private function skipIfDatabaseUnavailable(EntityManagerInterface $entityManager): void
    {
        try {
            $connection = $entityManager->getConnection();
            $connection->executeQuery('SELECT 1');

            $schemaManager = $connection->createSchemaManager();
            $tables = array_map('strtolower', $schemaManager->listTableNames());

            if (!in_array('users', $tables, true)) {
                $metadata = $entityManager->getMetadataFactory()->getAllMetadata();
                if ([] === $metadata) {
                    self::markTestSkipped('No Doctrine metadata available to initialize test schema.');

                    return;
                }

                $schemaTool = new SchemaTool($entityManager);
                $schemaTool->createSchema($metadata);
            }

            $this->skipIfRedisUnavailable();
        } catch (\Throwable $exception) {
            self::markTestSkipped('Database is not available for API integration test: '.$exception->getMessage());
        }
    }

    private function skipIfRedisUnavailable(): void
    {
        $redisUrl = $_SERVER['REDIS_URL'] ?? $_ENV['REDIS_URL'] ?? getenv('REDIS_URL');
        if (!\is_string($redisUrl) || '' === trim($redisUrl)) {
            self::markTestSkipped('Redis URL is missing for API integration test.');

            return;
        }

        $host = (string) (parse_url($redisUrl, PHP_URL_HOST) ?: '127.0.0.1');
        $port = (int) (parse_url($redisUrl, PHP_URL_PORT) ?: 6379);

        $socket = @stream_socket_client(
            sprintf('tcp://%s:%d', $host, $port),
            $errorCode,
            $errorMessage,
            0.2
        );

        if (false === $socket) {
            self::markTestSkipped(sprintf('Redis is not available for API integration test: %s', $errorMessage ?: (string) $errorCode));

            return;
        }

        fclose($socket);
    }
}
