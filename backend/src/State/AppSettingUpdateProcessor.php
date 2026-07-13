<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\AppSetting;
use App\Repository\AppSettingRepository;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @implements ProcessorInterface<AppSetting, AppSetting>
 */
final class AppSettingUpdateProcessor implements ProcessorInterface
{
    /**
     * @param ProcessorInterface<AppSetting, AppSetting> $persistProcessor
     */
    public function __construct(
        private AppSettingRepository $repository,
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $persistProcessor,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): AppSetting
    {
        $singleton = $this->repository->findOneBy([], ['id' => 'ASC']);
        if (!$singleton instanceof AppSetting) {
            throw new NotFoundHttpException('App settings not found.');
        }

        $singleton
            ->setDefaultAddress($data->getDefaultAddress())
            ->setDefaultPrice($data->getDefaultPrice())
            ->setDefaultMaxPlaces($data->getDefaultMaxPlaces());

        return $this->persistProcessor->process($singleton, $operation, $uriVariables, $context);
    }
}
