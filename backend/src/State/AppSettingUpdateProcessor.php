<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\AppSetting;
use App\Entity\User;
use App\Repository\AppSettingRepository;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
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
        private Security $security,
        #[Autowire(service: 'monolog.logger.security')]
        private LoggerInterface $logger,
        #[Autowire('%kernel.environment%')]
        private string $environment,
        #[Autowire('%kernel.secret%')]
        private string $appSecret,
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

        $result = $this->persistProcessor->process($singleton, $operation, $uriVariables, $context);

        $actor = $this->security->getUser();
        $actorIdHash = null;
        if ($actor instanceof User && null !== $actor->getId()) {
            $actorIdHash = hash_hmac('sha256', sprintf('user:%d', $actor->getId()), $this->appSecret);
        }

        $this->logger->warning('Security app settings updated.', [
            'event_id' => 'SEC.ADMIN.SETTINGS_UPDATED',
            'event_category' => 'admin_action',
            'severity' => 'WARNING',
            'outcome' => 'success',
            'action' => 'app_settings_update',
            'service' => 'backend-api',
            'environment' => $this->environment,
            'actor_type' => $actor instanceof User ? 'user' : 'anonymous',
            'actor_id_hash' => $actorIdHash,
            'target_type' => 'app_setting',
            'target_id_hash' => hash_hmac('sha256', sprintf('app_setting:%d', (int) $singleton->getId()), $this->appSecret),
            'reason_code' => 'ADMIN_UPDATE',
            'message' => 'Application settings updated by privileged actor.',
        ]);

        return $result;
    }
}
