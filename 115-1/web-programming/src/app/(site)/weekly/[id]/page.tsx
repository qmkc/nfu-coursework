import type { Metadata } from 'next';
import { WeekNav } from '@/components/WeekNav';
import { highlightCode } from '@/lib/highlight';
import { site } from '@/data/site';
import { weekThemes } from '@/data/weeks';
import { weekContent } from '@/data/week-content';

export function generateStaticParams() {
  return Array.from({ length: site.weekCount }, (_, i) => ({
    id: String(i + 1).padStart(2, '0'),
  }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const weekNo = Number(id);

  return {
    title: `Week ${String(weekNo).padStart(2, '0')}｜${site.studentId} ${site.title}`,
    description: `學號 ${site.studentId}，第 ${String(weekNo).padStart(2, '0')} 週課程學習成果、程式碼與學習心得。`,
  };
}

export default async function WeeklyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const weekNo = Number(id);
  const weekTheme = weekThemes[weekNo] ?? null;
  const weekDetail = weekContent[weekNo];

  const primaryLinks = weekDetail?.links?.filter((link) => link.primary) ?? [];
  const otherLinks = weekDetail?.links?.filter((link) => !link.primary) ?? [];

  const snippet = weekDetail?.code?.snippet;
  const isLinkSnippet = snippet !== undefined && snippet.startsWith('http');
  const codeHtml = !isLinkSnippet
    ? await highlightCode(snippet ?? '// 請貼上本週重點程式碼片段', weekDetail?.code?.lang ?? 'ts')
    : null;

  return (
    <>
      <div className="week-hero">
        <div className="crumb">
          <a href="/">首頁</a> / Week {String(weekNo).padStart(2, '0')}
        </div>
        <div className="big-num">
          WEEK {String(weekNo).padStart(2, '0')} / {site.weekCount}
        </div>
        <h1>第 {String(weekNo).padStart(2, '0')} 週學習成果</h1>
        <p className="theme">
          <strong>本週主題：</strong>
          {weekTheme ?? '請填寫'}
        </p>
      </div>

      <div className="section-card" data-reveal>
        <h3>
          <span className="tick">＃01</span>學習目標
        </h3>
        {weekDetail?.objectives ? (
          <ul className="mb-0">
            {weekDetail.objectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        ) : (
          <p className="placeholder mb-0">請填寫本週的學習目標...</p>
        )}
      </div>

      <div className="section-card" data-reveal style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
        <h3>
          <span className="tick">＃02</span>成果展示
        </h3>
        {weekDetail?.showcase ? (
          <p className={weekDetail.links ? '' : 'mb-0'}>{weekDetail.showcase}</p>
        ) : (
          <p className="placeholder mb-0">放置圖片、影片、Demo 連結。</p>
        )}
        {primaryLinks.length > 0 && (
          <div className="cta-row">
            {primaryLinks.map((link) => (
              <a key={link.url} className="btn-cta" href={link.url} target="_blank" rel="noopener">
                {link.label} ↗
              </a>
            ))}
          </div>
        )}
        {otherLinks.length > 0 && (
          <ul className="mb-0">
            {otherLinks.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noopener">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="section-card" data-reveal style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
        <h3>
          <span className="tick">＃03</span>程式碼
        </h3>
        {weekDetail?.code?.filename && <p className="mb-0">{weekDetail.code.filename}</p>}
        {isLinkSnippet ? (
          <p className="mb-0">
            <a href={snippet} target="_blank" rel="noopener">
              {snippet}
            </a>
          </p>
        ) : (
          <div className="code-frame">
            {weekDetail?.code?.lang && <span className="code-lang-badge">{weekDetail.code.lang}</span>}
            <div className="code-block" dangerouslySetInnerHTML={{ __html: codeHtml! }} />
          </div>
        )}
      </div>

      <div className="section-card" data-reveal style={{ '--reveal-delay': '180ms' } as React.CSSProperties}>
        <h3>
          <span className="tick">＃04</span>學習心得
        </h3>
        {weekDetail?.reflection ? (
          <p className="mb-0">{weekDetail.reflection}</p>
        ) : (
          <p className="placeholder mb-0">請填寫本週的學習心得...</p>
        )}
      </div>

      <WeekNav weekNo={weekNo} weekCount={site.weekCount} />
    </>
  );
}
