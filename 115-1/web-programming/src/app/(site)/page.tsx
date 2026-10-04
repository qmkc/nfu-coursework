import type { Metadata } from 'next';
import Link from 'next/link';
import { ProgressBar } from '@/components/ProgressBar';
import { content } from '@/data/content';
import { site } from '@/data/site';
import { weekThemes } from '@/data/weeks';
import { weekContent } from '@/data/week-content';

export const metadata: Metadata = {
  title: `${site.studentId}｜${site.title}`,
  description: `學號 ${site.studentId}，本學期 ${site.weekCount} 週課程學習成果、專題作品與學習反思總覽。`,
};

const currentYear = new Date().getFullYear();

export default function HomePage() {
  const weeks = Array.from({ length: site.weekCount }, (_, i) => {
    const no = i + 1;
    return {
      no,
      label: `Week ${String(no).padStart(2, '0')}`,
      summary: weekThemes[no] ?? null,
    };
  });
  const completedWeeks = weeks.filter((week) => week.summary !== null).length;

  return (
    <>
      <div className="hero">
        <p className="kicker">Course Learning Portfolio · {currentYear}</p>
        <h1>{site.title}</h1>
        <p className="lead">{site.weekCount} 週學習歷程、專題作品與反思紀錄，持續更新中。</p>
        <div className="meta-row">
          <span>
            <span className="m-label">學號</span>
            {site.studentId}
          </span>
          <span>
            <span className="m-label">GitHub</span>
            <a href={`https://github.com/${site.githubUser}`} target="_blank" rel="noopener">
              github.com/{site.githubUser}
            </a>
          </span>
        </div>
        <ProgressBar value={completedWeeks} max={site.weekCount} label="每週進度" />
      </div>

      <div className="intro-block">
        <strong>課程簡介　</strong>
        本網站記錄本學期 {site.weekCount} 週課程學習成果、專題作品與學習反思，每週更新開發紀錄與心得，完整呈現學習歷程。
      </div>

      <div id="weekly" className="section-head">
        <span className="num">01</span>
        <h2>每週成果</h2>
        <span className="sub">week 01–{site.weekCount}</span>
      </div>
      <div className="week-grid">
        {weeks.map((week, index) => {
          const demoLink = weekContent[week.no]?.links?.find((link) => link.primary);
          const weekHref = `/weekly/${String(week.no).padStart(2, '0')}/`;

          return (
            <div
              className={`week-card${week.summary !== null ? ' is-done' : ''}`}
              key={week.no}
              data-reveal
              style={{ '--reveal-delay': `${Math.min(index * 30, 300)}ms` } as React.CSSProperties}
            >
              <Link className="week-card-stretched-link" href={weekHref} aria-label={`${week.label}：${week.summary ?? '尚未規劃主題'}`} />
              <span className="week-card-top">
                <span className="wn">{String(week.no).padStart(2, '0')}</span>
                <span className="dot" aria-hidden="true" />
              </span>
              <span className="wt">{week.label}</span>
              <span className={`ws${week.summary === null ? ' ws-empty' : ''}`}>{week.summary ?? '尚未規劃主題'}</span>
              {demoLink && (
                <a
                  className="week-card-demo"
                  href={demoLink.url}
                  target="_blank"
                  rel="noopener"
                  title={`${demoLink.label}（開新分頁）`}
                >
                  ↗
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div id="projects" className="section-head">
        <span className="num">02</span>
        <h2>專題作品</h2>
      </div>
      {content.projects.map((project, index) => (
        <div
          className="project-row"
          key={project.index}
          data-reveal
          style={{ '--reveal-delay': `${index * 60}ms` } as React.CSSProperties}
        >
          <div className="idx">{project.index}</div>
          <div>
            <span className="tag">{project.status}</span>
            <h4>{project.title}</h4>
            <p>{project.description}</p>
          </div>
        </div>
      ))}

      <div id="reflection" className="section-head">
        <span className="num">03</span>
        <h2>學習反思</h2>
      </div>
      {content.reflections.map((reflection, index) => (
        <div
          className="reflect-row"
          key={reflection.title}
          data-reveal
          style={{ '--reveal-delay': `${index * 60}ms` } as React.CSSProperties}
        >
          <div className="t">{reflection.title}</div>
          <div className="d">{reflection.description}</div>
        </div>
      ))}
    </>
  );
}
