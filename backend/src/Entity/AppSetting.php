<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Patch;
use App\Repository\AppSettingRepository;
use App\Security\Voter\AppSettingVoter;
use App\State\AppSettingProvider;
use App\State\AppSettingUpdateProcessor;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AppSettingRepository::class)]
#[ORM\Table(name: 'app_setting')]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    paginationEnabled: false,
    operations: [
        new Get(
            uriTemplate: '/app_settings',
            provider: AppSettingProvider::class,
            security: "is_granted('" . AppSettingVoter::VIEW_APP_SETTINGS . "')",
        ),
        new Patch(
            uriTemplate: '/app_settings',
            provider: AppSettingProvider::class,
            processor: AppSettingUpdateProcessor::class,
            security: "is_granted('" . AppSettingVoter::MANAGE_APP_SETTINGS . "')",
        ),
    ]
)]
class AppSetting
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    #[Assert\NotBlank]
    private string $defaultAddress = 'Terrain principal';

    #[ORM\Column(type: 'float')]
    #[Assert\PositiveOrZero]
    private float $defaultPrice = 10.0;

    #[ORM\Column(type: 'integer')]
    #[Assert\Positive]
    private int $defaultMaxPlaces = 24;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDefaultAddress(): string
    {
        return $this->defaultAddress;
    }

    public function setDefaultAddress(string $defaultAddress): self
    {
        $this->defaultAddress = $defaultAddress;

        return $this;
    }

    public function getDefaultPrice(): float
    {
        return $this->defaultPrice;
    }

    public function setDefaultPrice(float $defaultPrice): self
    {
        $this->defaultPrice = $defaultPrice;

        return $this;
    }

    public function getDefaultMaxPlaces(): int
    {
        return $this->defaultMaxPlaces;
    }

    public function setDefaultMaxPlaces(int $defaultMaxPlaces): self
    {
        $this->defaultMaxPlaces = $defaultMaxPlaces;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now             = new \DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }
}
