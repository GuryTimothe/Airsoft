<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Dto\RegisterInput;
use App\Entity\EmergencyContact;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Serializer\Normalizer\DenormalizerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * @implements ProcessorInterface<RegisterInput, User>
 */
class RegisterProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private ValidatorInterface $validator,
        private DenormalizerInterface $denormalizer,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        $request = $context['request'] ?? null;
        if (!$request instanceof Request) {
            throw new \RuntimeException('HTTP request is missing.');
        }

        $payload = $this->extractPayload($request);
        $input   = $this->denormalizer->denormalize($payload, RegisterInput::class, 'json');

        $violations = $this->validator->validate($input);
        if (count($violations) > 0) {
            throw new ValidationException($violations);
        }

        $user = new User();
        $user->setEmail($input->email);
        $user->setLastname($input->lastname);
        $user->setFirstname($input->firstname);
        $user->setRole('ROLE_USER');
        $user->setCanSeePrivate(false);

        if (null !== $input->dateOfBirth) {
            $user->setDateOfBirth(new \DateTime($input->dateOfBirth->format('Y-m-d')));
        }

        if (null !== $input->emergencyContact && '' !== trim($input->emergencyContact)) {
            $user->setEmergencyContact($this->createEmergencyContactFromLegacyString($input->emergencyContact));
        }

        if (null !== $input->pseudo) {
            $user->setPseudo($input->pseudo);
        }

        if (null !== $input->phone) {
            $user->setPhone($input->phone);
        }

        $hashedPassword = $this->passwordHasher->hashPassword($user, $input->password);
        $user->setPassword($hashedPassword);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    /**
     * @return array<string, mixed>
     */
    private function extractPayload(Request $request): array
    {
        $content = $request->getContent();
        if ('' === trim($content)) {
            return [];
        }

        $decoded = json_decode($content, true);
        if (!is_array($decoded)) {
            throw new \InvalidArgumentException('Request body must be valid JSON.');
        }

        return $decoded;
    }

    private function createEmergencyContactFromLegacyString(string $value): EmergencyContact
    {
        $trimmed = trim($value);
        $contact = new EmergencyContact();

        if ('' === $trimmed) {
            return $contact;
        }

        if (str_starts_with($trimmed, '{')) {
            $decoded = json_decode($trimmed, true);

            if (is_array($decoded)) {
                $contact
                    ->setLastname((string) ($decoded['lastname'] ?? ''))
                    ->setFirstname((string) ($decoded['firstname'] ?? ''))
                    ->setEmail((string) ($decoded['email'] ?? ''))
                    ->setPhone((string) ($decoded['phone'] ?? ''));

                return $contact;
            }
        }

        $parts = array_map('trim', explode('-', $trimmed, 2));

        $contact
            ->setLastname($parts[0] ?? '')
            ->setFirstname('')
            ->setEmail('')
            ->setPhone($parts[1] ?? '');

        return $contact;
    }
}
