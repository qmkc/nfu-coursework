"use client";

import { useEffect, useRef } from "react";

const WATERMARK_TEXT = "校園測試 DEMO";

// Applied inline with !important (see the effect below) so no stylesheet rule —
// ours or one injected later — can hide the watermark.
const FORCED_STYLES: Record<string, string> = {
  display: "block",
  visibility: "visible",
  opacity: "1",
  position: "fixed",
  inset: "0",
  "z-index": "2147483000",
  "pointer-events": "none",
  transform: "none",
  filter: "none",
  "clip-path": "none",
};

/**
 * Full-viewport "校園測試 DEMO" watermark. This page imitates a real product
 * launch site, so the label must not be something a visitor can scroll past or
 * miss: it's server-rendered (visible before/without JS), sits above every
 * other layer including SweetAlert2 dialogs, and ignores pointer events so the
 * page underneath stays fully usable.
 *
 * The effect is the "forced" part — a MutationObserver puts the node back if
 * it's removed from the document or has its attributes/children edited (e.g.
 * via devtools or a userscript).
 */
export function DemoWatermark() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const applyForcedStyles = (): void => {
      el.removeAttribute("style");
      for (const [prop, value] of Object.entries(FORCED_STYLES)) {
        el.style.setProperty(prop, value, "important");
      }
    };
    applyForcedStyles();

    const className = el.className;
    const innerHTML = el.innerHTML;
    const style = el.getAttribute("style");

    const observer = new MutationObserver(() => restore());
    const observe = (): void => {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
      observer.observe(el, {
        attributes: true,
        characterData: true,
        subtree: true,
      });
    };

    function restore(): void {
      if (
        el!.isConnected &&
        el!.parentElement === document.body &&
        el!.className === className &&
        el!.getAttribute("style") === style &&
        el!.innerHTML === innerHTML &&
        !el!.hidden
      ) {
        return;
      }
      // Disconnect while repairing, or our own writes would re-trigger this.
      observer.disconnect();
      if (el!.parentElement !== document.body) document.body.appendChild(el!);
      el!.hidden = false;
      el!.className = className;
      applyForcedStyles();
      if (el!.innerHTML !== innerHTML) el!.innerHTML = innerHTML;
      observe();
    }

    observe();
    return () => observer.disconnect();
  }, []);

  return (
    <div className="demo-watermark" ref={ref}>
      <svg
        className="demo-watermark-tiles"
        width="100%"
        height="100%"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="demoWatermarkPattern"
            width="360"
            height="190"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-24)"
          >
            <text x="20" y="70">
              {WATERMARK_TEXT}
            </text>
            <text x="200" y="165">
              {WATERMARK_TEXT}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#demoWatermarkPattern)" />
      </svg>
      <p className="demo-watermark-badge" role="note">
        <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
        校園測試 DEMO · 非官方網站
      </p>
    </div>
  );
}
