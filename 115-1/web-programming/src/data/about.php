<?php

// About Me 頁面內容，資料取自 GitHub 個人檔案（github.com/qmkc）與個人網站（qmkc.dev）的公開資訊。
return [
  'name' => 'qmkc（猴貓）',
  'tagline' => 'A monkey cat that shuttles in the sea of code．一隻穿梭於程式海的猴貓。',
  'bio' => '資訊管理系的學生開發者，平常游走在全端開發、資料庫與網路架構之間，偶爾也玩玩硬體小專案。目前定居台南。',
  'location' => 'Tainan, Taiwan',
  'website' => 'https://qmkc.dev',
  'email' => 'hi@qmkc.dev',
  'links' => [
    ['label' => 'GitHub', 'url' => 'https://github.com/qmkc'],
    ['label' => '個人網站', 'url' => 'https://qmkc.dev'],
    ['label' => 'Discord', 'url' => 'https://discord.com/invite/rCZeuaucjf'],
    ['label' => 'X（Twitter）', 'url' => 'https://x.com/Bod31444120'],
  ],
  'skills' => [
    '語言' => ['TypeScript', 'JavaScript', 'Go', 'Python', 'HTML / CSS', 'SQL'],
    '框架' => ['Svelte', 'Vue', 'React', 'Node.js', 'Express', 'Tailwind CSS'],
    '工具' => ['Vite', 'Git / GitHub', 'Docker', 'Linux', 'Figma', 'GitHub Actions'],
  ],
  'projects' => [
    [
      'name' => 'discord-py-cord-template',
      'description' => 'py-cord 的 Discord Bot 骨架模板。',
      'url' => 'https://github.com/qmkc/discord-py-cord-template',
    ],
    [
      'name' => 'Unlimited-Trade',
      'description' => '自動化、穩定的無限交易模組。',
      'url' => 'https://github.com/qmkc/Unlimited-Trade',
    ],
    [
      'name' => 'notify-closed-school',
      'description' => '透過 Line / Discord 推播停班停課通知的服務。',
      'url' => 'https://github.com/qmkc/notify-closed-school',
    ],
    [
      'name' => 'vscode-gettext',
      'description' => 'VS Code 的 Gettext 語言支援擴充套件。',
      'url' => 'https://github.com/qmkc/vscode-gettext',
    ],
    [
      'name' => 'MKHC595',
      'description' => '控制 74HC595 位移暫存器的 Arduino 函式庫。',
      'url' => 'https://github.com/qmkc/MKHC595',
    ],
    [
      'name' => 'MKPin',
      'description' => '透過手動暫存器位址操作，強化腳位控制功能。',
      'url' => 'https://github.com/qmkc/MKPin',
    ],
  ],
];
