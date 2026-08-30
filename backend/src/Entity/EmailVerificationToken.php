<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'email_verification_tokens')]
class EmailVerificationToken
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(length: 64, unique: true)]
    private string $tokenHash;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $expiresAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $usedAt = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $pendingEmail;

    public function __construct(User $user, string $tokenHash, \DateTimeImmutable $expiresAt, ?string $pendingEmail = null)
    {
        $this->user         = $user;
        $this->tokenHash    = $tokenHash;
        $this->expiresAt    = $expiresAt;
        $this->pendingEmail = $pendingEmail;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getPendingEmail(): ?string
    {
        return $this->pendingEmail;
    }

    public function isUsable(\DateTimeImmutable $now): bool
    {
        return null === $this->usedAt && $this->expiresAt > $now;
    }

    public function markAsUsed(): void
    {
        $this->usedAt = new \DateTimeImmutable();
    }
}
