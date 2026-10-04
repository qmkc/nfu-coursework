import type { Metadata, Viewport } from "next";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: `${site.studentId}｜${site.title}`,
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎓</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// 在任何東西畫出來之前，同步把使用者手動選過的主題補回 <html data-theme>，
// 避免「先閃一下系統預設顏色，JS 載完才跳成使用者選的深色」。
// 沒存過（還沒按過切換鈕）就什麼都不做，交給 globals.css 的 prefers-color-scheme 處理。
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
