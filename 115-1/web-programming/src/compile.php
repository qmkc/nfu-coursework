<?php

use Abordage\HtmlMin\HtmlMin;
use Qmkc\WebProgramming\Http\Router;

$app = require __DIR__ . '/bootstrap.php';
$root = $app['root'];
$publicPath = "{$root}/public";
$distPath = "{$root}/dist";

function ensureDir(string $dir): void
{
  if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
    throw new RuntimeException("無法建立目錄：{$dir}");
  }
}

function rrmdir(string $dir): void
{
  if (!is_dir($dir)) {
    return;
  }
  foreach (scandir($dir) as $entry) {
    if ($entry === '.' || $entry === '..') {
      continue;
    }
    $path = "{$dir}/{$entry}";
    is_dir($path) ? rrmdir($path) : unlink($path);
  }
  rmdir($dir);
}

function copyDir(string $src, string $dst): void
{
  ensureDir($dst);

  $iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($src, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST
  );

  foreach ($iterator as $item) {
    $target = "{$dst}/{$iterator->getSubPathname()}";
    if ($item->isDir()) {
      ensureDir($target);
    } else {
      copy($item->getPathname(), $target);
    }
  }
}

function enumerateParams(array $constraints): array
{
  $combinations = [[]];
  foreach ($constraints as $name => [$min, $max, $width]) {
    $values = [];
    for ($n = $min; $n <= $max; $n++) {
      $values[] = $width !== null ? str_pad((string) $n, $width, '0', STR_PAD_LEFT) : (string) $n;
    }

    $next = [];
    foreach ($combinations as $combo) {
      foreach ($values as $value) {
        $next[] = [...$combo, $name => $value];
      }
    }
    $combinations = $next;
  }

  return $combinations;
}

function outputPath(string $pattern, array $params): string
{
  $segments = array_values(array_filter(explode('/', $pattern), static fn(string $s) => $s !== ''));
  $segments = array_map(
    static fn(string $s) => preg_match('/^\{(\w+)\}$/', $s, $m) ? $params[$m[1]] : $s,
    $segments
  );

  return $segments === [] ? 'index.html' : implode('/', $segments) . '/index.html';
}

function writeMinified(string $destination, string $html, HtmlMin $minifier): void
{
  ensureDir(dirname($destination));
  file_put_contents($destination, $minifier->minify($html));
}

$minifier = new HtmlMin();

rrmdir($distPath);
copyDir($publicPath, $distPath);
copyDir("{$root}/src", "{$distPath}/runtime/src");
copyDir("{$root}/vendor", "{$distPath}/runtime/vendor");

// 「原始碼瀏覽頁」白名單裡的檔案不一定都在 src/ 底下（例如 scripts/ftp-deploy.sh），
// src/ 與 vendor/ 以外、白名單有登記的檔案要另外複製進 runtime，正式環境才讀得到。
foreach ($app['sourceFiles'] ?? [] as $entry) {
  $sourcePath = "{$root}/{$entry['path']}";
  $targetPath = "{$distPath}/runtime/{$entry['path']}";
  if (is_file($sourcePath) && !is_file($targetPath)) {
    ensureDir(dirname($targetPath));
    copy($sourcePath, $targetPath);
  }
}

$router = new Router($app);
$router->loadPages("{$root}/src/app");

$count = 0;
foreach ($router->routes() as $route) {
  if ($route['descriptor']['static'] !== true) {
    continue;
  }

  foreach (array_filter(explode('/', $route['pattern'])) as $segment) {
    if (preg_match('/^\{(\w+)\}$/', $segment, $m) && !isset($route['constraints'][$m[1]])) {
      throw new RuntimeException(
        "{$route['file']} 標記為 'static' => true，但 {$segment} 沒有範圍限制（例如 [name=min-max]），"
        . "無法在建置期枚舉所有可能值，請改成 'static' => false 或幫它加上範圍限制。"
      );
    }
  }

  $paramSets = $route['constraints'] === [] ? [[]] : enumerateParams($route['constraints']);

  foreach ($paramSets as $params) {
    $html = $route['descriptor']['render']($params, $app);
    writeMinified($distPath . '/' . outputPath($route['pattern'], $params), $html, $minifier);
    $count++;
  }
}

writeMinified(
  "{$distPath}/403.html",
  $router->renderStatus(403, '403｜禁止存取', '這個路徑不開放存取，回首頁看看其他內容吧。'),
  $minifier
);
writeMinified(
  "{$distPath}/404.html",
  $router->renderStatus(404, '404｜找不到頁面', '網址可能打錯了，或是頁面還沒做好，回首頁看看吧。'),
  $minifier
);
writeMinified(
  "{$distPath}/500.html",
  $router->renderStatus(500, '500｜伺服器發生錯誤', '這個頁面暫時無法顯示，請稍後再試。'),
  $minifier
);
$count += 3;

printf("已建置 %d 個靜態頁面到 dist/\n", $count);
