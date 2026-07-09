<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Dto\GameRegistrationInput;
use App\Dto\GameRegistrationPresenceInput;
use App\Repository\GameRegistrationRepository;
use App\State\GameRegistrationCreateProcessor;
use App\State\GameRegistrationPresenceProcessor;
use App\State\MyGameRegistrationsProvider;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: GameRegistrationRepository::class)]
#[ORM\Table(name: 'game_registration', uniqueConstraints: [new ORM\UniqueConstraint(name: 'uniq_game_registration_game_user', columns: ['game_id', 'user_id'])])]
#[ApiResource(
    normalizationContext: ['groups' => ['game_registration:read']],
    operations: [
        new Get(security: "is_granted('ROLE_ADMIN') or object.getUser() == user"),
        new GetCollection(security: "is_granted('IS_AUTHENTICATED_FULLY')"),
        new GetCollection(
            uriTemplate: '/game_registrations/mine',
            security: "is_granted('IS_AUTHENTICATED_FULLY')",
            provider: MyGameRegistrationsProvider::class,
        ),
        new Post(
            security: "is_granted('IS_AUTHENTICATED_FULLY')",
            input: GameRegistrationInput::class,
            processor: GameRegistrationCreateProcessor::class,
        ),
        new Patch(
            security: "is_granted('ROLE_ADMIN')",
            input: GameRegistrationPresenceInput::class,
            processor: GameRegistrationPresenceProcessor::class,
        ),
        new Delete(security: "is_granted('ROLE_ADMIN') or object.getUser() == user"),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: ['game.id' => 'exact', 'user.id' => 'exact', 'user.email' => 'exact'])]
class GameRegistration
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['game_registration:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'registrations', targetEntity: Game::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Game $game = null;

    #[ORM\ManyToOne(inversedBy: 'gameRegistrations', targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['game_registration:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    #[Groups(['game_registration:read', 'game_registration:write'])]
    private bool $isPresent = false;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getGame(): ?Game
    {
        return $this->game;
    }

    public function setGame(?Game $game): self
    {
        $this->game = $game;

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

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function isPresent(): bool
    {
        return $this->isPresent;
    }

    public function getPresence(): bool
    {
        return $this->isPresent;
    }

    public function setIsPresent(bool $isPresent): self
    {
        $this->isPresent = $isPresent;

        return $this;
    }

    public function setPresent(bool $present): self
    {
        $this->isPresent = $present;

        return $this;
    }

    public function setPresence(bool $presence): self
    {
        $this->isPresent = $presence;

        return $this;
    }

    #[Groups(['game_registration:read'])]
    public function getGameId(): ?int
    {
        return $this->game?->getId();
    }

    #[Groups(['game_registration:read'])]
    public function getUserId(): ?int
    {
        return $this->user?->getId();
    }

    #[Groups(['game_registration:read'])]
    public function getUserFirstname(): ?string
    {
        return $this->user?->getFirstname();
    }

    #[Groups(['game_registration:read'])]
    public function getUserLastname(): ?string
    {
        return $this->user?->getLastname();
    }

    #[Groups(['game_registration:read'])]
    public function getUserEmail(): ?string
    {
        return $this->user?->getEmail();
    }

    #[Groups(['game_registration:read'])]
    public function getUserAge(): ?int
    {
        $dateOfBirth = $this->user?->getDateOfBirth();
        if (!$dateOfBirth instanceof \DateTimeInterface) {
            return null;
        }

        $today = new \DateTimeImmutable('today');
        $birth = \DateTimeImmutable::createFromInterface($dateOfBirth);

        return $birth->diff($today)->y;
    }
}
