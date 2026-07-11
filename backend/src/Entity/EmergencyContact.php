<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity]
#[ORM\Table(name: 'emergency_contact')]
#[ApiResource(
    normalizationContext: ['groups' => ['user:read']],
    denormalizationContext: ['groups' => ['user:write']],
    operations: []
)]
class EmergencyContact
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['user:read', 'user:write', 'user:self:write', 'user:me:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\Length(max: 255)]
    #[Groups(['user:read', 'user:write', 'user:self:write', 'user:me:read'])]
    private string $lastname = '';

    #[ORM\Column(length: 255)]
    #[Assert\Length(max: 255)]
    #[Groups(['user:read', 'user:write', 'user:self:write', 'user:me:read'])]
    private string $firstname = '';

    #[ORM\Column(length: 255)]
    #[Assert\Email]
    #[Groups(['user:read', 'user:write', 'user:self:write', 'user:me:read'])]
    private string $email = '';

    #[ORM\Column(length: 20)]
    #[Assert\Length(max: 20)]
    #[Groups(['user:read', 'user:write', 'user:self:write', 'user:me:read'])]
    private string $phone = '';

    #[ORM\OneToOne(inversedBy: 'emergencyContact', targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getLastname(): string
    {
        return $this->lastname;
    }

    public function setLastname(string $lastname): self
    {
        $this->lastname = $lastname;

        return $this;
    }

    public function getFirstname(): string
    {
        return $this->firstname;
    }

    public function setFirstname(string $firstname): self
    {
        $this->firstname = $firstname;

        return $this;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): self
    {
        $this->email = $email;

        return $this;
    }

    public function getPhone(): string
    {
        return $this->phone;
    }

    public function setPhone(string $phone): self
    {
        $this->phone = $phone;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function isComplete(): bool
    {
        return '' !== trim($this->lastname)
            && '' !== trim($this->firstname)
            && '' !== trim($this->email)
            && '' !== trim($this->phone);
    }
}
