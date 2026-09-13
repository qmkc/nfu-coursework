# src/client/

React 元件原始碼，跟 `src/app/`（PHP 路由）、`src/layouts/`（Blade 版面）平行。

`vite.config.js`（專案根目錄）把每個進入點打包成 `dist/assets/js/` 底下同名的
`.js`，`pnpm run build` 會先跑 `php src/compile.php` 再跑 `vite build`，
Blade 樣板用一般 `<script type="module" src="/assets/js/xxx.js">` 載入。

TypeScript（`.tsx`），型別檢查用 `pnpm run lint:ts`（`tsconfig.json` 只
`include` 這個目錄）。UI 元件庫允許用 MUI（`@mui/material`、
`@mui/icons-material`）等第三方套件，不用堅持手刻。

## nav-menu.tsx

首頁導覽列的手機版選單，掛載點是 `src/layouts/main.blade.php` 裡的
`#nav-menu-root`。桌面（`md` 以上）用一般 `<ul class="navbar-nav">` 直接
顯示連結（沿用 Bootstrap 的 `d-none d-md-flex` 斷點類別，跟純 CSS 排版沒
兩樣）；手機版是 MUI 的 `IconButton` 開 `Drawer`。連結本身沿用站台自己的
`.nav-link`／`.btn-gh` class（`public/assets/css/style.css`），Drawer 內容
加了 `.site-nav` class 讓那些選取器（`.site-nav .nav-link` 等）在 Drawer
被 portal 到 `<body>` 外面時仍然吃得到樣式。沒有引入 MUI 的
`CssBaseline`／`ThemeProvider`，避免影響網站其他部分的樣式。
