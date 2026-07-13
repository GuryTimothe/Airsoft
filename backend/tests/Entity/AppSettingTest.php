<?php

namespace App\Tests\Entity;

use App\Entity\AppSetting;
use PHPUnit\Framework\TestCase;

final class AppSettingTest extends TestCase
{
    public function testDefaultValues(): void
    {
        $setting = new AppSetting();

        $this->assertNull($setting->getId());
        $this->assertSame('Terrain principal', $setting->getDefaultAddress());
        $this->assertSame(10.0, $setting->getDefaultPrice());
        $this->assertSame(24, $setting->getDefaultMaxPlaces());
        $this->assertInstanceOf(\DateTimeImmutable::class, $setting->getCreatedAt());
        $this->assertInstanceOf(\DateTimeImmutable::class, $setting->getUpdatedAt());
    }

    public function testSettersAndGetters(): void
    {
        $setting = new AppSetting();

        $result = $setting->setDefaultAddress('Terrain secondaire');
        $this->assertSame($setting, $result);
        $this->assertSame('Terrain secondaire', $setting->getDefaultAddress());

        $result = $setting->setDefaultPrice(25.5);
        $this->assertSame($setting, $result);
        $this->assertSame(25.5, $setting->getDefaultPrice());

        $result = $setting->setDefaultMaxPlaces(48);
        $this->assertSame($setting, $result);
        $this->assertSame(48, $setting->getDefaultMaxPlaces());
    }

    public function testOnPrePersistSetsTimestamps(): void
    {
        $setting = new AppSetting();
        $before = new \DateTimeImmutable();

        $setting->onPrePersist();

        $this->assertGreaterThanOrEqual($before, $setting->getCreatedAt());
        $this->assertGreaterThanOrEqual($before, $setting->getUpdatedAt());
        $this->assertEquals($setting->getCreatedAt(), $setting->getUpdatedAt());
    }

    public function testOnPreUpdateUpdatesUpdatedAt(): void
    {
        $setting = new AppSetting();
        $setting->onPrePersist();
        $createdAt = $setting->getCreatedAt();

        $setting->onPreUpdate();

        $this->assertGreaterThanOrEqual($createdAt, $setting->getUpdatedAt());
    }
}
