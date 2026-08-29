<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'password_reset_tokens')]
class PasswordResetToken
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'passwordResetTokens')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(length: 64, unique: true)]
    private string $tokenHash;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $expiresAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $usedAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(options: ['default' => false])]
    private bool $renewSession;

    public function __construct(User $user, string $tokenHash, \DateTimeImmutable $expiresAt, bool $renewSession = false)
    {
        $this->user         = $user;
        $this->tokenHash    = $tokenHash;
        $this->expiresAt    = $expiresAt;
        $this->createdAt    = new \DateTimeImmutable();
        $this->renewSession = $renewSession;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function shouldRenewSession(): bool
    {
        return $this->renewSession;
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
