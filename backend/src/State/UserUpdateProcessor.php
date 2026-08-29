<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Entity\EmailVerificationToken;
use App\Entity\User;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;

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
        private ?EntityManagerInterface $entityManager = null,
        private ?MailerInterface $mailer = null,
        #[Autowire('%env(MAILER_FROM)%')]
        private string $mailerFrom = '',
        #[Autowire('%env(FRONTEND_URL)%')]
        private string $frontendUrl = '',
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

        $emailChangeRequested = false;
        $newEmail             = null;
        if ($this->isEmailInitialized($data) && $this->isEmailInitialized($previousData)) {
            $newEmail             = $data->getEmail();
            $emailChangeRequested = $newEmail !== $previousData->getEmail();
            if ($emailChangeRequested) {
                $data->setEmail($previousData->getEmail());
            }
        }

        try {
            $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);
        } catch (UniqueConstraintViolationException) {
            throw new ValidationException(new ConstraintViolationList([
                new ConstraintViolation(
                    'Un compte avec cet email existe déjà.',
                    null,
                    [],
                    null,
                    'email',
                    $data->getEmail(),
                ),
            ]));
        }

        if ($emailChangeRequested && is_string($newEmail)) {
            $this->sendEmailVerification($data, $newEmail, $actor);
        }

        if ($previousData->getRole() !== $data->getRole()) {
            $this->logger->warning('Security role changed.', [
                'event_id'       => 'SEC.ADMIN.ROLE_CHANGED',
                'event_category' => 'admin_action',
                'severity'       => 'WARNING',
                'outcome'        => 'success',
                'action'         => 'role_change',
                'service'        => 'backend-api',
                'environment'    => $this->environment,
                'actor_type'     => 'user',
                'actor_id_hash'  => $this->hashUserId($actor),
                'target_type'    => 'user',
                'target_id_hash' => $this->hashUserId($data),
                'reason_code'    => 'ROLE_UPDATED',
                'message'        => 'User role changed by privileged actor.',
            ]);
        }

        return $result;
    }

    private function sendEmailVerification(User $user, string $newEmail, User $actor): void
    {
        if (null === $this->entityManager || null === $this->mailer) {
            throw new \LogicException('Email verification services are unavailable.');
        }

        $this->entityManager->createQuery('DELETE FROM App\\Entity\\EmailVerificationToken token WHERE token.user = :user AND token.pendingEmail IS NOT NULL')
            ->setParameter('user', $user)
            ->execute();

        $plainToken = bin2hex(random_bytes(32));
        $this->entityManager->persist(new EmailVerificationToken(
            $user,
            hash('sha256', $plainToken),
            new \DateTimeImmutable('+24 hours'),
            $newEmail,
        ));
        $this->entityManager->flush();

        $actorName = trim(sprintf('%s %s', $actor->getFirstname(), $actor->getLastname()));
        $url       = sprintf('%s/auth/validation-email?token=%s', rtrim($this->frontendUrl, '/'), rawurlencode($plainToken));

        try {
            $this->mailer->send(
                (new Email())
                    ->from($this->mailerFrom)
                    ->to($newEmail)
                    ->subject('Validez votre nouvelle adresse e-mail')
                    ->text(sprintf("Bonjour %s,\n\n%s a demandé la modification de votre adresse e-mail. Pour confirmer la nouvelle adresse, ouvrez ce lien :\n%s\n\nCe lien expire dans 24 heures.", $user->getFirstname(), $actorName, $url))
                    ->html(sprintf('<p>Bonjour %s,</p><p><strong>%s</strong> a demandé la modification de votre adresse e-mail.</p><p>Pour confirmer la nouvelle adresse, <a href="%s">validez votre adresse e-mail</a>.</p><p>Ce lien expire dans 24 heures.</p>', htmlspecialchars($user->getFirstname(), ENT_QUOTES), htmlspecialchars($actorName, ENT_QUOTES), htmlspecialchars($url, ENT_QUOTES))),
            );
        } catch (\Throwable $exception) {
            $this->logger->error('Administrator email change verification delivery failed.', [
                'event_id'  => 'SEC.ADMIN.EMAIL_CHANGE_VERIFICATION_FAILED',
                'exception' => $exception,
            ]);
        }
    }

    private function isPasswordInitialized(User $user): bool
    {
        self::$passwordProperty ??= new \ReflectionProperty(User::class, 'password');

        return self::$passwordProperty->isInitialized($user);
    }

    private function isEmailInitialized(User $user): bool
    {
        $emailProperty = new \ReflectionProperty(User::class, 'email');

        return $emailProperty->isInitialized($user);
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
