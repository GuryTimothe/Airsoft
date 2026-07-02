<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * @implements ProcessorInterface<User, User>
 */
class MeUpdateProcessor implements ProcessorInterface
{
    /** @var array<string, \ReflectionProperty> */
    private static array $updatableProperties = [];

    public function __construct(
        private EntityManagerInterface $entityManager,
        private Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        $previousData = $context['previous_data'] ?? null;
        if (null !== $previousData && !$previousData instanceof User) {
            throw new \InvalidArgumentException('Previous user state is invalid.');
        }

        $targetUser = $this->resolveTargetUser($previousData);

        $this->applyWritablePatch($data, $targetUser);

        $this->entityManager->flush();

        return $targetUser;
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

        throw new \InvalidArgumentException('Unable to resolve target user for self update.');
    }

    private function applyWritablePatch(User $source, User $target): void
    {
        foreach (['firstname', 'lastname', 'dateOfBirth', 'pseudo', 'phone'] as $propertyName) {
            $property = $this->getWritableProperty($propertyName);

            if (!$property->isInitialized($source)) {
                continue;
            }

            $property->setValue($target, $property->getValue($source));
        }
    }

    private function getWritableProperty(string $propertyName): \ReflectionProperty
    {
        if (!isset(self::$updatableProperties[$propertyName])) {
            $property = new \ReflectionProperty(User::class, $propertyName);
            $property->setAccessible(true);
            self::$updatableProperties[$propertyName] = $property;
        }

        return self::$updatableProperties[$propertyName];
    }
}
