"use client";

import { useEffect } from "react";

/**
 * Runs initTrailPage() against the page markup after mount and tears it down on
 * unmount. Dynamically imported because Leaflet, Swiper and Bootstrap's JS all
 * touch `window` at import time and can't be loaded during the static build.
 */
export function TrailPageScript() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    import("./initTrailPage").then(({ initTrailPage }) => {
      if (cancelled) return;
      cleanup = initTrailPage();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
