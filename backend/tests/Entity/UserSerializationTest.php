<?php

namespace App\Tests\Entity;

use App\Entity\User;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Serializer\Encoder\JsonEncoder;
use Symfony\Component\Serializer\Mapping\Factory\ClassMetadataFactory;
use Symfony\Component\Serializer\Mapping\Loader\AttributeLoader;
use Symfony\Component\Serializer\NameConverter\CamelCaseToSnakeCaseNameConverter;
use Symfony\Component\Serializer\NameConverter\MetadataAwareNameConverter;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;
use Symfony\Component\Serializer\Serializer;

final class UserSerializationTest extends TestCase
{
    public function testCanSeePrivateIsSerializedInCamelCase(): void
    {
        $serializer = $this->createSerializer();

        $user = new User();
        $user->setLastname('Martin');
        $user->setFirstname('Alex');
        $user->setEmail('alex@example.com');
        $user->setDateOfBirth(new \DateTimeImmutable('1992-01-01'));
        $user->setRole('ROLE_USER');
        $user->setCanSeePrivate(true);

        $data = $serializer->normalize($user, null, ['groups' => ['user:read']]);

        self::assertIsArray($data);
        self::assertArrayHasKey('canSeePrivate', $data);
        self::assertTrue($data['canSeePrivate']);
    }

    private function createSerializer(): Serializer
    {
        $metadataFactory = new ClassMetadataFactory(new AttributeLoader());
        $nameConverter = new MetadataAwareNameConverter(
            $metadataFactory,
            new CamelCaseToSnakeCaseNameConverter(),
        );

        return new Serializer(
            [new ObjectNormalizer($metadataFactory, $nameConverter)],
            [new JsonEncoder()],
        );
    }
}
