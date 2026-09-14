<?php

return [
  'static' => true,

  'render' => function (array $params, array $app): string {
    ['blade' => $blade, 'site' => $site, 'about' => $about, 'currentYear' => $currentYear] = $app;

    return $blade->render('about.page', [
      'site' => $site,
      'currentYear' => $currentYear,
      'about' => $about,
      'pageTitle' => sprintf('關於我｜%s %s', $site['student_id'], $site['title']),
      'pageDescription' => sprintf('%s 的自我介紹、技能與作品連結。', $about['name']),
      'showSectionNav' => false,
    ]);
  },
];
