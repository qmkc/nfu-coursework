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
      // 'filename' => 'scripts/ftp-deploy.sh',
      //       'snippet' => <<<'CODE'
// FTP_REMOTE_BASE="/htdocs"
// MANIFEST_FILENAME=".deploy-manifest"

      // error_exit() {
//   echo "Error: $*" >&2
//   exit 1
// }

      // # 透過 manifest 比對本機與遠端檔案，
// # 只上傳有變動的檔案、刪除已不存在的檔案
// CODE,
      'snippet' => 'https://github.com/qmkc/nfu-coursework/blob/main/115-1/web-programming/scripts/ftp-deploy.sh',
    ],
    'reflection' => '這週的重點不是寫網頁本身，而是把「部署」這件事自動化。一開始手動用 FTP 軟體上傳檔案，後來發現每次改一行程式碼就要重新上傳整個資料夾很沒效率，於是改用 GitHub Actions 搭配 lftp 做差異同步。過程中遇到最多問題的是路徑與權限驗證：一旦 manifest 或路徑判斷寫錯，就有可能誤刪不該刪除的檔案，所以後續又花了不少時間強化驗證邏輯（見 460e0a5、bbf39c5、b610099 幾次提交）。這讓我體會到自動化部署腳本雖然一次寫好可以省下很多重複工作，但也要特別小心邊界情況，寫測試或至少手動驗證過一輪再上線。',
  ],
];
