<?php

// 「原始碼瀏覽頁」可顯示的檔案白名單。
// key 為網址代稱（slug），path 為相對於本目錄（115-1/web-programming）的檔案路徑，
// 只有列在這裡的檔案才能被讀取顯示，避免任意檔案讀取。
return [
  'about-page' => [
    'label' => 'About Me 頁面路由',
    'path' => 'src/app/about/page.php',
    'lang' => 'php',
  ],
  'about-blade' => [
    'label' => 'About Me 頁面樣板',
    'path' => 'src/app/about/page.blade.php',
    'lang' => 'blade',
  ],
  'source-index' => [
    'label' => '原始碼瀏覽頁（列表）',
    'path' => 'src/app/source/page.php',
    'lang' => 'php',
  ],
  'source-detail' => [
    'label' => '原始碼瀏覽頁（單一檔案）',
    'path' => 'src/app/source/[slug]/page.php',
    'lang' => 'php',
  ],
  'weekly-page' => [
    'label' => '每週成果頁路由',
    'path' => 'src/app/weekly/[id=01-18]/page.php',
    'lang' => 'php',
  ],
  'ftp-deploy' => [
    'label' => 'FTP 自動化部署腳本（Week 1）',
    'path' => 'scripts/ftp-deploy.sh',
    'lang' => 'bash',
  ],
];
