<?php

return [
  // 檔名清單不是固定範圍的數字（不像 weekly 的 [id=01-18]），沒辦法在建置期窮舉，
  // 所以這條路由是動態的，交給 public/router.php 在請求當下即時渲染。
  'static' => false,

  'render' => function (array $params, array $app): string {
    ['blade' => $blade, 'site' => $site, 'sourceFiles' => $sourceFiles, 'currentYear' => $currentYear, 'root' => $root] = $app;

    $slug = $params['slug'] ?? '';
    $file = $sourceFiles[$slug] ?? null;

    // 只允許讀取白名單（source-files.php）裡列出的檔案，
    // 並用 realpath 確認解析後的路徑仍在專案目錄內，避免路徑穿越讀到不該讀的檔案。
    $code = null;
    if ($file !== null) {
      $projectRoot = realpath($root);
      $fullPath = realpath("{$root}/{$file['path']}");

      if ($projectRoot !== false && $fullPath !== false && is_file($fullPath) && str_starts_with($fullPath, $projectRoot)) {
        $code = file_get_contents($fullPath);
      } else {
        $file = null;
      }
    }

    return $blade->render('source.[slug].page', [
      'site' => $site,
      'currentYear' => $currentYear,
      'slug' => $slug,
      'file' => $file,
      'code' => $code,
      'pageTitle' => $file !== null
        ? sprintf('%s｜原始碼瀏覽', $file['label'])
        : '找不到檔案｜原始碼瀏覽',
      'pageDescription' => $file !== null
        ? sprintf('%s 的原始碼內容。', $file['label'])
        : '找不到這個原始碼檔案。',
      'showSectionNav' => false,
    ]);
  },
];
