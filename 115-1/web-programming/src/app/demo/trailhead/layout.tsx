import type { Metadata } from "next";
import "bootstrap-icons/font/bootstrap-icons.css";
import "aos/dist/aos.css";
import "swiper/css";
import "swiper/css/pagination";
import "leaflet/dist/leaflet.css";
import "./styles.scss";

export const metadata: Metadata = {
  title: "山行 Trailhead｜台灣高山步道指南",
  description:
    "Week 5 課程練習：用 Bootstrap、AOS、SweetAlert2、Chart.js，加上 Swiper、Leaflet、Typed.js 做的高山步道指南。",
};

/**
 * 跟 /demo/iphone-duo/ 一樣，這條路由不套用課程網站的 Header/Footer/globals.css，
 * styles.scss 自己用 Sass 變數重新編譯一份 Bootstrap（森林綠的淺色主題）。
 */
export default function TrailheadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@700;900&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
