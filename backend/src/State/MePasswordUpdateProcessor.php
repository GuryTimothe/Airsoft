<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Dto\MePasswordUpdateInput;
use App\Dto\MeUpdateOutput;
use App\Entity\User;
use App\Security\Jwt\JwtRevocationStore;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;

/**
 * @implements ProcessorInterface<MePasswordUpdateInput, MeUpdateOutput>
 */
class MePasswordUpdateProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private Security $security,
        private JwtRevocationStore $jwtRevocationStore,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        $previousData = $context['previous_data'] ?? null;
        if (null !== $previousData && !$previousData instanceof User) {
            throw new \InvalidArgumentException('Previous user state is invalid.');
        }

        $targetUser = $this->resolveTargetUser($previousData);

        $currentPassword = $data->currentPassword;

        if (!\is_string($currentPassword) || '' === trim($currentPassword)) {
            throw new ValidationException(new ConstraintViolationList([
                new ConstraintViolation(
                    'Le mot de passe actuel est requis.',
                    null,
                    [],
                    null,
                    'currentPassword',
                    $currentPassword,
                ),
                    ]));
        }

        if (!$this->passwordHasher->isPasswordValid($targetUser, $currentPassword)) {
            throw new ValidationException(new ConstraintViolationList([
                new ConstraintViolation(
                    'Le mot de passe actuel est incorrect.',
                    null,
                    [],
                    null,
                    'currentPassword',
                    null,
                ),
            ]));
        }

        if (!\is_string($data->newPassword) || '' === trim($data->newPassword)) {
            throw new ValidationException(new ConstraintViolationList([
                new ConstraintViolation(
                    'Le nouveau mot de passe est requis.',
                    null,
                    [],
                    null,
                    'newPassword',
                    $data->newPassword,
                ),
            ]));
        }

        $targetUser->setPassword($this->passwordHasher->hashPassword($targetUser, $data->newPassword));
        $this->jwtRevocationStore->rotateUserTokenNonce($targetUser);
        $this->entityManager->flush();

        return new MeUpdateOutput($targetUser, '');
    }

    private function resolveTargetUser(?User $previousData): User
    {
        if ($previousData instanceof User) {
            return $previousData;
        }

        $actor = $this->security->getUser();
        if ($actor instanceof User) {
            return $actor;
        }

        throw new \InvalidArgumentException('Unable to resolve target user for password update.');
    }
}
