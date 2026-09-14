<?php

return [
  1 => [
    'objectives' => [
      '建立本學期課程用的 GitHub Repository，規劃資料夾與版本控制流程',
      '認識 InfinityFree 免費虛擬主機，並申請網站空間',
      '使用 GitHub Actions 建立 CI/CD，推送至 main 分支時自動建置並部署',
      '撰寫並強化 FTP 部署腳本（scripts/ftp-deploy.sh），加入路徑與 manifest 驗證邏輯',
    ],
    'showcase' => '完成後，只要將程式碼推送到 main 分支，GitHub Actions 就會自動安裝 Composer / pnpm 依賴、執行建置，並透過 lftp 以 mirror 模式，依 .deploy-manifest 差異同步到 InfinityFree 的 /htdocs 目錄，全程不需要手動上傳檔案。',
    'links' => [
      ['label' => '原始碼（GitHub）', 'url' => 'https://github.com/qmkc/nfu-coursework/tree/main/115-1/web-programming'],
    ],
    'code' => [
      'lang' => 'md',
      'snippet' => 'https://github.com/qmkc/nfu-coursework/blob/main/115-1/web-programming/scripts/ftp-deploy.sh',
    ],
    'reflection' => '這週的重點不是寫網頁本身，而是把「部署」這件事自動化。一開始手動用 FTP 軟體上傳檔案，後來發現每次改一行程式碼就要重新上傳整個資料夾很沒效率，於是改用 GitHub Actions 搭配 lftp 做差異同步。過程中遇到最多問題的是路徑與權限驗證：一旦 manifest 或路徑判斷寫錯，就有可能誤刪不該刪除的檔案，所以後續又花了不少時間強化驗證邏輯（見 460e0a5、bbf39c5、b610099 幾次提交）。這讓我體會到自動化部署腳本雖然一次寫好可以省下很多重複工作，但也要特別小心邊界情況，寫測試或至少手動驗證過一輪再上線。',
  ],

  2 => [
    'objectives' => [
      '建立 About Me 頁面，整理個人資訊、技能與 GitHub 作品連結',
      '規劃一份「可公開瀏覽的原始碼白名單」資料檔，決定哪些檔案可以被看到',
      '建立獨立的原始碼瀏覽頁（列表 + 單一檔案），把網站自己的程式碼攤開來給人看',
      '學習這個專案「靜態頁面 build 期產生、找不到才交給 PHP 即時渲染」的路由設計，並實際寫一條動態路由',
    ],
    'showcase' => '新增了 /about/ 個人介紹頁，以及 /source/ 原始碼瀏覽頁：/source/ 是清單，點進去 /source/{slug}/ 才會即時讀檔顯示內容。清單只列出白名單允許的檔案，並在讀檔前用 realpath 確認路徑仍在專案目錄內，避免任意檔案讀取。',
    'links' => [
      ['label' => 'About Me 頁面', 'url' => '/about/'],
      ['label' => '原始碼瀏覽頁', 'url' => '/source/'],
    ],
    'code' => [
      'lang' => 'php',
      'filename' => 'src/app/source/[slug]/page.php',
      'snippet' => <<<'CODE'
$code = null;
if ($file !== null) {
  $projectRoot = realpath($root);
  $fullPath = realpath("{$root}/{$file['path']}");

  // 只有白名單裡的檔案、且解析後路徑仍在專案目錄內，才允許讀取
  if ($projectRoot !== false && $fullPath !== false && is_file($fullPath) && str_starts_with($fullPath, $projectRoot)) {
    $code = file_get_contents($fullPath);
  } else {
    $file = null;
  }
}
CODE,
    ],
    'reflection' => '這週學到的重點其實是「不要相信網址參數」。一開始想得很簡單：/source/{slug}/ 拿到 slug 就直接讀對應檔案，後來想到如果之後改成讓使用者自己輸入檔名，就可能被拿去讀專案目錄外的檔案（路徑穿越）。所以最後改成先查一份固定的白名單（source-files.php），只有清單裡登記過的檔案才讀得到，讀之前還多做一次 realpath 檢查，確認真正解析出來的路徑仍在專案資料夾裡面。另外也第一次在這個專案裡寫「動態路由」（static => false），跟前面幾個 build 期就決定好內容的靜態頁面不同，這條路由要等使用者實際請求時才由 public/router.php 即時執行 PHP 產生內容，讓我更清楚這個專案「能靜態就靜態、不能才動態」的設計想法。',
  ],
];
