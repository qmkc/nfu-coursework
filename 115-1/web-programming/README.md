# Web Programming - 網頁程式設計

網頁程式設計課程相關資料，包含課程筆記、課堂實作、作業與專題。

## Course Information

- **Course:** 網頁程式設計
- **Academic Year:** 115
- **Semester:** 1
- **Year:** 二年級
- **Department:** 資訊管理系

## 技術架構

- **Next.js**（App Router）+ TypeScript，以 `output: 'export'` 建置期產生純靜態網站（`out/`）
- **Bootstrap 5** 作為畫面元件 / 樣式基礎，再疊加 `src/app/globals.css` 做視覺細節調整
- 全站所有頁面（含「原始碼瀏覽頁」`/source/{slug}/`、「每週成果頁」`/weekly/{id}/`）都在 `next build` 期間用 `generateStaticParams` 窮舉產生，不需要後端伺服器才能顯示
- 如果有「請求期才能決定內容」的功能，用 **純 PHP**（不含框架）寫成 `public/api/` 底下的獨立端點，詳見下方「PHP API」
- `/demo/iphone-duo/`（Week 3）是例外：自己一整套深色風格、重新編譯過的 Bootstrap（Sass）、Three.js 3D 模型、GSAP 動畫，跟其他頁面共用的 `globals.css`／淺深色主題完全分開，詳見下方「Week 3 Demo」

## PHP API

`public/api/` 放請求期才需要後端處理的端點，純 PHP、不用框架：

```txt
public/api/health.php   範例端點，回傳 { "ok": true, "time": "..." } 驗證部署管線
```

`next build` 會把整個 `public/` 原樣複製進 `out/`，所以 `public/api/*.php` 會跟著一起進 `out/api/`，`scripts/ftp-deploy.sh` 再把 `out/` 整包同步到 InfinityFree——不需要額外的建置或部署步驟，InfinityFree 本身就會執行 `.php`。

新增端點：在 `public/api/` 底下新增 `.php` 檔即可；前端直接用相對路徑 `fetch('/api/xxx.php')` 呼叫（同網域，不需要處理 CORS）。

**本機開發注意**：`pnpm run dev` 跑的是 Next.js 的開發伺服器（Node），不會執行 `.php`。要在本機測 PHP 端點，先 `pnpm run build`，再另外起一個 PHP 內建伺服器指到建置輸出：

```sh
php -S localhost:8000 -t out
```

## Week 3 Demo（`/demo/iphone-duo/`）

Week 3（Bootstrap 常用元件）的成果原本是獨立的 Vite 練習專案，後來整支併進這個 Next.js app 本身，變成 `src/app/demo/iphone-duo/` 底下一條真正的路由——不再是另外 build、再把靜態檔案複製進來的做法，原本的獨立專案也已經刪除：

```txt
src/app/demo/iphone-duo/
  layout.tsx        這條路由自己的 metadata、Google Fonts、styles.scss / bootstrap-icons 匯入
  page.tsx           畫面（從原始 index.html 轉成 JSX，id/class 保持原樣）
  styles.scss         深色玻璃擬態風格，自己整套用 Sass 變數重新編譯一次 Bootstrap
  scene.ts, ui.ts     Three.js 3D 模型／螢幕內容，原封不動搬過來（純函式、不依賴 DOM 外部狀態）
  initDuoPage.ts      main.ts 的邏輯，包成 init()/cleanup() 一對
  DuoPageScript.tsx   'use client' 元件，mount 時跑 initDuoPage()，unmount 時跑它回傳的 cleanup
```

這條路由刻意跟 `(site)` 那組（首頁／關於我／原始碼瀏覽／每週成果）完全分開：各自的 `layout.tsx` 各自 import 自己的 CSS（這裡是整套重新編譯過的深色 Bootstrap，`(site)` 是淺色/深色雙主題的 `globals.css`），靠 Next.js 的 per-route code splitting 互不汙染，不會同時載入兩份 Bootstrap 或讓這裡的深色樣式漏到課程網站本體。

**為什麼需要 init()/cleanup()**：這段邏輯原本是傳統「整頁載入一次、使用者離開就整頁卸載」網站的頂層腳本，GSAP 的 ScrollSmoother／ScrollTrigger、Three.js 場景從來不需要自己清理——瀏覽器換頁時全部一起回收。搬進這個 SPA 之後，從這條路由點掉／導去別的路由並不會重新整理頁面，所以 `initDuoPage.ts` 把整段邏輯包成一個函式，回傳一個 cleanup：GSAP 動畫/ScrollTrigger 靠 `gsap.context()` 一次全部 revert，3D 場景呼叫它自己的 `dispose()`，字體就緒／模型載入完成兩段非同步流程則用 `cancelled` 旗標擋住——萬一使用者在這兩段跑完「之前」就已經離開這個路由，回來的結果不會被接住、也不會留下孤兒的 GSAP tween 或 WebGL context。

⚠️ `public/iphone-duo/models/`、`public/iphone-duo/ui/` 是 `scripts/prepare-iphone-duo-assets.py` 即時從 apple.com 抓的官方素材，原始獨立專案的 `.gitignore` 當初自己註記過「not ours to redistribute」。這裡選擇照樣把這些素材一起公開部署，是有意識接受這個風險的決定，純課程練習、非商業用途——不是疏忽忘記排除。`public/iphone-duo/img/` 則是另一批不經這支腳本處理的實機照片，原樣保留即可。

**素材要重新抓**（例如 Apple 更新了官網上的模型）不會自動發生，要手動重跑，直接寫進 `public/iphone-duo/`：

```sh
python3 -m venv .venv && . .venv/bin/activate
pip install -r scripts/requirements-iphone-duo-assets.txt
python3 scripts/prepare-iphone-duo-assets.py
```

## 部署

依課程要求，使用 **InfinityFree** 作為網站部署平台，透過 **GitHub Actions** (FTP) 自動化部署。

推送至 `main` 分支且本目錄有變動時會觸發
[`.github/workflows/ftp-deploy-web-programming.yml`](../../.github/workflows/ftp-deploy-web-programming.yml)，
建置完成後以差異同步（manifest + sha256）方式將 `out/` 上傳到 InfinityFree 的 `/htdocs`。

- `FTP_SERVER`、`FTP_USERNAME`、`FTP_PASSWORD`

## 開發

```txt
src/app/        Next.js App Router 路由：資料夾路徑即路由，page.tsx 標記一個路由
src/components/ 共用 React 元件（導覽列、頁尾、上下週切換…）
src/data/       頁面內容資料（TypeScript 模組）
public/         靜態資源與網站原始檔（.htaccess、robots.txt），會原樣複製到 out/
public/api/     PHP API 端點（純 PHP，不用框架），同樣會複製到 out/api/
public/iphone-duo/  Week 3 demo（/demo/iphone-duo/）用的素材，見下方「Week 3 Demo」
scripts/prepare-iphone-duo-assets.py  重新產生 public/iphone-duo/ 素材用，見下方「Week 3 Demo」
out/            pnpm run build 的輸出，不進版控
```

```sh
cd 115-1/web-programming
pnpm install
pnpm run dev    # 啟動本機開發伺服器 http://localhost:9000
pnpm run build  # 建置成靜態網站到 out/
pnpm run lint   # CSS + TypeScript 檢查
```
