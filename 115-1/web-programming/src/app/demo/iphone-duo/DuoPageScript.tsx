"use client";

import { useEffect } from "react";

/**
 * Runs initDuoPage() against the page markup after mount, and tears it down on
 * unmount (see initDuoPage.ts for why that matters here). Dynamically imported
 * so Three.js/GSAP/Bootstrap's JS — none of which can run during server
 * rendering — are only ever loaded in the browser. Renders nothing itself; the
 * actual markup is the page's own JSX, rendered alongside this component.
 */
export function DuoPageScript() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    import("./initDuoPage").then(({ initDuoPage }) => {
      if (cancelled) return;
      cleanup = initDuoPage(document.body);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
