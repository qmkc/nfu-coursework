<?php

return [
  'static' => true,

  'render' => function (array $params, array $app): string {
    ['blade' => $blade, 'site' => $site, 'sourceFiles' => $sourceFiles, 'currentYear' => $currentYear] = $app;

    return $blade->render('source.page', [
      'site' => $site,
      'currentYear' => $currentYear,
      'files' => $sourceFiles,
      'pageTitle' => sprintf('原始碼瀏覽｜%s %s', $site['student_id'], $site['title']),
      'pageDescription' => '瀏覽本網站幾個關鍵頁面與腳本的原始碼內容。',
      'showSectionNav' => false,
    ]);
  },
];
