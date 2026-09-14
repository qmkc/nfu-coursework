import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';

interface NavMenuProps {
  githubUser: string;
}

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
function useActiveSection(): string {
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
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
  }, []);

  return activeSection;
}

function NavLinks({ activeSection, onNavigate }: { activeSection: string; onNavigate?: () => void }) {
  return (
    <ul className="navbar-nav align-items-md-center gap-md-1" onClick={onNavigate}>
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
          <a className="nav-link" href={href}>
            {label}
          </a>
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

function NavMenu({ githubUser }: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const activeSection = useActiveSection();

  return (
    <>
      <div className="d-none d-md-flex align-items-center gap-md-1">
        <NavLinks activeSection={activeSection} />
        <div className="ms-md-3">
          <GithubLink githubUser={githubUser} />
        </div>
      </div>

      <IconButton
        className="d-md-none"
        aria-label="開啟選單"
        onClick={() => setOpen(true)}
        sx={{ color: 'inherit' }}
      >
        <MenuIcon />
      </IconButton>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <div
          className="site-nav d-flex flex-column gap-2 p-3"
          style={{ minWidth: 220 }}
        >
          <NavLinks activeSection={activeSection} onNavigate={() => setOpen(false)} />
          <GithubLink githubUser={githubUser} />
        </div>
      </Drawer>
    </>
  );
}

const root = document.getElementById('nav-menu-root');
if (root) {
  createRoot(root).render(<NavMenu githubUser={root.dataset.githubUser ?? ''} />);
}
