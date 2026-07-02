<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Patch;
use App\Entity\User;
use App\State\MeUpdateProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;

final class MeUpdateProcessorTest extends TestCase
{
    public function testGeneralUpdatePersistsAllowedFields(): void
    {
        $user = (new User())
            ->setFirstname('Luffy')
            ->setLastname('Monkey D')
            ->setPseudo('Mugiwara')
            ->setPhone('0612345678')
            ->setDateOfBirth(new \DateTimeImmutable('1990-01-01'));
        $previous = (new User())
            ->setFirstname('Old')
            ->setLastname('Name')
            ->setPseudo('OldPseudo')
            ->setPhone('0600000000')
            ->setDateOfBirth(new \DateTimeImmutable('1980-01-01'));

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('flush');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($previous);

        $processor = new MeUpdateProcessor($entityManager, $security);

        $result = $processor->process($user, new Patch(uriTemplate: '/me'), context: ['previous_data' => $previous]);

        $this->assertSame($previous, $result);
        $this->assertSame('Luffy', $result->getFirstname());
        $this->assertSame('Monkey D', $result->getLastname());
        $this->assertSame('Mugiwara', $result->getPseudo());
        $this->assertSame('0612345678', $result->getPhone());
        $this->assertSame('1990-01-01', $result->getDateOfBirth()->format('Y-m-d'));
    }

    public function testGeneralUpdateDoesNotChangeEmail(): void
    {
        $user = new User();
        $user->setEmail('new@example.com');

        $previous = (new User())
            ->setFirstname('Old name')
            ->setEmail('old@example.com');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('flush');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($previous);

        $processor = new MeUpdateProcessor($entityManager, $security);

        $result = $processor->process($user, new Patch(uriTemplate: '/me'), context: ['previous_data' => $previous]);

        $this->assertSame($previous, $result);
        $this->assertSame('old@example.com', $result->getEmail());
    }
}
