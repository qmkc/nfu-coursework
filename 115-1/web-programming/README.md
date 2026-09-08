# Web Programming - 網頁程式設計

網頁程式設計課程相關資料，包含課程筆記、課堂實作、作業與專題。

## Course Information

- **Course:** 網頁程式設計
- **Academic Year:** 115
- **Semester:** 1
- **Year:** 二年級
- **Department:** 資訊管理系

## 部署

依課程要求，使用 **InfinityFree** 作為網站部署平台。

本專案使用 **GitHub Actions** (FTP) 自動化部署至 InfinityFree。

> InfinityFree 為課程指定的部署平台；GitHub 與 GitHub Actions 為本專案自行選擇的開發與部署方式。

推送至 `main` 分支且 `115-1/web-programming/code/` 目錄有變動時，會觸發 [`.github/workflows/ftp-deploy-web-programming.yml`](../../.github/workflows/ftp-deploy-web-programming.yml) 自動將該目錄同步至 InfinityFree 的 `/htdocs/`。也可以在 Actions 頁面手動觸發（workflow_dispatch）。

使用前需在 repository 的 **Settings → Secrets and variables → Actions** 設定以下 secrets：

- `FTP_SERVER`：InfinityFree 的 FTP 主機位址
- `FTP_USERNAME`：FTP 帳號
- `FTP_PASSWORD`：FTP 密碼

## 開發

`code/` 為實際部署到 InfinityFree 的網站原始碼

### 安裝與 Lint

```bash
cd 115-1/web-programming
pnpm install
pnpm run lint        # HTML (htmlhint) + CSS (stylelint)
pnpm run lint:html
pnpm run lint:css
```

推送到 `main` 或發 PR 且變動落在 `115-1/web-programming/**` 時，會觸發 [`.github/workflows/lint-web-programming.yml`](../../.github/workflows/lint-web-programming.yml) 自動執行上述 lint。
