<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260714110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Seed default super admin user from environment variables';
    }

    public function up(Schema $schema): void
    {
        $email = $this->requiredEnv('SUPER_ADMIN_EMAIL');
        $pseudo = $this->optionalEnv('SUPER_ADMIN_PSEUDO');
        $firstname = $this->requiredEnv('SUPER_ADMIN_FIRSTNAME');
        $lastname = $this->requiredEnv('SUPER_ADMIN_LASTNAME');
        $password = $this->requiredEnv('SUPER_ADMIN_PASSWORD');
        $dateOfBirth = $this->optionalEnv('SUPER_ADMIN_DATE_OF_BIRTH', '1990-01-01');
        $phone = $this->optionalEnv('SUPER_ADMIN_PHONE');
        $role = 'ROLE_SUPER_ADMIN';
        $adminNotes = null;
        $canSeePrivate = true;

        $criteria = ['email' => $email];
        $where = ['email = :email'];

        if (null !== $pseudo) {
            $where[] = 'pseudo = :pseudo';
            $criteria['pseudo'] = $pseudo;
        }

        $existingUserCount = (int) $this->connection->fetchOne(
            sprintf('SELECT COUNT(1) FROM users WHERE %s', implode(' OR ', $where)),
            $criteria,
        );

        if ($existingUserCount > 0) {
            return;
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        if (false === $hashedPassword) {
            throw new \RuntimeException('Unable to hash default super admin password.');
        }

        $this->addSql(
            'INSERT INTO users (lastname, firstname, email, password, date_of_birth, pseudo, phone, role, admin_notes, can_see_private, created_at, updated_at)
             VALUES (:lastname, :firstname, :email, :password, :dateOfBirth, :pseudo, :phone, :role, :adminNotes, :canSeePrivate, NOW(), NOW())',
            [
                'lastname' => $lastname,
                'firstname' => $firstname,
                'email' => $email,
                'password' => $hashedPassword,
                'dateOfBirth' => $dateOfBirth,
                'pseudo' => $pseudo,
                'phone' => $phone,
                'role' => $role,
                'adminNotes' => $adminNotes,
                'canSeePrivate' => $canSeePrivate,
            ],
        );
    }

    public function down(Schema $schema): void
    {
        $email = $this->requiredEnv('SUPER_ADMIN_EMAIL');

        $this->addSql(
            'DELETE FROM users WHERE email = :email',
            ['email' => $email],
        );
    }

    private function requiredEnv(string $name): string
    {
        $value = getenv($name);

        if (false === $value || '' === $value) {
            throw new \RuntimeException(sprintf('Missing required environment variable "%s".', $name));
        }

        return $value;
    }

    private function optionalEnv(string $name, ?string $default = null): ?string
    {
        $value = getenv($name);

        if (false === $value || '' === $value) {
            return $default;
        }

        return $value;
    }

}
