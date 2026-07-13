<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Patch;
use App\Entity\User;
use App\State\MeUpdateProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

final class MeUpdateProcessorTest extends TestCase
{
    private function createProcessor(
        EntityManagerInterface $entityManager,
        Security $security,
        ?Request $request = null,
    ): MeUpdateProcessor {
        $requestStack = new RequestStack();

        if (null !== $request) {
            $requestStack->push($request);
        }

        return new MeUpdateProcessor($entityManager, $security, $requestStack);
    }

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

        $processor = $this->createProcessor($entityManager, $security);

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

        $processor = $this->createProcessor($entityManager, $security);

        $result = $processor->process($user, new Patch(uriTemplate: '/me'), context: ['previous_data' => $previous]);

        $this->assertSame($previous, $result);
        $this->assertSame('old@example.com', $result->getEmail());
    }

    public function testResolvesUserFromSecurityWhenNoPreviousData(): void
    {
        $user = (new User())->setFirstname('Zoro');
        $actor = (new User())->setFirstname('Old');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('flush');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $processor = $this->createProcessor($entityManager, $security);

        $result = $processor->process($user, new Patch(uriTemplate: '/me'), context: []);

        $this->assertSame($actor, $result);
        $this->assertSame('Zoro', $result->getFirstname());
    }

    public function testThrowsWhenNoUserResolvable(): void
    {
        $user = new User();

        $entityManager = $this->createMock(EntityManagerInterface::class);

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn(null);

        $processor = $this->createProcessor($entityManager, $security);

        $this->expectException(\InvalidArgumentException::class);
        $processor->process($user, new Patch(uriTemplate: '/me'), context: []);
    }

    public function testThrowsWhenPreviousDataIsNotUser(): void
    {
        $user = new User();

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $security      = $this->createMock(Security::class);
        $processor     = $this->createProcessor($entityManager, $security);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Previous user state is invalid.');

        $processor->process($user, new Patch(uriTemplate: '/me'), context: ['previous_data' => new \stdClass()]);
    }

    public function testUpdatesEmergencyContactWhenPatched(): void
    {
        $incoming = (new \App\Entity\EmergencyContact())
            ->setLastname('Martin')
            ->setFirstname('Paul')
            ->setEmail('paul@test.com')
            ->setPhone('0612345678');

        $source = new User();

        $ref = new \ReflectionProperty(User::class, 'emergencyContact');
        $ref->setAccessible(true);
        $ref->setValue($source, $incoming);

        $previous = (new User())
            ->setFirstname('Alice')
            ->setLastname('Doe')
            ->setDateOfBirth(new \DateTimeImmutable('1990-01-01'));

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('flush');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($previous);

        $request = \Symfony\Component\HttpFoundation\Request::create(
            '/api/me',
            'PATCH',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['emergencyContact' => ['lastname' => 'Martin', 'firstname' => 'Paul', 'email' => 'paul@test.com', 'phone' => '0612345678']]) ?: ''
        );

        $processor = $this->createProcessor($entityManager, $security, $request);
        $result    = $processor->process($source, new Patch(uriTemplate: '/me'), context: ['previous_data' => $previous]);

        $this->assertNotNull($result->getEmergencyContact());
        $this->assertSame('Martin', $result->getEmergencyContact()->getLastname());
        $this->assertSame('Paul', $result->getEmergencyContact()->getFirstname());
    }

    public function testThrowsWhenRemovingEmergencyContactFromMinor(): void
    {
        // Set emergencyContact to null in source (removing it)
        $source = new User();
        // DO NOT initialize emergencyContact so it stays unset in the source
        // But we need the request body to signal it was patched

        $minor = (new User())
            ->setFirstname('Junior')
            ->setLastname('Doe')
            ->setDateOfBirth(new \DateTimeImmutable(date('Y-m-d', strtotime('-15 years'))));

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $security      = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($minor);

        $request = \Symfony\Component\HttpFoundation\Request::create(
            '/api/me',
            'PATCH',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['emergencyContact' => null]) ?: ''
        );

        $processor = $this->createProcessor($entityManager, $security, $request);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('obligatoire pour un mineur');

        $processor->process($source, new Patch(uriTemplate: '/me'), context: ['previous_data' => $minor]);
    }
}
