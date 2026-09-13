<?php

namespace Qmkc\WebProgramming\Http;

use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use SplFileInfo;

final class Router
{
  private array $routes = [];

  public function __construct(private readonly array $shared = [])
  {
  }

  public function routes(): array
  {
    return $this->routes;
  }

  public function loadPages(string $dir): void
  {
    if (!is_dir($dir)) {
      return;
    }

    $found = [];
    $iterator = new RecursiveIteratorIterator(
      new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)
    );

    foreach ($iterator as $file) {
      if (!$file->isFile() || $file->getFilename() !== 'page.php') {
        continue;
      }

      $relativeDir = ltrim(
        str_replace('\\', '/', substr(dirname($file->getPathname()), strlen($dir))),
        '/'
      );

      [$pattern, $regex, $constraints, $dynamicSegments] = $this->routeFromDir($relativeDir);

      $descriptor = require $file->getPathname();
      if (!is_array($descriptor) || !isset($descriptor['render']) || !is_callable($descriptor['render'])) {
        throw new RuntimeException("{$file->getPathname()} 必須 return ['static' => bool, 'render' => callable]");
      }
      $descriptor['static'] ??= false;

      $found[] = [
        'pattern' => $pattern,
        'regex' => $regex,
        'dynamicSegments' => $dynamicSegments,
        'constraints' => $constraints,
        'file' => $file->getPathname(),
        'descriptor' => $descriptor,
      ];
    }

    usort($found, static function (array $a, array $b): int {
      return $a['dynamicSegments'] <=> $b['dynamicSegments']
        ?: strlen($b['pattern']) <=> strlen($a['pattern']);
    });

    $this->routes = [...$this->routes, ...$found];
  }

  private function routeFromDir(string $relativeDir): array
  {
    $segments = $relativeDir === '' ? [] : explode('/', $relativeDir);

    $patternParts = [];
    $regexParts = [];
    $constraints = [];

    foreach ($segments as $segment) {
      [$patternPart, $regexPart, $paramName, $range] = $this->parseSegment($segment);
      $patternParts[] = $patternPart;
      $regexParts[] = $regexPart;
      if ($range !== null) {
        $constraints[$paramName] = $range;
      }
    }

    $pattern = '/' . implode('/', $patternParts);
    $regex = '#^/' . implode('/', $regexParts) . '$#u';
    $dynamicSegments = count(array_filter($segments, static fn(string $s) => $s !== '' && $s[0] === '['));

    return [$pattern, $regex, $constraints, $dynamicSegments];
  }

  private function parseSegment(string $segment): array
  {
    if (!preg_match('/^\[(\w+)(?:=(\d+)-(\d+))?\]$/', $segment, $m)) {
      return [$segment, preg_quote($segment, '#'), null, null];
    }

    $name = $m[1];

    if (!isset($m[2], $m[3]) || $m[2] === '') {
      return ["{{$name}}", "(?P<{$name}>[^/]+)", null, null];
    }

    $min = $m[2];
    $max = $m[3];
    $width = $min[0] === '0' && strlen($min) > 1 ? strlen($min) : null;
    $digitPattern = $width !== null ? "\\d{{$width}}" : '\\d+';

    return ["{{$name}}", "(?P<{$name}>{$digitPattern})", $name, [(int) $min, (int) $max, $width]];
  }

  public function dispatch(string $method, string $path): void
  {
    $path = $path === '' ? '/' : $path;

    foreach ($this->routes as $route) {
      $params = $this->match($route, $path);
      if ($params === null) {
        continue;
      }

      try {
        echo $route['descriptor']['render']($params, $this->shared);
      } catch (\Throwable $e) {
        error_log((string) $e);
        echo $this->renderStatus(500, '500｜伺服器發生錯誤', '這個頁面暫時無法顯示，請稍後再試。');
      }
      return;
    }

    echo $this->renderStatus(404, '404｜找不到頁面', '網址可能打錯了，或是頁面還沒做好，回首頁看看吧。');
  }

  private function match(array $route, string $path): ?array
  {
    if (!preg_match($route['regex'], $path, $matches)) {
      return null;
    }

    $params = array_filter($matches, static fn($key) => is_string($key), ARRAY_FILTER_USE_KEY);

    foreach ($route['constraints'] as $name => [$min, $max]) {
      $value = (int) $params[$name];
      if ($value < $min || $value > $max) {
        return null;
      }
    }

    return $params;
  }

  public function renderStatus(int $code, string $title, string $message): string
  {
    http_response_code($code);

    $blade = $this->shared['blade'] ?? null;
    if ($blade === null) {
      return "{$code} {$title}\n{$message}";
    }

    $site = $this->shared['site'] ?? [];
    $data = [
      'site' => $site,
      'currentYear' => $this->shared['currentYear'] ?? date('Y'),
      'statusCode' => $code,
      'errorMessage' => $message,
      'pageTitle' => $title,
      'pageDescription' => $message,
      'showSectionNav' => false,
    ];

    $view = "errors.{$code}";
    return $blade->exists($view) ? $blade->render($view, $data) : $blade->render('errors.error', $data);
  }
}
