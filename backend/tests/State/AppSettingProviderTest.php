<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Get;
use App\Entity\AppSetting;
use App\Repository\AppSettingRepository;
use App\State\AppSettingProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class AppSettingProviderTest extends TestCase
{
    public function testThrowsNotFoundWhenNoSettingsExist(): void
    {
        $repository = $this->createMock(AppSettingRepository::class);
        $repository->method('findOneBy')->willReturn(null);

        $provider = new AppSettingProvider($repository);

        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('App settings not found.');

        $provider->provide(new Get());
    }

    public function testReturnsSettingWhenFound(): void
    {
        $setting = new AppSetting();
        $setting->setDefaultAddress('Terrain Alpha');
        $setting->setDefaultMaxPlaces(30);

        $repository = $this->createMock(AppSettingRepository::class);
        $repository->method('findOneBy')->willReturn($setting);

        $provider = new AppSettingProvider($repository);

        $result = $provider->provide(new Get());

        $this->assertSame($setting, $result);
        $this->assertSame('Terrain Alpha', $result->getDefaultAddress());
        $this->assertSame(30, $result->getDefaultMaxPlaces());
    }
}
