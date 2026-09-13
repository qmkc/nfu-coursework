import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';

interface NavMenuProps {
  githubUser: string;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="navbar-nav align-items-md-center gap-md-1" onClick={onNavigate}>
      <li className="nav-item">
        <a className="nav-link active" href="#weekly">
          每週成果
        </a>
      </li>
      <li className="nav-item">
        <a className="nav-link" href="#projects">
          專題作品
        </a>
      </li>
      <li className="nav-item">
        <a className="nav-link" href="#reflection">
          學習反思
        </a>
      </li>
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

  return (
    <>
      <div className="d-none d-md-flex align-items-center gap-md-1">
        <NavLinks />
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
          <NavLinks onNavigate={() => setOpen(false)} />
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
