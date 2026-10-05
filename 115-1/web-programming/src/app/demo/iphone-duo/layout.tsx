import type { Metadata } from "next";
import "bootstrap-icons/font/bootstrap-icons.css";
import "aos/dist/aos.css";
import "./styles.scss";
import { DemoWatermark } from "./DemoWatermark";

export const metadata: Metadata = {
  title: "iPhone Duo | 摺疊，即是全新格局",
  description:
    "iPhone Duo — 7.6 吋摺疊螢幕，鈦金屬摺疊機身，A20 Pro 晶片。史上最大的 iPhone 螢幕，展開即見。",
};

/**
 * 這支跟 (site) 底下的 layout 完全獨立：不套用課程網站的 Header/Footer/
 * globals.css，styles.scss 自己整套重新編譯 Bootstrap（深色玻璃擬態風格），
 * 兩邊的樣式表靠 Next.js per-route code splitting 各管各的，不會互相汙染。
 */
export default function IphoneDuoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;800&display=swap"
        rel="stylesheet"
      />
      {/*
        The 3D model is the single largest asset (~3.5MB) and otherwise only
        starts downloading once the page script runs — after the JS bundle
        itself has downloaded and parsed. Preloading it here lets the browser
        fetch it in parallel with that bundle instead of after it.
      */}
      <link
        rel="preload"
        href="/iphone-duo/models/iPhone_Duo_Render.usdc"
        as="fetch"
        crossOrigin="anonymous"
      />
      {children}
      <DemoWatermark />
    </>
  );
}
