<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260828150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Store pending email changes on verification tokens';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE email_verification_tokens ADD pending_email VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE email_verification_tokens DROP pending_email');
    }
}
