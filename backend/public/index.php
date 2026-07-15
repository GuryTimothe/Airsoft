<?php

use App\Kernel;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Dotenv\Dotenv;

require_once dirname(__DIR__).'/vendor/autoload.php';

$rootEnvPath = dirname(__DIR__, 2).'/.env';
if (class_exists(Dotenv::class) && is_file($rootEnvPath)) {
	(new Dotenv())->usePutenv()->bootEnv($rootEnvPath);
}

$env = $_SERVER['APP_ENV'] ?? $_ENV['APP_ENV'] ?? 'dev';
$debug = filter_var($_SERVER['APP_DEBUG'] ?? $_ENV['APP_DEBUG'] ?? ('prod' !== $env), FILTER_VALIDATE_BOOL);

$kernel = new Kernel($env, $debug);
$request = Request::createFromGlobals();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
