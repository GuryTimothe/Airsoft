<?php

use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__).'/vendor/autoload.php';

$rootEnvPath = dirname(__DIR__, 2).'/.env';
if (class_exists(Dotenv::class) && is_file($rootEnvPath)) {
    (new Dotenv())->usePutenv()->bootEnv($rootEnvPath, 'test');
}

$databaseUrl = $_SERVER['DATABASE_URL'] ?? $_ENV['DATABASE_URL'] ?? null;
if (!\is_string($databaseUrl) || '' === trim($databaseUrl)) {
    $fallbackDatabaseUrl = 'sqlite:///%kernel.project_dir%/var/test.db';
    $_SERVER['DATABASE_URL'] = $fallbackDatabaseUrl;
    $_ENV['DATABASE_URL'] = $fallbackDatabaseUrl;
    putenv('DATABASE_URL='.$fallbackDatabaseUrl);
}

$defaultUri = $_SERVER['DEFAULT_URI'] ?? $_ENV['DEFAULT_URI'] ?? null;
if (!\is_string($defaultUri) || '' === trim($defaultUri)) {
    $fallbackDefaultUri = 'http://localhost';
    $_SERVER['DEFAULT_URI'] = $fallbackDefaultUri;
    $_ENV['DEFAULT_URI'] = $fallbackDefaultUri;
    putenv('DEFAULT_URI='.$fallbackDefaultUri);
}

$env = $_SERVER['APP_ENV'] ?? $_ENV['APP_ENV'] ?? 'test';
$debug = filter_var($_SERVER['APP_DEBUG'] ?? $_ENV['APP_DEBUG'] ?? ('prod' !== $env), FILTER_VALIDATE_BOOL);

if ($debug) {
    umask(0000);
}
