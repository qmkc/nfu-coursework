'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * 全站共用的「滾動進場動畫」掛載點，在 root layout 掛一次即可。
 * 用一顆 IntersectionObserver 同時盯著所有 [data-reveal] 元素，進入視窗後補上
 * .is-visible 就讓 CSS transition 接手，不用每個元件各自開一顆 observer。
 *
 * 漸進式增強：只有這支腳本真的執行、幫 <html> 補上 reveal-ready 之後，
 * globals.css 的 [data-reveal] 隱藏規則才會生效——JS 沒跑起來的話，
 * 所有內容本來就是完全可見的，不會因為動畫掛掉就看不到東西。
 *
 * root layout 在 App Router 的用戶端導覽（點 <Link>）之間不會重新掛載，
 * 所以這裡要跟著 usePathname() 重跑：每次換頁都要重新掃一次新頁面的
 * [data-reveal] 元素、重新 observe，不然新頁面的內容會卡在 opacity: 0
 * 永遠看不到（舊的 observer 還盯著已經被換掉的舊頁面元素）。
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('reveal-ready');

    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (elements.length === 0) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
