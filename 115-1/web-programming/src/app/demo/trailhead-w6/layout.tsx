import type { Metadata } from "next";
import "bootstrap-icons/font/bootstrap-icons.css";
import "aos/dist/aos.css";
import "swiper/css";
import "swiper/css/pagination";
import "leaflet/dist/leaflet.css";
import "./styles.scss";

export const metadata: Metadata = {
  title: "山行 Trailhead｜線上報名（Week 6）",
  description:
    "Week 6 課程練習：在 Week 5 的高山步道指南上加入 Bootstrap 表單——路線篩選、三步驟報名表單與即時預覽。",
};

/**
 * Week 6：從 /demo/trailhead/（Week 5）整份複製過來再加上表單，兩週各自獨立。
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
