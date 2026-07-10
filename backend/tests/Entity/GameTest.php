<?php

namespace App\Tests\Entity;

use App\Entity\Game;
use PHPUnit\Framework\TestCase;

final class GameTest extends TestCase
{
    private function createGame(): Game
    {
        $game = new Game();
        $game->setTitle('Partie test');
        $game->setDescription('Description');
        $game->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $game->setAddress('Terrain principal');
        $game->setPrice(10.0);
        $game->setMaxPlaces(20);
        $game->setIsPublic(true);

        return $game;
    }

    public function testGameImageFieldCanBeSetAndRetrieved(): void
    {
        $game = $this->createGame();

        $this->assertNull($game->getImage());

        $game->setImage('http://localhost/uploads/games/banner.jpg');
        $this->assertSame('http://localhost/uploads/games/banner.jpg', $game->getImage());
    }

    public function testDefaultValues(): void
    {
        $game = new Game();

        $this->assertNull($game->getId());
        $this->assertNull($game->getImage());
        $this->assertSame(0.0, $game->getPrice());
        $this->assertSame(0, $game->getMaxPlaces());
        $this->assertTrue($game->isPublic());
        $this->assertNull($game->getDescription());
        $this->assertInstanceOf(\DateTimeImmutable::class, $game->getCreatedAt());
        $this->assertInstanceOf(\DateTimeImmutable::class, $game->getUpdatedAt());
    }

    public function testSettersAndGetters(): void
    {
        $game = new Game();
        $dt = new \DateTimeImmutable('+1 day');

        $result = $game->setTitle('Nouvelle partie');
        $this->assertSame($game, $result);
        $this->assertSame('Nouvelle partie', $game->getTitle());

        $result = $game->setDescription('Ma description');
        $this->assertSame($game, $result);
        $this->assertSame('Ma description', $game->getDescription());

        $result = $game->setStartDateTime($dt);
        $this->assertSame($game, $result);
        $this->assertSame($dt, $game->getStartDateTime());

        $result = $game->setAddress('Terrain B');
        $this->assertSame($game, $result);
        $this->assertSame('Terrain B', $game->getAddress());

        $result = $game->setPrice(25.5);
        $this->assertSame($game, $result);
        $this->assertSame(25.5, $game->getPrice());

        $result = $game->setMaxPlaces(30);
        $this->assertSame($game, $result);
        $this->assertSame(30, $game->getMaxPlaces());

        $result = $game->setIsPublic(false);
        $this->assertSame($game, $result);
        $this->assertFalse($game->isPublic());
    }

    public function testGetRegistrationCount(): void
    {
        $game = $this->createGame();

        $this->assertSame(0, $game->getRegistrationCount());
    }

    public function testGetAvailablePlaces(): void
    {
        $game = $this->createGame();
        $game->setMaxPlaces(20);

        $this->assertSame(20, $game->getAvailablePlaces());
    }

    public function testIsFull(): void
    {
        $game = $this->createGame();
        $game->setMaxPlaces(20);

        $this->assertFalse($game->isFull());
    }

    public function testIsFullWhenMaxPlacesIsZero(): void
    {
        $game = new Game();
        $game->setMaxPlaces(0);

        $this->assertTrue($game->isFull());
    }

    public function testGetAvailablePlacesNeverGoesNegative(): void
    {
        $game = new Game();
        $game->setMaxPlaces(0);

        $this->assertSame(0, $game->getAvailablePlaces());
    }

    public function testOnPrePersistSetsTimestamps(): void
    {
        $game = new Game();
        $before = new \DateTimeImmutable();

        $game->onPrePersist();

        $this->assertGreaterThanOrEqual($before, $game->getCreatedAt());
        $this->assertGreaterThanOrEqual($before, $game->getUpdatedAt());
    }

    public function testOnPreUpdateUpdatesUpdatedAt(): void
    {
        $game = new Game();
        $game->onPrePersist();
        $createdAt = $game->getCreatedAt();

        $game->onPreUpdate();

        $this->assertGreaterThanOrEqual($createdAt, $game->getUpdatedAt());
    }

    public function testSetImageToNull(): void
    {
        $game = $this->createGame();
        $game->setImage('test.jpg');
        $game->setImage(null);

        $this->assertNull($game->getImage());
    }

    public function testSetDescriptionToNull(): void
    {
        $game = $this->createGame();
        $game->setDescription(null);

        $this->assertNull($game->getDescription());
    }
}
