<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Dto\MeEmailUpdateInput;
use App\Dto\MePasswordUpdateInput;
use App\Dto\MeUpdateOutput;
use App\Dto\RegisterInput;
use App\Repository\UserRepository;
use App\State\MeDeleteProcessor;
use App\State\MeEmailUpdateProcessor;
use App\State\MePasswordUpdateProcessor;
use App\State\MeProvider;
use App\State\MeUpdateProcessor;
use App\State\RegisterProcessor;
use App\State\UserUpdateProcessor;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    paginationItemsPerPage: 15,
    normalizationContext: ['groups' => ['user:read']],
    denormalizationContext: ['groups' => ['user:write']],
    operations: [
        new Delete(
            uriTemplate: '/me',
            provider: MeProvider::class,
            processor: MeDeleteProcessor::class,
            security: "is_granted('IS_AUTHENTICATED_FULLY')",
        ),
        new Get(
            uriTemplate: '/me',
            provider: MeProvider::class,
            security: "is_granted('IS_AUTHENTICATED_FULLY')",
        ),
        new Patch(
            uriTemplate: '/me',
            provider: MeProvider::class,
            processor: MeUpdateProcessor::class,
            security: "is_granted('IS_AUTHENTICATED_FULLY')",
            denormalizationContext: ['groups' => ['user:self:write']],
            validationContext: ['groups' => ['user:self:general']],
        ),
        new Patch(
            uriTemplate: '/me/email',
            provider: MeProvider::class,
            processor: MeEmailUpdateProcessor::class,
            security: "is_granted('IS_AUTHENTICATED_FULLY')",
            input: MeEmailUpdateInput::class,
            denormalizationContext: ['groups' => ['me:email:write']],
            normalizationContext: ['groups' => ['user:read', 'me:update:read']],
            validationContext: ['groups' => ['me:email:input']],
            output: MeUpdateOutput::class,
        ),
        new Patch(
            uriTemplate: '/me/password',
            provider: MeProvider::class,
            processor: MePasswordUpdateProcessor::class,
            security: "is_granted('IS_AUTHENTICATED_FULLY')",
            input: MePasswordUpdateInput::class,
            denormalizationContext: ['groups' => ['me:password:write']],
            normalizationContext: ['groups' => ['user:read', 'me:update:read']],
            validationContext: ['groups' => ['me:password:input']],
            output: MeUpdateOutput::class,
        ),
        new Get(security: "is_granted('VIEW_ALL_USERS')"),
        new GetCollection(security: "is_granted('VIEW_ALL_USERS')"),
        new Post(
            securityPostDenormalize: "is_granted('CREATE_USER', object)",
            denormalizationContext: ['groups' => ['user:write', 'user:create']],
            validationContext: ['groups' => ['user:create']],
        ),
        new Post(
            uriTemplate: '/register',
            processor: RegisterProcessor::class,
            input: RegisterInput::class,
            denormalizationContext: ['groups' => ['user:write']],
            output: User::class,
            status: 201,
            deserialize: true,
            security: "is_granted('PUBLIC_ACCESS')",
        ),
        new Patch(
            securityPostDenormalize: "is_granted('UPDATE_USER', object)",
            processor: UserUpdateProcessor::class,
            validationContext: ['groups' => ['user:admin:update']],
        ),
        new Delete(security: "is_granted('DELETE_USER', object)"),
    ]
)]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['user:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(groups: ['user:create', 'user:admin:update', 'user:self:general'])]
    #[Groups(['user:read', 'user:write', 'user:self:write'])]
    private string $lastname;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(groups: ['user:create', 'user:admin:update', 'user:self:general'])]
    #[Groups(['user:read', 'user:write', 'user:self:write'])]
    private string $firstname;

    #[ORM\Column(length: 255, unique: true)]
    #[Assert\NotBlank(groups: ['user:create', 'user:admin:update', 'user:self:email'])]
    #[Assert\Email(groups: ['user:create', 'user:admin:update', 'user:self:email'])]
    #[Groups(['user:read', 'user:write', 'user:self:email:write'])]
    private string $email;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(groups: ['user:create'])]
    #[Groups(['user:create'])]
    private string $password;

    #[ORM\Column(type: 'date')]
    #[Assert\NotNull(groups: ['user:create', 'user:admin:update', 'user:self:general'])]
    #[Groups(['user:read', 'user:write', 'user:self:write'])]
    private \DateTimeInterface $dateOfBirth;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['user:read', 'user:write', 'user:self:write'])]
    private ?string $pseudo = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['user:read', 'user:write', 'user:self:write'])]
    private ?string $phone = null;

    #[ORM\Column(length: 50)]
    #[Assert\Choice([
        'ROLE_USER',
        'ROLE_ADMIN',
        'ROLE_ORGANIZER',
        'ROLE_SUPER_ADMIN',
    ], groups: ['user:create', 'user:admin:update'])]
    #[Groups(['user:read', 'user:write'])]
    private string $role = 'ROLE_USER';

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['user:read'])]
    private ?string $adminNotes = null;

    #[ORM\Column]
    #[Groups(['user:read', 'user:write'])]
    private bool $canSeePrivate = false;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['user:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['user:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

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

    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): self
    {
        $this->password = $password;

        return $this;
    }

    /**
     * @return non-empty-string
     */
    public function getUserIdentifier(): string
    {
        if ('' === $this->email) {
            throw new \LogicException('L’email utilisateur ne peut pas être vide.');
        }

        return $this->email;
    }

    public function getRoles(): array
    {
        return [$this->role];
    }

    public function getSalt(): ?string
    {
        return null;
    }

    public function eraseCredentials(): void
    {
        // If you store any temporary, sensitive data on the user, clear it here
    }

    public function getDateOfBirth(): \DateTimeInterface
    {
        return $this->dateOfBirth;
    }

    public function setDateOfBirth(\DateTimeInterface $dateOfBirth): self
    {
        $this->dateOfBirth = $dateOfBirth;

        return $this;
    }

    public function getPseudo(): ?string
    {
        return $this->pseudo;
    }

    public function setPseudo(?string $pseudo): self
    {
        $this->pseudo = $pseudo;

        return $this;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(?string $phone): self
    {
        $this->phone = $phone;

        return $this;
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function setRole(string $role): self
    {
        $this->role = $role;

        return $this;
    }

    public function getAdminNotes(): ?string
    {
        return $this->adminNotes;
    }

    public function setAdminNotes(?string $adminNotes): self
    {
        $this->adminNotes = $adminNotes;

        return $this;
    }

    public function canSeePrivate(): bool
    {
        return $this->canSeePrivate;
    }

    public function setCanSeePrivate(bool $canSeePrivate): self
    {
        $this->canSeePrivate = $canSeePrivate;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new \DateTimeImmutable();

        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }
}
