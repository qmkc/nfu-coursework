'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { site } from '@/data/site';

const SECTIONS = [
  { id: 'weekly', label: '每週成果' },
  { id: 'projects', label: '專題作品' },
  { id: 'reflection', label: '學習反思' },
] as const;

const PAGE_LINKS = [
  { href: '/about/', label: '關於我' },
  { href: '/source/', label: '原始碼' },
] as const;

/** Highlights whichever section is currently crossing the middle of the viewport. */
function useActiveSection(enabled: boolean): string {
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const elements = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [enabled]);

  return activeSection;
}

function NavLinks({ activeSection, onNavigate }: { activeSection: string; onNavigate?: () => void }) {
  return (
    <ul className="navbar-nav flex-md-row align-items-md-center gap-md-1" onClick={onNavigate}>
      {SECTIONS.map(({ id, label }) => (
        <li className="nav-item" key={id}>
          <a
            className={`nav-link${id === activeSection ? ' active' : ''}`}
            href={`#${id}`}
            aria-current={id === activeSection ? 'true' : undefined}
          >
            {label}
          </a>
        </li>
      ))}
      {PAGE_LINKS.map(({ href, label }) => (
        <li className="nav-item" key={href}>
          <Link className="nav-link" href={href}>
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function GithubLink({ githubUser }: { githubUser: string }) {
  return (
    <a className="btn-gh" href={`https://github.com/${githubUser}`} target="_blank" rel="noopener">
      GitHub ↗
    </a>
  );
}

export function Header() {
  const pathname = usePathname();
  const variant: 'home' | 'page' = pathname === '/' ? 'home' : 'page';
  const { title, studentId, githubUser } = site;

  const [open, setOpen] = useState(false);
  const activeSection = useActiveSection(variant === 'home');

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <nav className="navbar site-nav">
      <div className="container">
        <Link className="navbar-brand" href="/">
          {title}
          <span className="id">{studentId}</span>
        </Link>

        {variant === 'home' ? (
          <>
            <div className="d-none d-md-flex align-items-center gap-md-1">
              <NavLinks activeSection={activeSection} />
              <div className="ms-md-3 d-flex align-items-center gap-2">
                <GithubLink githubUser={githubUser} />
                <ThemeToggle />
              </div>
            </div>

            <div className="d-flex d-md-none align-items-center gap-2 ms-auto">
              <ThemeToggle />
              <button
                type="button"
                className="navbar-toggler border-0"
                aria-label="開啟選單"
                onClick={() => setOpen(true)}
              >
                <span className="navbar-toggler-icon" />
              </button>
            </div>

            <div
              className={`offcanvas offcanvas-end site-offcanvas${open ? ' show' : ''}`}
              tabIndex={-1}
              style={{ visibility: open ? 'visible' : 'hidden' }}
            >
              <div className="offcanvas-header">
                <button
                  type="button"
                  className="btn-close"
                  aria-label="關閉選單"
                  onClick={() => setOpen(false)}
                />
              </div>
              <div className="offcanvas-body d-flex flex-column gap-2">
                <NavLinks activeSection={activeSection} onNavigate={() => setOpen(false)} />
                <GithubLink githubUser={githubUser} />
              </div>
            </div>
            {open && (
              <div
                className="offcanvas-backdrop fade show"
                onClick={() => setOpen(false)}
                aria-hidden="true"
              />
            )}
          </>
        ) : (
          <div className="ms-auto d-flex align-items-center gap-2">
            {PAGE_LINKS.map(({ href, label }) => (
              <Link key={href} className="nav-link" href={href}>
                {label}
              </Link>
            ))}
            <GithubLink githubUser={githubUser} />
            <ThemeToggle />
          </div>
        )}
      </div>
    </nav>
  );
}
