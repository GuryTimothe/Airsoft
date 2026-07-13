<?php

namespace App\Tests\Entity;

use App\Entity\Game;
use App\Entity\GameRegistration;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

final class GameRegistrationTest extends TestCase
{
    public function testDefaultValues(): void
    {
        $reg = new GameRegistration();

        $this->assertNull($reg->getId());
        $this->assertNull($reg->getGame());
        $this->assertNull($reg->getUser());
        $this->assertFalse($reg->isPresent());
        $this->assertFalse($reg->getPresence());
        $this->assertInstanceOf(\DateTimeImmutable::class, $reg->getCreatedAt());
    }

    public function testSetGame(): void
    {
        $reg = new GameRegistration();
        $game = new Game();
        $game->setTitle('Test');
        $game->setAddress('Terrain');
        $game->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $game->setPrice(10.0);
        $game->setMaxPlaces(20);
        $game->setIsPublic(true);

        $result = $reg->setGame($game);
        $this->assertSame($reg, $result);
        $this->assertSame($game, $reg->getGame());
    }

    public function testSetUser(): void
    {
        $reg = new GameRegistration();
        $user = new User();

        $result = $reg->setUser($user);
        $this->assertSame($reg, $result);
        $this->assertSame($user, $reg->getUser());
    }

    public function testSetIsPresent(): void
    {
        $reg = new GameRegistration();

        $result = $reg->setIsPresent(true);
        $this->assertSame($reg, $result);
        $this->assertTrue($reg->isPresent());
        $this->assertTrue($reg->getPresence());
    }

    public function testSetPresent(): void
    {
        $reg = new GameRegistration();

        $result = $reg->setPresent(true);
        $this->assertSame($reg, $result);
        $this->assertTrue($reg->isPresent());
    }

    public function testSetPresentFalse(): void
    {
        $reg = new GameRegistration();
        $reg->setPresent(true);
        $reg->setPresent(false);

        $this->assertFalse($reg->isPresent());
    }

    public function testSetGameToNull(): void
    {
        $reg = new GameRegistration();
        $reg->setGame(new Game());
        $reg->setGame(null);

        $this->assertNull($reg->getGame());
    }

    public function testSetUserToNull(): void
    {
        $reg = new GameRegistration();
        $reg->setUser(new User());
        $reg->setUser(null);

        $this->assertNull($reg->getUser());
    }

    public function testSetPresence(): void
    {
        $reg = new GameRegistration();

        $result = $reg->setPresence(true);
        $this->assertSame($reg, $result);
        $this->assertTrue($reg->isPresent());
    }

    public function testGetGameId(): void
    {
        $reg = new GameRegistration();
        $this->assertNull($reg->getGameId());

        $game = new Game();
        $game->setTitle('T')->setAddress('A')->setStartDateTime(new \DateTimeImmutable('+1 day'));
        $reg->setGame($game);

        // Game has no id in unit tests (no DB), returns null
        $this->assertNull($reg->getGameId());
    }

    public function testGetUserIdNullWhenNoUser(): void
    {
        $reg = new GameRegistration();
        $this->assertNull($reg->getUserId());
    }

    public function testGetUserFirstnameLastnameEmailNullWhenNoUser(): void
    {
        $reg = new GameRegistration();
        $this->assertNull($reg->getUserFirstname());
        $this->assertNull($reg->getUserLastname());
        $this->assertNull($reg->getUserEmail());
    }

    public function testGetUserFirstnameLastnameEmailWhenUserSet(): void
    {
        $user = (new User())
            ->setFirstname('Alice')
            ->setLastname('Dupont')
            ->setEmail('alice@example.com');

        $reg = (new GameRegistration())->setUser($user);

        $this->assertSame('Alice', $reg->getUserFirstname());
        $this->assertSame('Dupont', $reg->getUserLastname());
        $this->assertSame('alice@example.com', $reg->getUserEmail());
    }

    public function testGetUserAgeNullWhenNoUser(): void
    {
        $reg = new GameRegistration();
        $this->assertNull($reg->getUserAge());
    }

    public function testGetUserAgeWhenUserHasDateOfBirth(): void
    {
        $user = (new User())
            ->setDateOfBirth(new \DateTimeImmutable('-30 years'));

        $reg = (new GameRegistration())->setUser($user);

        $age = $reg->getUserAge();
        $this->assertNotNull($age);
        $this->assertGreaterThanOrEqual(29, $age);
        $this->assertLessThanOrEqual(30, $age);
    }
}
