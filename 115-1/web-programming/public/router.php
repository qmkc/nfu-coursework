<?php

$requestPath = urldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
$requestedFile = __DIR__ . $requestPath;

if (
  is_file($requestedFile)
  || is_dir($requestedFile) && is_file(rtrim($requestedFile, '/') . '/index.html')
) {
  return false;
}

use Qmkc\WebProgramming\Http\Router;

$app = require __DIR__ . '/runtime/src/bootstrap.php';

$router = new Router($app);
$router->loadPages("{$app['root']}/src/app");

$path = rtrim($requestPath, '/');
$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $path === '' ? '/' : $path);
