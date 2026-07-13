<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Patch;
use App\Dto\GameRegistrationPresenceInput;
use App\Entity\GameRegistration;
use App\Repository\GameRegistrationRepository;
use App\State\GameRegistrationPresenceProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class GameRegistrationPresenceProcessorTest extends TestCase
{
    private function createProcessor(
        ?GameRegistration $registration,
        int $id = 1,
    ): GameRegistrationPresenceProcessor {
        $repository = $this->createMock(GameRegistrationRepository::class);
        $repository->method('find')->willReturn($registration);

        $entityManager = $this->createMock(EntityManagerInterface::class);

        return new GameRegistrationPresenceProcessor($repository, $entityManager);
    }

    public function testThrowsNotFoundWhenRegistrationDoesNotExist(): void
    {
        $processor = $this->createProcessor(null);

        $input = new GameRegistrationPresenceInput();
        $input->isPresent = true;

        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Inscription introuvable.');

        $processor->process($input, new Patch(), uriVariables: ['id' => 99]);
    }

    public function testThrowsBadRequestWhenPresenceDataIsMissing(): void
    {
        $registration = new GameRegistration();
        $processor    = $this->createProcessor($registration);

        $input = new GameRegistrationPresenceInput();

        $this->expectException(BadRequestHttpException::class);
        $this->expectExceptionMessage('isPresent');

        $processor->process($input, new Patch(), uriVariables: ['id' => 1]);
    }

    public function testSetsIsPresentTrueViaIsPresentField(): void
    {
        $registration  = new GameRegistration();
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('flush');

        $repository = $this->createMock(GameRegistrationRepository::class);
        $repository->method('find')->willReturn($registration);

        $processor = new GameRegistrationPresenceProcessor($repository, $entityManager);

        $input            = new GameRegistrationPresenceInput();
        $input->isPresent = true;

        $result = $processor->process($input, new Patch(), uriVariables: ['id' => 1]);

        $this->assertSame($registration, $result);
        $this->assertTrue($result->isPresent());
    }

    public function testSetsIsPresentFalseViaIsPresentField(): void
    {
        $registration  = new GameRegistration();
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('flush');

        $repository = $this->createMock(GameRegistrationRepository::class);
        $repository->method('find')->willReturn($registration);

        $processor = new GameRegistrationPresenceProcessor($repository, $entityManager);

        $input            = new GameRegistrationPresenceInput();
        $input->isPresent = false;

        $result = $processor->process($input, new Patch(), uriVariables: ['id' => 1]);

        $this->assertFalse($result->isPresent());
    }

    public function testSetsIsPresentViaPresentAlias(): void
    {
        $registration  = new GameRegistration();
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('flush');

        $repository = $this->createMock(GameRegistrationRepository::class);
        $repository->method('find')->willReturn($registration);

        $processor = new GameRegistrationPresenceProcessor($repository, $entityManager);

        $input          = new GameRegistrationPresenceInput();
        $input->present = true;

        $result = $processor->process($input, new Patch(), uriVariables: ['id' => 1]);

        $this->assertTrue($result->isPresent());
    }
}
