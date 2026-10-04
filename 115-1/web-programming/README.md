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
public/api/merge.php    被 .htaccess 轉送過來、把切割過的大檔案合併串流回去的端點
```

部署端點本身（`scripts/deploy-endpoint.php`）刻意**不**放在 `public/` 底下——它會動到檔案系統、需要 token 驗證，跟一般「請求期算點東西回傳 JSON」的端點風險等級不同，所以不讓它跟著 `next build` 進 `out/`，也不讓它出現在任何可預測的網址上。只有 `scripts/deploy.sh` 知道它實際上傳到哪個（隨機）檔名。詳見下方「部署」。

`next build` 會把整個 `public/` 原樣複製進 `out/`，所以 `public/api/*.php` 會跟著一起進 `out/api/`——不需要額外的建置步驟，InfinityFree 本身就會執行 `.php`。

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

依課程要求，使用 **InfinityFree** 作為網站部署平台，透過 **GitHub Actions** 自動化部署，`scripts/deploy.sh` 執行實際的部署動作。

推送至 `main` 分支且本目錄有變動時會觸發
[`.github/workflows/ftp-deploy-web-programming.yml`](../../.github/workflows/ftp-deploy-web-programming.yml)。

### 部署機制

`scripts/deploy.sh` 分三步：

1. **FTP** 上傳控制層：部署端點本身（本機原始檔是 `scripts/deploy-endpoint.php`，但實際上傳到伺服器時用**每次執行都重新產生的隨機檔名**，不是固定的 `deploy.php`，也不放在 `public/` 底下、不會跟著 `next build` 進 `out/`）、以及 `.deploy-state/.htaccess`。**不會**動到 `.deploy-state/secret.php`——那個檔案必須先手動用 FTP 放上去一次（見下方「一次性設定」），deploy.sh 永遠不會上傳它。`public/api/merge.php`、`public/api/health.php` 這些真正要公開的端點，走下面第 2 步跟其他網站檔案一起處理，不特別經過 FTP。
2. **只上傳有變更的檔案**：先用 `action=manifest` 向端點要回它現有的「路徑 → sha256」manifest，跟 `out/` 重新算一份本機 manifest 做差異比對（跟舊版 `ftp-deploy.sh` 的 diff 邏輯一樣，只是換成走這個 HTTP 端點而不是直接 FTP）。只有內容真的變了或新增的檔案會被打包成 zip、依 `CHUNK_SIZE_BYTES`（預設 4MiB）切成多段上傳；本機已經不存在的檔案會以明確的路徑清單告訴端點去刪，而不是整包覆蓋。完全沒有變更時什麼都不會上傳。
3. **部署端點自我消滅**：`action=finalize` / `action=prune` 處理完最後一件事就是 `unlink(__FILE__)`，把自己從伺服器上刪掉——這是在同一個 request 裡做的，沒有額外的網路來回，是主要的移除路徑。`deploy.sh` 自己也有一個 cleanup trap，在腳本結束時（不管成功還是失敗）額外檢查一次：如果端點還沒自我消滅（例如某個分段上傳失敗、連線中斷、或整次部署根本沒有任何變更，從未呼叫到 finalize/prune），就改用 FTP 把它刪掉，當作備援。兩層加起來的效果是：這支腳本結束後，伺服器上**不會留下任何一個能被打的部署端點**——每次執行都是全新隨機檔名，用完就消失，不像舊設計那樣是一個「名字固定、只是不好猜」的常駐端點。

**殘餘風險老實說**：如果連 FTP 備援清理那一步都沒機會跑（例如執行機器直接斷電、CI runner 被強制終止），這次用的隨機檔名就會變成孤兒檔案留在伺服器上，且不會出現在任何清單裡——沒有紀錄「上次用的是哪個名字」，下次執行也不知道要去刪它。這種情況下仍然有 `X-Deploy-Token` 擋著（`hash_equals` 常數時間比對），不是直接可被利用的漏洞，只是多了一個「存在但閒置」的端點檔案，需要你自己定期用 FTP 檢查 `/htdocs/api/` 底下有沒有不該在的 `deploy-*.php`。

**伺服器端自動切割大檔案**：解壓（或單純刪除）後，任何單檔超過 `SPLIT_THRESHOLD_BYTES`（目前 1 MiB，在 `scripts/deploy-endpoint.php` 定義）會被自動切成 `<檔案>.chunks/part-0000`、`part-0001`... 加上一份 `<檔案>.split.json` manifest，原始的大檔案本身則被刪除。`public/.htaccess` 有一條 rewrite 規則：請求的路徑在硬碟上找不到、但旁邊有對應的 `.split.json` 時，轉送到 `api/merge.php?path=...`，由它依序讀回所有分段、原樣串流給使用者（支援 `Range` 請求），整個切割過程對使用者端完全透明。

### 一次性設定（新環境／token 輪替時要做）

1. 產生 token：`openssl rand -hex 32`。
2. 複製 `scripts/.deploy-state/secret.php.example` 成 `secret.php`（此檔案已加入 `.gitignore`，不會被提交），把 token 填進去。
3. 用 FTP 手動把這個 `secret.php` 上傳到 InfinityFree 的 `/htdocs/api/.deploy-state/secret.php`（deploy.sh 不會做這件事——這是刻意的，secret 不該經過任何自動化流程）。
4. 在 GitHub repo 設定以下 Actions secrets：
   - `FTP_SERVER`、`FTP_USERNAME`、`FTP_PASSWORD`
   - `DEPLOY_TOKEN`：跟步驟 2 填進 `secret.php` 的值完全一樣，deploy.sh 用它當 `X-Deploy-Token`（端點檔名本身跟 token 無關，每次執行都是全新隨機值）
   - `SITE_URL`：網站的 HTTPS 網址（例如 `https://xxx.infinityfreeapp.com`），deploy.sh 用它組出 POST 的目標網址

**本機需要的工具**：`lftp`、`curl`、`jq`、`zip`、`sha256sum`、`openssl`（CI 的 ubuntu-latest runner 通常都有，`lftp`、`jq` 除外需要額外裝）。

Token 輪替時重複步驟 1-4 即可；跟端點檔名的隨機性無關（本來就每次都換），單純是換掉驗證用的 secret。

## 開發

```txt
src/app/        Next.js App Router 路由：資料夾路徑即路由，page.tsx 標記一個路由
src/components/ 共用 React 元件（導覽列、頁尾、上下週切換…）
src/data/       頁面內容資料（TypeScript 模組）
public/         靜態資源與網站原始檔（.htaccess、robots.txt），會原樣複製到 out/
public/api/     PHP API 端點（純 PHP，不用框架），同樣會複製到 out/api/
public/iphone-duo/  Week 3 demo（/demo/iphone-duo/）用的素材，見下方「Week 3 Demo」
scripts/prepare-iphone-duo-assets.py  重新產生 public/iphone-duo/ 素材用，見下方「Week 3 Demo」
scripts/deploy.sh             部署用，見上方「部署」
scripts/deploy-endpoint.php   部署端點原始檔，故意不放 public/，見上方「部署」
scripts/.deploy-state/        部署端點狀態的本機範本（.htaccess、secret.php.example），見上方「部署」
out/            pnpm run build 的輸出，不進版控
```

```sh
cd 115-1/web-programming
pnpm install
pnpm run dev    # 啟動本機開發伺服器 http://localhost:9000
pnpm run build  # 建置成靜態網站到 out/
pnpm run lint   # CSS + TypeScript 檢查
```
