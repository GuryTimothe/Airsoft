<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\Dto\AdminUserInvitationOutput;
use App\Entity\EmailVerificationToken;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;

/**
 * @implements ProcessorInterface<User, AdminUserInvitationOutput>
 */
class UserCreateProcessor implements ProcessorInterface
{
    private const PRIVATE_ACCESS_ROLES = ['ROLE_ORGANIZER', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'];

    /**
     */
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private UserRepository $userRepository,
        private Security $security,
        private MailerInterface $mailer,
        #[Autowire('%env(MAILER_FROM)%')]
        private string $mailerFrom,
        #[Autowire('%env(FRONTEND_URL)%')]
        private string $frontendUrl,
        #[Autowire(service: 'monolog.logger.security')]
        private LoggerInterface $logger,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (\in_array($data->getRole(), self::PRIVATE_ACCESS_ROLES, true)) {
            $data->setCanSeePrivate(true);
        }

        $hashedPassword = $this->passwordHasher->hashPassword($data, $data->getPassword());
        $data->setPassword($hashedPassword);
        $data->setEmailVerified(false);

        $existingUser = $this->userRepository->findOneBy(['email' => $data->getEmail()]);
        if ($existingUser instanceof User && $existingUser->isEmailVerified()) {
            throw new ValidationException(new ConstraintViolationList([
                new ConstraintViolation(
                    'Un compte avec cet email existe deja.',
                    null,
                    [],
                    null,
                    'email',
                    $data->getEmail(),
                ),
            ]));
        }

        try {
            if ($existingUser instanceof User) {
                $this->entityManager->remove($existingUser);
                $this->entityManager->flush();
            }

            $plainToken = bin2hex(random_bytes(32));
            $this->entityManager->persist($data);
            $this->entityManager->persist(new EmailVerificationToken(
                $data,
                hash('sha256', $plainToken),
                new \DateTimeImmutable('+24 hours'),
            ));
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            throw new ValidationException(new ConstraintViolationList([
                new ConstraintViolation(
                    'Un compte avec cet email existe deja.',
                    null,
                    [],
                    null,
                    'email',
                    $data->getEmail(),
                ),
            ]));
        }

        $admin     = $this->security->getUser();
        $adminName = $admin instanceof User
            ? trim(sprintf('%s %s', $admin->getFirstname(), $admin->getLastname()))
            : 'Un administrateur';
        $url = sprintf('%s/auth/validation-email?token=%s', rtrim($this->frontendUrl, '/'), rawurlencode($plainToken));

        try {
            $this->mailer->send(
                (new Email())
                    ->from($this->mailerFrom)
                    ->to($data->getEmail())
                    ->subject('Un administrateur a créé votre compte')
                    ->text(sprintf("Bonjour %s,\n\n%s a créé un compte pour vous. Pour finaliser la création de votre compte, validez votre adresse e-mail :\n%s\n\nCe lien expire dans 24 heures.", $data->getFirstname(), $adminName, $url))
                    ->html(sprintf('<p>Bonjour %s,</p><p><strong>%s</strong> a créé un compte pour vous.</p><p>Pour finaliser la création de votre compte, <a href="%s">validez votre adresse e-mail</a>.</p><p>Ce lien expire dans 24 heures.</p>', htmlspecialchars($data->getFirstname(), ENT_QUOTES), htmlspecialchars($adminName, ENT_QUOTES), htmlspecialchars($url, ENT_QUOTES))),
            );
        } catch (\Throwable $exception) {
            $this->logger->error('Administrator-created user invitation email delivery failed.', [
                'event_id'  => 'SEC.AUTH.ADMIN_INVITATION_EMAIL_FAILED',
                'exception' => $exception,
            ]);
        }

        return new AdminUserInvitationOutput('Un e-mail de confirmation a été envoyé à l’utilisateur. Le compte sera visible après validation de son adresse e-mail.');
    }
}
