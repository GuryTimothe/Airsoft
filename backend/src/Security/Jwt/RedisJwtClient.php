<?php

namespace App\Security\Jwt;

use Predis\Client;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class RedisJwtClient
{
    private Client $client;

    public function __construct(
        #[Autowire('%env(REDIS_URL)%')]
        string $redisUrl,
    ) {
        $this->client = new Client($redisUrl);
    }

    public function get(string $key): mixed
    {
        return $this->client->get($key);
    }

    public function set(string $key, string $value): void
    {
        $this->client->set($key, $value);
    }

    public function setex(string $key, int $ttl, string $value): void
    {
        $this->client->setex($key, $ttl, $value);
    }

    public function exists(string $key): int
    {
        return (int) $this->client->exists($key);
    }

    public function del(string $key): int
    {
        return (int) $this->client->del([$key]);
    }
}
