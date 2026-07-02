<?php

namespace App\Security\Jwt;

use App\Entity\User;
use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTDecodedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

final class TokenVersionSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private UserRepository $userRepository,
        private JwtRevocationStore $jwtRevocationStore,
        #[Autowire('%kernel.secret%')]
        private string $appSecret,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            Events::JWT_CREATED => 'onJwtCreated',
            Events::JWT_DECODED => 'onJwtDecoded',
        ];
    }

    public function onJwtCreated(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();
        if (!$user instanceof User) {
            return;
        }

        $payload            = $event->getData();
        $payload['pwd_sig'] = $this->computePasswordSignature($user);
        $nonce              = $this->jwtRevocationStore->getOrCreateUserTokenNonce($user);
        if (\is_string($nonce) && '' !== $nonce) {
            $payload['tok_nce'] = $nonce;
        }

        $event->setData($payload);
    }

    public function onJwtDecoded(JWTDecodedEvent $event): void
    {
        $payload = $event->getPayload();

        $identifier = $payload['username'] ?? null;
        if (!\is_string($identifier) || '' === $identifier) {
            $event->markAsInvalid();

            return;
        }

        $tokenNonce = $payload['tok_nce'] ?? null;

        $user = $this->userRepository->findOneBy(['email' => $identifier]);
        if (!$user instanceof User) {
            $event->markAsInvalid();

            return;
        }

        $passwordSignature = $payload['pwd_sig'] ?? null;
        if (!\is_string($passwordSignature) || '' === $passwordSignature) {
            $event->markAsInvalid();

            return;
        }

        if (!hash_equals($this->computePasswordSignature($user), $passwordSignature)) {
            $event->markAsInvalid();

            return;
        }

        $currentNonce = $this->jwtRevocationStore->getUserTokenNonce($user);
        if (null !== $currentNonce) {
            if (!\is_string($tokenNonce) || '' === $tokenNonce) {
                $event->markAsInvalid();

                return;
            }

            if (!hash_equals($currentNonce, $tokenNonce)) {
                $event->markAsInvalid();
            }
        }
    }

    private function computePasswordSignature(User $user): string
    {
        return hash_hmac('sha256', $user->getPassword(), $this->appSecret);
    }
}
