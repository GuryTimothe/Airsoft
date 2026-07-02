<?php

namespace App\Tests\Entity;

use App\Entity\Game;
use PHPUnit\Framework\TestCase;

final class GameTest extends TestCase
{
    public function testGameImageFieldCanBeSetAndRetrieved(): void
    {
        $game = new Game();
        $game->setTitle('Test');
        $game->setDescription('Description');
        $game->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $game->setAddress('Adresse');
        $game->setPrice(10.0);
        $game->setMaxPlaces(20);
        $game->setIsPublic(true);

        $this->assertNull($game->getImage());

        $game->setImage('http://localhost/uploads/games/banner.jpg');
        $this->assertSame('http://localhost/uploads/games/banner.jpg', $game->getImage());
    }
}
