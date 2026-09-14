<?php

require __DIR__ . '/../vendor/autoload.php';

use Illuminate\Container\Container as BaseContainer;
use Jenssegers\Blade\Blade;
use Jenssegers\Blade\Container as BladeContainer;

$root = dirname(__DIR__);

$site = require "{$root}/src/data/site.php";
$content = require "{$root}/src/data/content.php";
$weekThemes = require "{$root}/src/data/weeks.php";
$weekContent = require "{$root}/src/data/week-content.php";
$about = require "{$root}/src/data/about.php";
$sourceFiles = require "{$root}/src/data/source-files.php";
$weekCount = $site['week_count'];
$currentYear = date('Y');

$container = new BladeContainer();
BaseContainer::setInstance($container);

$cachePath = "{$root}/storage/cache/views";
if (!is_dir($cachePath)) {
  mkdir($cachePath, 0755, true);
}

$blade = new Blade(["{$root}/src/app", "{$root}/src/layouts"], $cachePath, $container);

return [
  'root' => $root,
  'site' => $site,
  'content' => $content,
  'weekThemes' => $weekThemes,
  'weekContent' => $weekContent,
  'about' => $about,
  'sourceFiles' => $sourceFiles,
  'weekCount' => $weekCount,
  'currentYear' => $currentYear,
  'blade' => $blade,
];
