<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260703210000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add mandatory age and optional emergency contact to users';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users ADD age INT DEFAULT 18 NOT NULL');
        $this->addSql('ALTER TABLE users ADD emergency_contact VARCHAR(255) DEFAULT NULL');
        $this->addSql('UPDATE users SET age = EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))');
        $this->addSql('ALTER TABLE users ALTER COLUMN age DROP DEFAULT');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users DROP age');
        $this->addSql('ALTER TABLE users DROP emergency_contact');
    }
}
