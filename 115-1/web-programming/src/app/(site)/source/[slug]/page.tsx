import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { highlightCode } from "@/lib/highlight";
import { sourceFiles } from "@/data/source-files";

export function generateStaticParams() {
  return Object.keys(sourceFiles).map((slug) => ({ slug }));
}

// 白名單裡沒有的 slug 一律在建置期就不會產生頁面（真正的 404），
// 不像舊版 PHP 版本是在請求期才判斷「有沒有這個 slug」。
export const dynamicParams = false;

function readSourceFile(slug: string): string | null {
  const file = sourceFiles[slug];
  if (!file) {
    return null;
  }

  // 只允許讀取白名單（source-files.ts）裡列出的檔案，
  // 並確認解析後的路徑仍在專案目錄內，避免路徑穿越讀到不該讀的檔案。
  // 這段檢查只在「建置期」（next build）跑一次，而不是像舊版 PHP 那樣在請求期即時檢查。
  const projectRoot = path.resolve(process.cwd());
  const fullPath = path.resolve(projectRoot, file.path);

  if (
    !(
      fullPath === projectRoot || fullPath.startsWith(projectRoot + path.sep)
    ) ||
    !fs.existsSync(fullPath) ||
    !fs.statSync(fullPath).isFile()
  ) {
    return null;
  }

  return fs.readFileSync(fullPath, "utf-8");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const file = sourceFiles[slug] ?? null;

  return {
    title: file ? `${file.label}｜原始碼瀏覽` : "找不到檔案｜原始碼瀏覽",
    description: file
      ? `${file.label} 的原始碼內容。`
      : "找不到這個原始碼檔案。",
  };
}

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const file = sourceFiles[slug] ?? null;
  const code = file ? readSourceFile(slug) : null;
  const highlighted =
    file && code !== null ? await highlightCode(code, file.lang) : null;

  return (
    <>
      <div className="week-hero">
        <div className="crumb">
          <Link href="/">首頁</Link> / <Link href="/source/">原始碼瀏覽</Link> /{" "}
          {file?.label ?? slug}
        </div>
        <h1>{file?.label ?? "找不到檔案"}</h1>
        {file !== null && <p className="theme">{file.path}</p>}
      </div>

      {file !== null && highlighted !== null ? (
        <div className="section-card" data-reveal>
          <div className="code-frame">
            <span className="code-lang-badge">{file.lang}</span>
            <div
              className="code-block"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </div>
        </div>
      ) : (
        <div className="section-card" data-reveal>
          <p className="placeholder mb-0">
            找不到這個原始碼檔案，回<Link href="/source/">原始碼瀏覽頁</Link>
            看看其他檔案吧。
          </p>
        </div>
      )}

      <div className="week-nav justify-content-start">
        <Link className="btn" href="/source/">
          ← 原始碼列表
        </Link>
        <Link className="btn btn-home" href="/">
          返回首頁
        </Link>
      </div>
    </>
  );
}
