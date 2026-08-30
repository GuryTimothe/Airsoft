<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'pending_user_invitations')]
class PendingUserInvitation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255, unique: true)]
    private string $email;

    /** @var array<string, mixed> */
    #[ORM\Column(type: 'json')]
    private array $userData;

    #[ORM\Column(length: 64, unique: true)]
    private string $tokenHash;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $expiresAt;

    public function __construct(User $user, string $tokenHash, \DateTimeImmutable $expiresAt)
    {
        $emergencyContact = $user->getEmergencyContact();

        $this->email    = $user->getEmail();
        $this->userData = [
            'lastname'         => $user->getLastname(),
            'firstname'        => $user->getFirstname(),
            'password'         => $user->getPassword(),
            'dateOfBirth'      => $user->getDateOfBirth()->format('Y-m-d'),
            'pseudo'           => $user->getPseudo(),
            'phone'            => $user->getPhone(),
            'role'             => $user->getRole(),
            'canSeePrivate'    => $user->getCanSeePrivate(),
            'emergencyContact' => null === $emergencyContact ? null : [
                'lastname'  => $emergencyContact->getLastname(),
                'firstname' => $emergencyContact->getFirstname(),
                'email'     => $emergencyContact->getEmail(),
                'phone'     => $emergencyContact->getPhone(),
            ],
        ];
        $this->tokenHash = $tokenHash;
        $this->expiresAt = $expiresAt;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    /** @return array<string, mixed> */
    public function getUserData(): array
    {
        return $this->userData;
    }

    public function isUsable(\DateTimeImmutable $now): bool
    {
        return $this->expiresAt > $now;
    }
}
