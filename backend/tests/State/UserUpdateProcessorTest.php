<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Patch;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use App\State\UserUpdateProcessor;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

final class UserUpdateProcessorTest extends TestCase
{
    public function testAdminCanUpdateUserWithoutChangingPasswordAndWithAllowedRole(): void
    {
        $actor = (new User())->setRole('ROLE_ADMIN');
        $previous = (new User())
            ->setRole('ROLE_USER')
            ->setPassword('hashed-password');
        $data = (new User())
            ->setRole('ROLE_ORGANIZER')
            ->setPassword('hashed-password');

        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor
            ->expects($this->once())
            ->method('process')
            ->with($data, $this->isInstanceOf(Patch::class), [], ['previous_data' => $previous])
            ->willReturn($data);

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $processor = new UserUpdateProcessor($persistProcessor, $security);

        $this->assertSame($data, $processor->process($data, new Patch(), context: ['previous_data' => $previous]));
    }

    public function testUpdateRejectsPasswordChange(): void
    {
        $actor = (new User())->setRole('ROLE_SUPER_ADMIN');
        $previous = (new User())
            ->setRole('ROLE_USER')
            ->setPassword('old-hash');
        $data = (new User())
            ->setRole('ROLE_USER')
            ->setPassword('new-hash');

        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor->expects($this->never())->method('process');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $processor = new UserUpdateProcessor($persistProcessor, $security);

        $this->expectException(AccessDeniedException::class);
        $this->expectExceptionMessage('Password changes are not allowed on this route.');

        $processor->process($data, new Patch(), context: ['previous_data' => $previous]);
    }

    public function testUpdateWithoutPasswordKeepsPreviousPassword(): void
    {
        $actor = (new User())->setRole('ROLE_ADMIN');
        $previous = (new User())
            ->setRole('ROLE_USER')
            ->setPassword('hashed-password');
        $data = (new User())->setRole('ROLE_USER');

        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor
            ->expects($this->once())
            ->method('process')
            ->with($data, $this->isInstanceOf(Patch::class), [], ['previous_data' => $previous])
            ->willReturn($data);

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $processor = new UserUpdateProcessor($persistProcessor, $security);

        $result = $processor->process($data, new Patch(), context: ['previous_data' => $previous]);

        $this->assertSame($data, $result);
        $this->assertSame('hashed-password', $result->getPassword());
    }

    public function testAdminCannotAssignAdminRole(): void
    {
        $actor = (new User())->setRole('ROLE_ADMIN');
        $previous = (new User())
            ->setRole('ROLE_USER')
            ->setPassword('hashed-password');
        $data = (new User())
            ->setRole('ROLE_ADMIN')
            ->setPassword('hashed-password');

        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor->expects($this->never())->method('process');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $processor = new UserUpdateProcessor($persistProcessor, $security);

        $this->expectException(AccessDeniedException::class);
        $this->expectExceptionMessage('Admins can only assign ROLE_USER or ROLE_ORGANIZER.');

        $processor->process($data, new Patch(), context: ['previous_data' => $previous]);
    }

    public function testSuperAdminCanAssignAdminRole(): void
    {
        $actor = (new User())->setRole('ROLE_SUPER_ADMIN');
        $previous = (new User())
            ->setRole('ROLE_USER')
            ->setPassword('hashed-password');
        $data = (new User())
            ->setRole('ROLE_ADMIN')
            ->setPassword('hashed-password');

        $persistProcessor = $this->createMock(ProcessorInterface::class);
        $persistProcessor
            ->expects($this->once())
            ->method('process')
            ->with($data, $this->isInstanceOf(Patch::class), [], ['previous_data' => $previous])
            ->willReturn($data);

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($actor);

        $processor = new UserUpdateProcessor($persistProcessor, $security);

        $this->assertSame($data, $processor->process($data, new Patch(), context: ['previous_data' => $previous]));
    }
}
