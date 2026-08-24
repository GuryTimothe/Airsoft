<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\EmergencyContact;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\RequestStack;

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
        private RequestStack $requestStack,
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

        $emergencyContactProperty = $this->getWritableProperty('emergencyContact');
        if (!$this->wasEmergencyContactPatched($source, $emergencyContactProperty)) {
            if ($this->isMinor($target) && !($target->getEmergencyContact()?->isComplete() ?? false)) {
                throw new \InvalidArgumentException('Le contact d\'urgence est obligatoire pour un mineur.');
            }

            return;
        }

        /** @var EmergencyContact|null $incomingEmergencyContact */
        $incomingEmergencyContact = $emergencyContactProperty->getValue($source);

        if (null === $incomingEmergencyContact) {
            if ($this->isMinor($target)) {
                throw new \InvalidArgumentException('Le contact d\'urgence est obligatoire pour un mineur.');
            }

            $target->setEmergencyContact(null);

            return;
        }

        $targetEmergencyContact = $target->getEmergencyContact() ?? new EmergencyContact();
        $targetEmergencyContact
            ->setLastname($incomingEmergencyContact->getLastname())
            ->setFirstname($incomingEmergencyContact->getFirstname())
            ->setEmail($incomingEmergencyContact->getEmail())
            ->setPhone($incomingEmergencyContact->getPhone());

        $target->setEmergencyContact($targetEmergencyContact);
    }

    private function getWritableProperty(string $propertyName): \ReflectionProperty
    {
        if (!isset(self::$updatableProperties[$propertyName])) {
            $property                                 = new \ReflectionProperty(User::class, $propertyName);
            self::$updatableProperties[$propertyName] = $property;
        }

        return self::$updatableProperties[$propertyName];
    }

    private function wasEmergencyContactPatched(User $source, \ReflectionProperty $property): bool
    {
        $request = $this->requestStack->getCurrentRequest();
        if (null !== $request) {
            try {
                $payload = $request->toArray();

                return \array_key_exists('emergencyContact', $payload);
            } catch (\JsonException) {
                return false;
            }
        }

        return $property->isInitialized($source) && null !== $property->getValue($source);
    }

    private function isMinor(User $user): bool
    {
        $dateOfBirthProperty = $this->getWritableProperty('dateOfBirth');
        if (!$dateOfBirthProperty->isInitialized($user)) {
            return false;
        }

        $today     = new \DateTimeImmutable('today');
        $birthDate = \DateTimeImmutable::createFromInterface($user->getDateOfBirth());

        return $birthDate->diff($today)->y < 18;
    }
}
