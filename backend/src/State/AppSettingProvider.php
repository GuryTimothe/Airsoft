<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\AppSetting;
use App\Repository\AppSettingRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @implements ProviderInterface<AppSetting>
 */
final class AppSettingProvider implements ProviderInterface
{
    public function __construct(private AppSettingRepository $repository)
    {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): AppSetting
    {
        $setting = $this->repository->findOneBy([], ['id' => 'ASC']);
        if (!$setting instanceof AppSetting) {
            throw new NotFoundHttpException('App settings not found.');
        }

        return $setting;
    }
}
