<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260714110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Seed default super admin user (pseudo=sys, email=sys@gmail.com)';
    }

    public function up(Schema $schema): void
    {
        $existingUserCount = (int) $this->connection->fetchOne(
            'SELECT COUNT(1) FROM users WHERE email = :email OR pseudo = :pseudo',
            [
                'email' => 'sys@gmail.com',
                'pseudo' => 'sys',
            ],
        );

        if ($existingUserCount > 0) {
            return;
        }

        $hashedPassword = password_hash('mdpmdpmdp', PASSWORD_BCRYPT);

        if (false === $hashedPassword) {
            throw new \RuntimeException('Unable to hash default super admin password.');
        }

        $this->addSql(
            'INSERT INTO users (lastname, firstname, email, password, date_of_birth, pseudo, phone, role, admin_notes, can_see_private, created_at, updated_at)
             VALUES (:lastname, :firstname, :email, :password, :dateOfBirth, :pseudo, :phone, :role, :adminNotes, :canSeePrivate, NOW(), NOW())',
            [
                'lastname' => 'sys',
                'firstname' => 'sys',
                'email' => 'sys@gmail.com',
                'password' => $hashedPassword,
                'dateOfBirth' => '1990-01-01',
                'pseudo' => 'sys',
                'phone' => null,
                'role' => 'ROLE_SUPER_ADMIN',
                'adminNotes' => 'Seeded default super admin account.',
                'canSeePrivate' => true,
            ],
        );
    }

    public function down(Schema $schema): void
    {
        $this->addSql(
            'DELETE FROM users WHERE email = :email',
            ['email' => 'sys@gmail.com'],
        );
    }
}
