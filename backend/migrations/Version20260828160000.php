<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260828160000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Record whether a password reset may renew an authenticated session';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE password_reset_tokens ADD renew_session BOOLEAN DEFAULT FALSE NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE password_reset_tokens DROP renew_session');
    }
}
