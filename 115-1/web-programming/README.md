# Web Programming - 網頁程式設計

網頁程式設計課程相關資料，包含課程筆記、課堂實作、作業與專題。

## Course Information

- **Course:** 網頁程式設計
- **Academic Year:** 115
- **Semester:** 1
- **Year:** 二年級
- **Department:** 資訊管理系

## 部署

依課程要求，使用 **InfinityFree** 作為網站部署平台，透過 **GitHub Actions** (FTP) 自動化部署。

推送至 `main` 分支且本目錄有變動時會觸發
[`.github/workflows/ftp-deploy-web-programming.yml`](../../.github/workflows/ftp-deploy-web-programming.yml)，

- `FTP_SERVER`、`FTP_USERNAME`、`FTP_PASSWORD`

## 開發

```txt
src/       PHP 原始碼（路由、版面、資料、建置腳本）
src/app/   路由：資料夾路徑即路由，page.php 標記一個路由
src/client/ React 元件原始碼
public/    網站原始碼（.htaccess、robots.txt、assets/）
dist/      pnpm run build 的輸出，不進版控
```

```sh
cd 115-1/web-programming
composer install
pnpm install
pnpm run dev    # 建置 + 啟動本機伺服器 http://localhost:9000
pnpm run build  # 只建置
pnpm run lint   # HTML + CSS + TypeScript 檢查
```
