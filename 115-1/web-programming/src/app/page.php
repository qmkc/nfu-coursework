<?php

return [
  'static' => true,

  'render' => function (array $params, array $app): string {
    ['blade' => $blade, 'site' => $site, 'content' => $content, 'weekCount' => $weekCount, 'currentYear' => $currentYear] = $app;

    $weeks = [];
    for ($i = 1; $i <= $weekCount; $i++) {
      $weeks[] = [
        'no' => $i,
        'label' => sprintf('Week %02d', $i),
        'summary' => '本週成果',
      ];
    }

    return $blade->render('page', [
      'site' => $site,
      'currentYear' => $currentYear,
      'weekCount' => $weekCount,
      'weeks' => $weeks,
      'projects' => $content['projects'],
      'reflections' => $content['reflections'],
      'pageTitle' => "{$site['student_id']}｜{$site['title']}",
      'pageDescription' => sprintf(
        '學號 %s，本學期 %d 週課程學習成果、專題作品與學習反思總覽。',
        $site['student_id'],
        $weekCount
      ),
      'showSectionNav' => true,
    ]);
  },
];
