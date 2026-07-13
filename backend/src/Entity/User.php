<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiProperty;
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
use App\State\UserCreateProcessor;
use App\State\UserUpdateProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Serializer\Annotation\SerializedName;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

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
            normalizationContext: ['groups' => ['user:me:read']],
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
            processor: UserCreateProcessor::class,
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
    #[Groups(['user:read', 'user:me:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(groups: ['user:create', 'user:admin:update', 'user:self:general'])]
    #[Groups(['user:read', 'user:write', 'user:self:write', 'user:me:read'])]
    private string $lastname;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(groups: ['user:create', 'user:admin:update', 'user:self:general'])]
    #[Groups(['user:read', 'user:write', 'user:self:write', 'user:me:read'])]
    private string $firstname;

    #[ORM\Column(length: 255, unique: true)]
    #[Assert\NotBlank(groups: ['user:create', 'user:admin:update', 'user:self:email'])]
    #[Assert\Email(groups: ['user:create', 'user:admin:update', 'user:self:email'])]
    #[Groups(['user:read', 'user:write', 'user:self:email:write', 'user:me:read'])]
    private string $email;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['user:write'])]
    private string $password;

    #[ORM\Column(type: 'date')]
    #[Assert\NotNull(groups: ['user:create', 'user:admin:update', 'user:self:general'])]
    #[Assert\LessThanOrEqual('today', message: "La date de naissance ne peut pas \u00eatre dans le futur.", groups: ['user:create', 'user:admin:update', 'user:self:general'])]
    #[Groups(['user:read', 'user:write', 'user:self:write', 'user:me:read'])]
    private \DateTimeInterface $dateOfBirth;

    #[ORM\OneToOne(mappedBy: 'user', targetEntity: EmergencyContact::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ApiProperty(readableLink: true, writableLink: true)]
    #[Assert\Valid]
    #[Groups(['user:read', 'user:write', 'user:self:write', 'user:me:read'])]
    private ?EmergencyContact $emergencyContact = null;

    /** @var Collection<int, GameRegistration> */
    #[ORM\OneToMany(mappedBy: 'user', targetEntity: GameRegistration::class, orphanRemoval: true)]
    private Collection $gameRegistrations;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['user:read', 'user:write', 'user:self:write', 'user:me:read'])]
    private ?string $pseudo = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['user:read', 'user:write', 'user:self:write', 'user:me:read'])]
    private ?string $phone = null;

    #[ORM\Column(length: 50)]
    #[Assert\Choice(choices: [
        'ROLE_USER',
        'ROLE_ADMIN',
        'ROLE_ORGANIZER',
        'ROLE_SUPER_ADMIN',
    ], groups: ['user:create', 'user:admin:update'])]
    #[Groups(['user:read', 'user:write', 'user:me:read'])]
    private string $role = 'ROLE_USER';

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['user:read'])]
    private ?string $adminNotes = null;

    #[ORM\Column]
    #[Groups(['user:read', 'user:write'])]
    #[SerializedName('canSeePrivate')]
    private bool $canSeePrivate = false;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['user:read', 'user:me:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['user:read', 'user:me:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt         = new \DateTimeImmutable();
        $this->updatedAt         = new \DateTimeImmutable();
        $this->gameRegistrations = new ArrayCollection();
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

    public function getDateOfBirth(): \DateTimeInterface
    {
        return $this->dateOfBirth;
    }

    public function setDateOfBirth(\DateTimeInterface $dateOfBirth): self
    {
        $this->dateOfBirth = $dateOfBirth;

        return $this;
    }

    #[Groups(['user:read', 'user:me:read'])]
    public function getEmergencyContact(): ?EmergencyContact
    {
        return $this->emergencyContact;
    }

    #[Groups(['user:read', 'user:me:read'])]
    public function getEmergencyContactLastname(): ?string
    {
        return $this->emergencyContact?->getLastname();
    }

    #[Groups(['user:read', 'user:me:read'])]
    public function getEmergencyContactFirstname(): ?string
    {
        return $this->emergencyContact?->getFirstname();
    }

    #[Groups(['user:read', 'user:me:read'])]
    public function getEmergencyContactEmail(): ?string
    {
        return $this->emergencyContact?->getEmail();
    }

    #[Groups(['user:read', 'user:me:read'])]
    public function getEmergencyContactPhone(): ?string
    {
        return $this->emergencyContact?->getPhone();
    }

    public function setEmergencyContact(?EmergencyContact $emergencyContact): self
    {
        if (null === $emergencyContact && null !== $this->emergencyContact) {
            $this->emergencyContact->setUser(null);
        }

        if (null !== $emergencyContact) {
            $emergencyContact->setUser($this);
        }

        $this->emergencyContact = $emergencyContact;

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

    /**
     * @return list<string>
     */
    public function getRoles(): array
    {
        $roles = [$this->role];

        if (!in_array('ROLE_USER', $roles, true)) {
            $roles[] = 'ROLE_USER';
        }

        return array_values(array_unique($roles));
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

    #[Groups(['user:read', 'user:write'])]
    public function getCanSeePrivate(): bool
    {
        return $this->canSeePrivate;
    }

    #[Groups(['user:read', 'user:write'])]
    public function isCanSeePrivate(): bool
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

    public function getUserIdentifier(): string
    {
        $email = $this->email;

        if ('' === $email) {
            throw new \LogicException('User email cannot be empty.');
        }

        return $email;
    }

    public function eraseCredentials(): void
    {
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

    #[Assert\Callback(groups: ['Default', 'user:create', 'user:admin:update', 'user:self:general'])]
    public function validateEmergencyContactForMinor(
        ExecutionContextInterface $context,
    ): void {
        if ($this->isMinor() && (null === $this->emergencyContact || !$this->emergencyContact->isComplete())) {
            $context->buildViolation('Le contact d\'urgence est obligatoire pour un mineur.')
                ->atPath('emergencyContact')
                ->addViolation();
        }
    }

    private function isMinor(): bool
    {
        if (!isset($this->dateOfBirth)) {
            return false;
        }

        $today     = new \DateTimeImmutable('today');
        $birthDate = \DateTimeImmutable::createFromInterface($this->dateOfBirth);

        return $birthDate->diff($today)->y < 18;
    }
}
