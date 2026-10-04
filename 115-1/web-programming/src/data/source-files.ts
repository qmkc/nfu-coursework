// 「原始碼瀏覽頁」可顯示的檔案白名單。
// key 為網址代稱（slug），path 為相對於本目錄（115-1/web-programming）的檔案路徑，
// 只有列在這裡的檔案才能被讀取顯示，避免任意檔案讀取。
// 下面列的頁面路由全部在「建置期」（next build）就讀檔轉成靜態 HTML；
// public/api/ 底下的 PHP 檔才是真正的請求期後端，部署後由 InfinityFree 執行。
export interface SourceFile {
  label: string;
  path: string;
  lang: string;
}

export const sourceFiles: Record<string, SourceFile> = {
  "about-page": {
    label: "About Me 頁面路由",
    path: "src/app/about/page.tsx",
    lang: "tsx",
  },
  "source-index": {
    label: "原始碼瀏覽頁（列表）",
    path: "src/app/source/page.tsx",
    lang: "tsx",
  },
  "source-detail": {
    label: "原始碼瀏覽頁（單一檔案）",
    path: "src/app/source/[slug]/page.tsx",
    lang: "tsx",
  },
  "weekly-page": {
    label: "每週成果頁路由",
    path: "src/app/weekly/[id]/page.tsx",
    lang: "tsx",
  },
  "ftp-deploy": {
    label: "FTP 自動化部署腳本（Week 1）",
    path: "scripts/ftp-deploy.sh",
    lang: "bash",
  },
  "api-health": {
    label: "PHP API 範例（健康檢查）",
    path: "public/api/health.php",
    lang: "php",
  },
};
