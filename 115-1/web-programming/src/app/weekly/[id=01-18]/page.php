<?php

return [
  'static' => true,

  'render' => function (array $params, array $app): string {
    ['blade' => $blade, 'site' => $site, 'weekThemes' => $weekThemes, 'weekCount' => $weekCount, 'currentYear' => $currentYear] = $app;

    $weekNo = (int) $params['id'];

    return $blade->render('weekly.[id=01-18].page', [
      'site' => $site,
      'currentYear' => $currentYear,
      'weekCount' => $weekCount,
      'weekNo' => $weekNo,
      'weekTheme' => $weekThemes[$weekNo] ?? null,
      'pageTitle' => sprintf('Week %02d｜%s %s', $weekNo, $site['student_id'], $site['title']),
      'pageDescription' => sprintf('學號 %s，第 %02d 週課程學習成果、程式碼與學習心得。', $site['student_id'], $weekNo),
      'showSectionNav' => false,
    ]);
  },
];
