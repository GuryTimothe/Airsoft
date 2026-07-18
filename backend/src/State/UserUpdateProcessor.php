<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

/**
 * @implements ProcessorInterface<User, User>
 */
class UserUpdateProcessor implements ProcessorInterface
{
    private const PRIVATE_ACCESS_ROLES = ['ROLE_ORGANIZER', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'];

    private static ?\ReflectionProperty $passwordProperty = null;

    /**
     * @param ProcessorInterface<User, User> $persistProcessor
     */
    public function __construct(
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

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        $previousData = $context['previous_data'] ?? null;
        if (!$previousData instanceof User) {
            throw new \InvalidArgumentException('Previous user state is missing.');
        }

        $actor = $this->security->getUser();
        if (!$actor instanceof User) {
            throw new AccessDeniedException('Authenticated user is missing.');
        }

        if (!$this->isPasswordInitialized($data)) {
            $data->setPassword($previousData->getPassword());
        } elseif ($data->getPassword() !== $previousData->getPassword()) {
            throw new AccessDeniedException('Password changes are not allowed on this route.');
        }

        if ('ROLE_ADMIN' === $actor->getRole() && !\in_array($data->getRole(), ['ROLE_USER', 'ROLE_ORGANIZER'], true)) {
            throw new AccessDeniedException('Admins can only assign ROLE_USER or ROLE_ORGANIZER.');
        }

        if (\in_array($data->getRole(), self::PRIVATE_ACCESS_ROLES, true)) {
            $data->setCanSeePrivate(true);
        }

        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        if ($previousData->getRole() !== $data->getRole()) {
            $this->logger->warning('Security role changed.', [
                'event_id' => 'SEC.ADMIN.ROLE_CHANGED',
                'event_category' => 'admin_action',
                'severity' => 'WARNING',
                'outcome' => 'success',
                'action' => 'role_change',
                'service' => 'backend-api',
                'environment' => $this->environment,
                'actor_type' => 'user',
                'actor_id_hash' => $this->hashUserId($actor),
                'target_type' => 'user',
                'target_id_hash' => $this->hashUserId($data),
                'reason_code' => 'ROLE_UPDATED',
                'message' => 'User role changed by privileged actor.',
            ]);
        }

        return $result;
    }

    private function isPasswordInitialized(User $user): bool
    {
        self::$passwordProperty ??= new \ReflectionProperty(User::class, 'password');

        return self::$passwordProperty->isInitialized($user);
    }

    private function hashUserId(User $user): ?string
    {
        $id = $user->getId();
        if (null === $id) {
            return null;
        }

        return hash_hmac('sha256', sprintf('user:%d', $id), $this->appSecret);
    }
}
