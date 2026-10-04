import 'bootstrap/dist/css/bootstrap.min.css';
import '../globals.css';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { ScrollReveal } from '@/components/ScrollReveal';
import { site } from '@/data/site';

const currentYear = new Date().getFullYear();

/**
 * 這個 route group 包的是「課程學習成果展示」本體（首頁、關於我、原始碼瀏覽、每週成果）。
 * Bootstrap CSS、globals.css、導覽列、頁尾都收在這裡，不放進 root layout——
 * 這樣 /demo/iphone-duo/（Week 3 的另一個獨立作品，自己的深色風格、自己整套重新編譯過的
 * Bootstrap）才不會被這裡的樣式／導覽列污染到，兩邊的 CSS 靠 Next.js 的 per-route code
 * splitting 各管各的。
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollReveal />
      <Header />
      <div className="container">
        <main id="main-content">{children}</main>
        <Footer currentYear={currentYear} studentId={site.studentId} githubUser={site.githubUser} />
      </div>
    </>
  );
}
