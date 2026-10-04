import type { Metadata } from 'next';
import Link from 'next/link';
import { about } from '@/data/about';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: `關於我｜${site.studentId} ${site.title}`,
  description: `${about.name} 的自我介紹、技能與作品連結。`,
};

export default function AboutPage() {
  return (
    <>
      <div className="hero">
        <p className="kicker">About Me</p>
        <h1>{about.name}</h1>
        <p className="lead">{about.tagline}</p>
        <p className="lead mb-0">{about.bio}</p>
        <div className="meta-row">
          <span>
            <span className="m-label">所在地</span>
            {about.location}
          </span>
          <span>
            <span className="m-label">Email</span>
            <a href={`mailto:${about.email}`}>{about.email}</a>
          </span>
          {about.links.map((link) => (
            <span key={link.url}>
              <a href={link.url} target="_blank" rel="noopener">
                {link.label} ↗
              </a>
            </span>
          ))}
        </div>
      </div>

      <div id="skills" className="section-head">
        <span className="num">01</span>
        <h2>技能</h2>
      </div>
      {Object.entries(about.skills).map(([category, items], index) => (
        <div
          className="skill-group"
          key={category}
          data-reveal
          style={{ '--reveal-delay': `${index * 60}ms` } as React.CSSProperties}
        >
          <div className="skill-cat">{category}</div>
          <div className="tag-list">
            {items.map((item) => (
              <span className="skill-pill" key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}

      <div id="repos" className="section-head">
        <span className="num">02</span>
        <h2>Pinned Repositories</h2>
        <span className="sub">github.com/{site.githubUser}</span>
      </div>
      <div className="repo-grid">
        {about.projects.map((project, index) => (
          <div
            className="repo-card"
            key={project.name}
            data-reveal
            style={{ '--reveal-delay': `${Math.min(index * 40, 280)}ms` } as React.CSSProperties}
          >
            <div className="idx">{String(index + 1).padStart(2, '0')}</div>
            <h4>
              <a href={project.url} target="_blank" rel="noopener">
                {project.name}
              </a>
            </h4>
            <p>{project.description}</p>
          </div>
        ))}
      </div>

      <div id="source" className="section-head">
        <span className="num">03</span>
        <h2>原始碼</h2>
      </div>
      <p className="intro-block">
        這個網站本身就是課程作業的一部分，想看某個頁面是怎麼寫出來的，可以到 <Link href="/source/">原始碼瀏覽頁</Link>直接看程式碼。
      </p>
    </>
  );
}
