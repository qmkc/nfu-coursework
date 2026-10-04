import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { site } from "@/data/site";

// 這支是 next build 產生 out/404.html 用的全站共用 404 頁，不在 (site) route group
// 底下（那裡面的 not-found 只會接住 (site) 範圍內的 notFound()），所以 Header/Footer
// 跟樣式表自己 import，不靠 layout 帶進來。
export default function NotFound() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <Header />
      <div className="container">
        <main id="main-content">
          <div className="week-hero">
            <div className="crumb">
              <Link href="/">首頁</Link> / 404
            </div>
            <h1>找不到這個頁面</h1>
            <p className="theme">
              網址可能打錯了，或是頁面還沒做好，回首頁看看吧。
            </p>
          </div>
          <div className="week-nav justify-content-start">
            <Link className="btn btn-home" href="/">
              返回首頁
            </Link>
          </div>
        </main>
        <Footer
          currentYear={currentYear}
          studentId={site.studentId}
          githubUser={site.githubUser}
        />
      </div>
    </>
  );
}
