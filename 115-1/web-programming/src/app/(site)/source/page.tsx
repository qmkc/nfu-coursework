import type { Metadata } from "next";
import Link from "next/link";

import { site } from "@/data/site";
import { sourceFiles } from "@/data/source-files";

export const metadata: Metadata = {
  title: `原始碼瀏覽｜${site.studentId} ${site.title}`,
  description: "瀏覽本網站幾個關鍵頁面與腳本的原始碼內容。",
};

export default function SourceIndexPage() {
  return (
    <>
      <div className="week-hero">
        <div className="crumb">
          <Link href="/">首頁</Link> / 原始碼瀏覽
        </div>
        <h1>原始碼瀏覽</h1>
        <p className="theme">
          收錄本站幾個關鍵頁面與腳本的原始碼，點進去可以看實際的程式碼內容。
        </p>
      </div>

      <div className="week-list">
        {Object.entries(sourceFiles).map(([slug, file], index) => (
          <Link
            className="week-row"
            href={`/source/${slug}/`}
            key={slug}
            data-reveal
            style={{ '--reveal-delay': `${index * 50}ms` } as React.CSSProperties}
          >
            <span className="wn">{file.lang.toUpperCase()}</span>
            <span className="wt">{file.label}</span>
            <span className="ws">{file.path}</span>
            <span className="arrow">→</span>
          </Link>
        ))}
      </div>
    </>
  );
}
