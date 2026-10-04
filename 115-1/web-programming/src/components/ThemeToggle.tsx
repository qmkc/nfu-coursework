'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem('theme');
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path
        strokeLinecap="round"
        d="M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.8 14.5A8.75 8.75 0 1 1 9.5 3.2a7 7 0 0 0 11.3 11.3Z" />
    </svg>
  );
}

/**
 * 深色模式手動切換鈕：預設跟系統，點一下就記住使用者自己的選擇（localStorage）。
 * 實際的「不閃一下」是靠 layout.tsx <head> 裡那段阻塞式 inline script 先幫
 * <html data-theme> 補好值，這顆按鈕只負責顯示目前狀態跟讓使用者切換。
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(getStoredTheme() ?? getSystemTheme());
  }, []);

  function toggle() {
    const next: Theme = (theme ?? getSystemTheme()) === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // localStorage 被封鎖（例如無痕模式）：這次切換還是生效，只是重新整理後會還原。
    }
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? '切換成淺色模式' : '切換成深色模式'}
      title={isDark ? '切換成淺色模式' : '切換成深色模式'}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
