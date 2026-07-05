<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Delete;
use App\Entity\User;
use App\State\MeDeleteProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

final class MeDeleteProcessorTest extends TestCase
{
    public function testProcessRemovesAuthenticatedUserAndFlushes(): void
    {
        $user = (new User())->setRole('ROLE_USER');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('remove')->with($user);
        $entityManager->expects($this->once())->method('flush');

        $security = $this->createMock(Security::class);
        $security->expects($this->never())->method('getUser');

        $processor = new MeDeleteProcessor($entityManager, $security);

        $this->assertNull($processor->process($user, new Delete(uriTemplate: '/me')));
    }

    public function testProcessFallsBackToAuthenticatedUserWhenDataIsMissing(): void
    {
        $user = (new User())->setRole('ROLE_USER');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('remove')->with($user);
        $entityManager->expects($this->once())->method('flush');

        $security = $this->createMock(Security::class);
        $security->expects($this->once())->method('getUser')->willReturn($user);

        $processor = new MeDeleteProcessor($entityManager, $security);

        $this->assertNull($processor->process(null, new Delete(uriTemplate: '/me')));
    }

    public function testProcessThrowsWhenAuthenticatedUserIsMissing(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('remove');
        $entityManager->expects($this->never())->method('flush');

        $security = $this->createMock(Security::class);
        $security->expects($this->once())->method('getUser')->willReturn(null);

        $processor = new MeDeleteProcessor($entityManager, $security);

        $this->expectException(AccessDeniedException::class);
        $processor->process(null, new Delete(uriTemplate: '/me'));
    }
}
