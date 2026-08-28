<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Post;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Dto\RegisterInput;
use App\Entity\User;
use App\Repository\UserRepository;
use App\State\RegisterProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Serializer\Normalizer\DenormalizerInterface;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class RegisterProcessorTest extends TestCase
{
    private function buildInput(array $overrides = []): RegisterInput
    {
        $input              = new RegisterInput();
        $input->firstname   = $overrides['firstname']   ?? 'Jean';
        $input->lastname    = $overrides['lastname']    ?? 'Dupont';
        $input->email       = $overrides['email']       ?? 'jean@example.com';
        $input->password    = $overrides['password']    ?? 'Password123';
        $input->dateOfBirth = $overrides['dateOfBirth'] ?? new \DateTimeImmutable('1990-01-15');
        $input->pseudo      = $overrides['pseudo']      ?? null;
        $input->phone       = $overrides['phone']       ?? null;

        return $input;
    }

    private function createProcessor(
        RegisterInput $returnedInput,
        bool $hasViolations = false,
        ?EntityManagerInterface $entityManager = null,
        ?UserPasswordHasherInterface $passwordHasher = null,
        ?UserRepository $userRepository = null,
    ): RegisterProcessor {
        $em = $entityManager ?? $this->createMock(EntityManagerInterface::class);

        $hasher = $passwordHasher ?? $this->createMock(UserPasswordHasherInterface::class);
        if (!$passwordHasher) {
            /** @var \PHPUnit\Framework\MockObject\MockObject&UserPasswordHasherInterface $hasher */
            $hasher->method('hashPassword')->willReturn('hashed_password');
        }

        $violations = $hasViolations
            ? new ConstraintViolationList([
                new ConstraintViolation('error', null, [], null, 'field', null),
            ])
            : new ConstraintViolationList();

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn($violations);

        $denormalizer = $this->createMock(DenormalizerInterface::class);
        $denormalizer->method('denormalize')->willReturn($returnedInput);

        return new RegisterProcessor($em, $hasher, $validator, $denormalizer, $userRepository);
    }

    public function testThrowsRuntimeExceptionWhenNoRequestInContext(): void
    {
        $processor = $this->createProcessor($this->buildInput());

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('HTTP request is missing.');

        $processor->process(new \stdClass(), new Post(), context: []);
    }

    public function testThrowsValidationExceptionWhenInputIsInvalid(): void
    {
        $processor = $this->createProcessor($this->buildInput(), hasViolations: true);

        $request = Request::create('/api/register', 'POST', [], [], [], [], json_encode([
            'firstname'   => '',
            'lastname'    => 'D',
            'email'       => 'not-an-email',
            'password'    => '123',
            'dateOfBirth' => '1990-01-15',
        ]) ?: '');

        $this->expectException(ValidationException::class);

        $processor->process(new \stdClass(), new Post(), context: ['request' => $request]);
    }

    public function testCreatesUserSuccessfully(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('persist');
        $entityManager->expects($this->once())->method('flush');

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher->method('hashPassword')->willReturn('hashed_password');

        $processor = $this->createProcessor(
            $this->buildInput(),
            entityManager: $entityManager,
            passwordHasher: $passwordHasher,
        );

        $request = Request::create('/api/register', 'POST', [], [], [], [], json_encode([
            'firstname'   => 'Jean',
            'lastname'    => 'Dupont',
            'email'       => 'jean@example.com',
            'password'    => 'Password123',
            'dateOfBirth' => '1990-01-15',
        ]) ?: '');

        $result = $processor->process(new \stdClass(), new Post(), context: ['request' => $request]);

        $this->assertInstanceOf(User::class, $result);
        $this->assertSame('jean@example.com', $result->getEmail());
        $this->assertSame('Jean', $result->getFirstname());
        $this->assertSame('Dupont', $result->getLastname());
        $this->assertSame('ROLE_USER', $result->getRole());
        $this->assertFalse($result->getCanSeePrivate());
        $this->assertSame('hashed_password', $result->getPassword());
    }

    public function testReplacesExistingUnverifiedUserWithSameEmail(): void
    {
        $existingUser = (new User())
            ->setEmail('jean@example.com')
            ->setEmailVerified(false);
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('remove')->with($existingUser);
        $entityManager->expects($this->exactly(2))->method('flush');
        $entityManager->expects($this->once())->method('persist');
        $repository = $this->createMock(UserRepository::class);
        $repository->expects($this->once())->method('findOneBy')->with(['email' => 'jean@example.com'])->willReturn($existingUser);

        $processor = $this->createProcessor(
            $this->buildInput(),
            entityManager: $entityManager,
            userRepository: $repository,
        );

        $request = Request::create('/api/register', 'POST', [], [], [], [], '{}');
        $processor->process(new \stdClass(), new Post(), context: ['request' => $request]);
    }

    public function testCreatesUserWithOptionalFields(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('persist');
        $entityManager->expects($this->once())->method('flush');

        $input         = $this->buildInput();
        $input->pseudo = 'SniperFox';
        $input->phone  = '0612345678';

        $processor = $this->createProcessor(
            $input,
            entityManager: $entityManager,
        );

        $request = Request::create('/api/register', 'POST', [], [], [], [], json_encode([
            'firstname'   => 'Jean',
            'lastname'    => 'Dupont',
            'email'       => 'jean@example.com',
            'password'    => 'Password123',
            'dateOfBirth' => '1990-01-15',
            'pseudo'      => 'SniperFox',
            'phone'       => '0612345678',
        ]) ?: '');

        $result = $processor->process(new \stdClass(), new Post(), context: ['request' => $request]);

        $this->assertInstanceOf(User::class, $result);
        $this->assertSame('SniperFox', $result->getPseudo());
        $this->assertSame('0612345678', $result->getPhone());
    }

    public function testCreatesUserWithEmergencyContact(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('persist');
        $entityManager->expects($this->once())->method('flush');

        $input                   = $this->buildInput();
        $input->emergencyContact = '{"lastname":"Martin","firstname":"Paul","email":"paul@example.com","phone":"0600000001"}';

        $processor = $this->createProcessor(
            $input,
            entityManager: $entityManager,
        );

        $request = Request::create('/api/register', 'POST', [], [], [], [], json_encode([
            'firstname'        => 'Jean',
            'lastname'         => 'Dupont',
            'email'            => 'jean@example.com',
            'password'         => 'Password123',
            'dateOfBirth'      => '1990-01-15',
            'emergencyContact' => '{"lastname":"Martin","firstname":"Paul","email":"paul@example.com","phone":"0600000001"}',
        ]) ?: '');

        $result = $processor->process(new \stdClass(), new Post(), context: ['request' => $request]);

        $this->assertInstanceOf(User::class, $result);
        $this->assertNotNull($result->getEmergencyContact());
        $this->assertSame('Martin', $result->getEmergencyContact()->getLastname());
        $this->assertSame('Paul', $result->getEmergencyContact()->getFirstname());
    }

    public function testCreatesUserWithDateOfBirth(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('persist');
        $entityManager->expects($this->once())->method('flush');

        $input              = $this->buildInput();
        $input->dateOfBirth = new \DateTimeImmutable('2005-06-15');

        $processor = $this->createProcessor(
            $input,
            entityManager: $entityManager,
        );

        $request = Request::create('/api/register', 'POST', [], [], [], [], json_encode([
            'firstname'   => 'Junior',
            'lastname'    => 'Doe',
            'email'       => 'junior@example.com',
            'password'    => 'Password123',
            'dateOfBirth' => '2005-06-15',
        ]) ?: '');

        $result = $processor->process(new \stdClass(), new Post(), context: ['request' => $request]);

        $this->assertInstanceOf(User::class, $result);
        $this->assertSame('2005-06-15', $result->getDateOfBirth()?->format('Y-m-d'));
    }

    public function testCreatesUserWithLegacyStringEmergencyContact(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('persist');
        $entityManager->expects($this->once())->method('flush');

        $input                   = $this->buildInput();
        $input->emergencyContact = 'Martin - 0612345678';

        $processor = $this->createProcessor(
            $input,
            entityManager: $entityManager,
        );

        $request = Request::create('/api/register', 'POST', [], [], [], [], json_encode([
            'firstname'        => 'Jean',
            'lastname'         => 'Dupont',
            'email'            => 'jean@example.com',
            'password'         => 'Password123',
            'dateOfBirth'      => '1990-01-15',
            'emergencyContact' => 'Martin - 0612345678',
        ]) ?: '');

        $result = $processor->process(new \stdClass(), new Post(), context: ['request' => $request]);

        $this->assertInstanceOf(User::class, $result);
        $this->assertNotNull($result->getEmergencyContact());
        $this->assertSame('Martin', $result->getEmergencyContact()->getLastname());
        $this->assertSame('0612345678', $result->getEmergencyContact()->getPhone());
    }

    public function testCreatesUserWithEmptyStringEmergencyContact(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('persist');
        $entityManager->expects($this->once())->method('flush');

        $input                   = $this->buildInput();
        $input->emergencyContact = '   '; // blank → should not create emergency contact

        $processor = $this->createProcessor(
            $input,
            entityManager: $entityManager,
        );

        $request = Request::create('/api/register', 'POST', [], [], [], [], json_encode([
            'firstname'        => 'Jean',
            'lastname'         => 'Dupont',
            'email'            => 'jean@example.com',
            'password'         => 'Password123',
            'dateOfBirth'      => '1990-01-15',
            'emergencyContact' => '   ',
        ]) ?: '');

        $result = $processor->process(new \stdClass(), new Post(), context: ['request' => $request]);

        $this->assertInstanceOf(User::class, $result);
        $this->assertNull($result->getEmergencyContact());
    }

}
