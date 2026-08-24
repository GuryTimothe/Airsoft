<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Entity\User;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;

/**
 * @implements ProcessorInterface<User, User>
 */
class UserCreateProcessor implements ProcessorInterface
{
    private const PRIVATE_ACCESS_ROLES = ['ROLE_ORGANIZER', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'];

    /**
     * @param ProcessorInterface<User, User> $persistProcessor
     */
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $persistProcessor,
        private UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (\in_array($data->getRole(), self::PRIVATE_ACCESS_ROLES, true)) {
            $data->setCanSeePrivate(true);
        }

        $hashedPassword = $this->passwordHasher->hashPassword($data, $data->getPassword());
        $data->setPassword($hashedPassword);

        try {
            return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
        } catch (UniqueConstraintViolationException) {
            throw new ValidationException(new ConstraintViolationList([
                new ConstraintViolation(
                    'Un compte avec cet email existe deja.',
                    null,
                    [],
                    null,
                    'email',
                    $data->getEmail(),
                ),
            ]));
        }
    }
}
