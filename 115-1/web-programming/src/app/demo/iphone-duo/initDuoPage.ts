import { Tooltip } from "bootstrap";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";

import {
  createDuoScene,
  type Colorway,
  type DuoSceneHandle,
  type FoldState,
} from "./scene";
import { initDuoExtras } from "./extras";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

/**
 * Ported from my-project/src/js/main.ts. The original was a top-level script for a
 * traditional full-page-load site — it never needed to tear anything down, because
 * navigating away meant the whole document (and every GSAP/Three.js resource with
 * it) was reclaimed by the browser. Inside this Next.js app, client-side navigation
 * away from /demo/iphone-duo/ does NOT reload the page, so without explicit cleanup
 * here, ScrollSmoother/ScrollTrigger instances and the Three.js scene would leak —
 * and pile up further — every time someone visits this route more than once in a
 * session. Hence the wrap into init()/cleanup() rather than top-level side effects.
 *
 * gsap.context() auto-tracks every tween/ScrollTrigger/matchMedia created
 * synchronously inside its callback, so ctx.revert() alone undoes most of this
 * file. The two pieces created asynchronously (the hero's SplitText timeline,
 * which waits on document.fonts.ready; and the 3D scene, which waits on the model
 * download) aren't covered by that and are tracked/disposed separately, guarded by
 * `cancelled` in case they resolve after unmount.
 */
export function initDuoPage(root: HTMLElement): () => void {
  let cancelled = false;
  let duoScene: DuoSceneHandle | null = null;
  let heroTimeline: gsap.core.Timeline | null = null;
  let heroSplit: SplitText | null = null;

  // ------------------------------------------------------------------
  // Navbar: blur/shrink on scroll — not a GSAP construct, so gsap.context
  // won't track or remove it; cleaned up explicitly below.
  // ------------------------------------------------------------------
  const nav = document.getElementById("mainNav");
  const onScroll = (): void => {
    nav?.classList.toggle("scrolled", window.scrollY > 20);
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const ctx = gsap.context(() => {
    // ------------------------------------------------------------------
    // Inertia scrolling — everything inside #smooth-wrapper (see page.tsx)
    // now scrolls with momentum instead of 1:1 with the wheel/trackpad.
    // ------------------------------------------------------------------
    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.3,
      smoothTouch: 0.1,
      normalizeScroll: true,
    });

    // Anchor links (#pricing, #highlights, …) normally rely on the browser's
    // native hash-jump, which can't find a scrollable ancestor since
    // #smooth-wrapper is `position: fixed` — route them through the
    // smoother's own scrollTo instead.
    document
      .querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
      .forEach((link) => {
        link.addEventListener("click", (e) => {
          const href = link.getAttribute("href");
          if (!href || href.length < 2) return;
          const target = document.querySelector<HTMLElement>(href);
          if (!target) return;
          e.preventDefault();
          smoother.scrollTo(target, true, "top top");
          history.pushState(null, "", href);
        });
      });

    // ------------------------------------------------------------------
    // Scroll progress bar
    // ------------------------------------------------------------------
    const scrollProgress = document.getElementById("scrollProgress");
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        scrollProgress?.style.setProperty(
          "transform",
          `scaleX(${self.progress})`,
        );
      },
    });

    // ------------------------------------------------------------------
    // Hero blob parallax
    // ------------------------------------------------------------------
    gsap.to(".blob-parallax-1", {
      y: 140,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "+=900",
        scrub: 1,
      },
    });
    gsap.to(".blob-parallax-2", {
      y: -100,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "+=900",
        scrub: 1,
      },
    });

    // ------------------------------------------------------------------
    // Lifestyle banner — scroll-scrubbed zoom-out
    // ------------------------------------------------------------------
    gsap.fromTo(
      ".img-banner-media",
      { scale: 1.25 },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".img-banner",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );

    // ------------------------------------------------------------------
    // Reveal-on-scroll
    // ------------------------------------------------------------------
    gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 44 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      );
    });

    gsap.utils
      .toArray<HTMLElement>(".feature-card, .price-card")
      .forEach((el, i) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 30, scale: 0.96 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            delay: (i % 3) * 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          },
        );
      });

    // ------------------------------------------------------------------
    // Scroll-scrubbed fold — pins the model once there's room for a
    // "showcase" stage (≥992px); below that the model stays compact.
    // ------------------------------------------------------------------
    const foldScrollMM = gsap.matchMedia();
    foldScrollMM.add("(min-width: 992px)", () => {
      const trigger = ScrollTrigger.create({
        trigger: "#modelPinArea",
        start: "top 96px",
        end: "+=1400",
        pin: true,
        pinSpacing: true,
        scrub: 0.6,
        onUpdate: (self) => {
          duoScene?.setAutoPlay(false);
          duoScene?.setFoldProgress(self.progress);
        },
      });
      return () => trigger.kill();
    });
  }, root);

  // SweetAlert2 / AOS / Chart.js / CountUp / dayjs / canvas-confetti — after
  // the context above so ScrollSmoother and the hero pin already exist.
  const extras = initDuoExtras();

  // ------------------------------------------------------------------
  // Magnetic buttons — nudge toward the cursor within their own bounds.
  // Deliberately created OUTSIDE gsap.context() above: these are quickTo
  // tweens driving transform sub-properties (x/y/rotateX/rotateY), and
  // GSAP's context.revert() can't cleanly reset a single sub-property out
  // of a combined `transform` the way it can a normal tween (logs "not
  // eligible for reset. Try splitting into individual properties" when it
  // tries). Since the whole page unmounts on cleanup anyway — these
  // buttons/cards are about to be removed from the DOM regardless — there's
  // nothing to actually revert, so it's simplest to just not track them.
  // ------------------------------------------------------------------
  document
    .querySelectorAll<HTMLElement>(".btn-glow, .btn-outline-glow")
    .forEach((btn) => {
      const moveX = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
      const moveY = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });

      btn.addEventListener("pointermove", (e) => {
        const rect = btn.getBoundingClientRect();
        moveX((e.clientX - rect.left - rect.width / 2) * 0.25);
        moveY((e.clientY - rect.top - rect.height / 2) * 0.25);
      });

      btn.addEventListener("pointerleave", () => {
        moveX(0);
        moveY(0);
      });
    });

  // ------------------------------------------------------------------
  // Cursor tilt + spotlight on feature/price cards — same reasoning as the
  // magnetic buttons above for living outside gsap.context().
  // ------------------------------------------------------------------
  document
    .querySelectorAll<HTMLElement>(".feature-card, .price-card")
    .forEach((card) => {
      gsap.set(card, { transformPerspective: 800, transformOrigin: "center" });
      const tiltX = gsap.quickTo(card, "rotateX", {
        duration: 0.5,
        ease: "power3",
      });
      const tiltY = gsap.quickTo(card, "rotateY", {
        duration: 0.5,
        ease: "power3",
      });
      const lift = gsap.quickTo(card, "y", { duration: 0.5, ease: "power3" });

      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        tiltY(px * 10);
        tiltX(-py * 10);
        lift(-8);
        card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        card.style.setProperty("--my", `${e.clientY - rect.top}px`);
      });

      card.addEventListener("pointerleave", () => {
        tiltX(0);
        tiltY(0);
        lift(0);
      });
    });

  // ------------------------------------------------------------------
  // Hero entrance timeline — split-text word tumble, gated on
  // document.fonts.ready so SplitText measures final (not fallback) font
  // metrics. Runs after gsap.context()'s synchronous callback has already
  // returned, so it isn't auto-tracked by ctx — heroTimeline/heroSplit are
  // killed/reverted explicitly in cleanup() instead.
  // ------------------------------------------------------------------
  document.fonts.ready.then(() => {
    if (cancelled) return;
    const line1 = document.querySelector<HTMLElement>(".hero-line1");
    heroSplit = line1 ? new SplitText(line1, { type: "words" }) : null;
    const line1Words = heroSplit?.words ?? [];

    gsap.set(
      ".hero .badge-pill-glass, .hero-lead, .hero .btn, .hero-trust-item",
      {
        autoAlpha: 0,
        y: 24,
      },
    );
    gsap.set(line1Words, {
      autoAlpha: 0,
      y: 60,
      rotateX: -70,
      transformPerspective: 500,
      transformOrigin: "50% 100%",
    });
    gsap.set(".hero h1 .text-gradient", {
      autoAlpha: 0,
      y: 30,
      scale: 0.9,
      transformOrigin: "0% 50%",
    });

    heroTimeline = gsap
      .timeline({ defaults: { ease: "power3.out" } })
      .to(".hero .badge-pill-glass", { autoAlpha: 1, y: 0, duration: 0.6 }, 0.1)
      .to(
        line1Words,
        {
          autoAlpha: 1,
          y: 0,
          rotateX: 0,
          duration: 0.9,
          stagger: 0.07,
          ease: "back.out(1.6)",
        },
        0.25,
      )
      .to(
        ".hero h1 .text-gradient",
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(2)" },
        0.55,
      )
      .to(".hero-lead", { autoAlpha: 1, y: 0, duration: 0.7 }, 0.7)
      .to(
        ".hero .btn",
        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1 },
        0.85,
      )
      .to(
        ".hero-trust-item",
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 },
        1.05,
      )
      .fromTo(
        "#modelStage",
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 1 },
        0.3,
      );
  });

  // ------------------------------------------------------------------
  // Interactive 3D model
  // ------------------------------------------------------------------
  const duoCanvas = document.getElementById(
    "duoCanvas",
  ) as HTMLCanvasElement | null;
  const modelLoading = document.getElementById("modelLoading");
  const foldSlider = document.getElementById(
    "foldSlider",
  ) as HTMLInputElement | null;
  const foldPlayBtn = document.getElementById(
    "foldPlayBtn",
  ) as HTMLButtonElement | null;
  const foldPlayIcon = document.getElementById("foldPlayIcon");
  const foldPauseIcon = document.getElementById("foldPauseIcon");
  const photoFolded = document.getElementById("photoFolded");
  const photoUnfolded = document.getElementById("photoUnfolded");
  const foldBtns = document.querySelectorAll<HTMLButtonElement>(".fold-btn");

  let lastOpening: boolean | null = null;
  function syncFoldUI(progress: number): void {
    const opening = progress >= 0.5;
    if (opening !== lastOpening) {
      lastOpening = opening;
      photoFolded?.classList.toggle("active", !opening);
      photoUnfolded?.classList.toggle("active", opening);
      foldBtns.forEach((btn) =>
        btn.classList.toggle(
          "active",
          (btn.dataset.state === "unfolded") === opening,
        ),
      );
    }
    if (foldSlider) {
      if (document.activeElement !== foldSlider)
        foldSlider.value = String(progress * 100);
      foldSlider.style.setProperty("--progress", `${progress * 100}%`);
    }
  }

  if (duoCanvas) {
    createDuoScene(duoCanvas, {
      onLoaded: () => {
        modelLoading?.classList.add("is-hidden");
        ScrollTrigger.refresh();
      },
      onError: (err) => {
        console.error("Failed to load iPhone Duo model:", err);
        if (modelLoading) modelLoading.textContent = "3D 模型載入失敗";
      },
      onLoadProgress: (progress) => {
        const text = document.getElementById("modelLoadingText");
        if (text)
          text.textContent = `載入 3D 模型中… ${Math.round(progress * 100)}%`;
      },
      onFoldChange: syncFoldUI,
      onAutoPlayChange: (playing) => {
        foldPlayBtn?.classList.toggle("is-playing", playing);
        foldPlayBtn?.setAttribute("aria-pressed", String(playing));
        foldPlayBtn?.setAttribute(
          "aria-label",
          playing ? "停止自動展示" : "自動展示摺疊動畫",
        );
        foldPlayIcon?.classList.toggle("d-none", playing);
        foldPauseIcon?.classList.toggle("d-none", !playing);
      },
    })
      .then((handle) => {
        if (cancelled) {
          handle.dispose();
          return;
        }
        duoScene = handle;
        syncFoldUI(handle.getFoldProgress());
      })
      .catch(() => {
        /* onError already surfaced this */
      });
  }

  foldSlider?.addEventListener("input", () => {
    duoScene?.setAutoPlay(false);
    duoScene?.setFoldProgress(Number(foldSlider.value) / 100);
  });

  foldPlayBtn?.addEventListener("click", () => {
    const playing = foldPlayBtn.classList.contains("is-playing");
    duoScene?.setAutoPlay(!playing);
  });

  // ------------------------------------------------------------------
  // Color swatch switcher
  // ------------------------------------------------------------------
  const swatches =
    document.querySelectorAll<HTMLButtonElement>(".color-swatch");
  const colorNameEl = document.getElementById("colorName");
  const root3 = document.documentElement;

  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!match) return null;
    return {
      r: parseInt(match[1], 16),
      g: parseInt(match[2], 16),
      b: parseInt(match[3], 16),
    };
  }

  swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      swatches.forEach((s) => s.classList.remove("active"));
      swatch.classList.add("active");

      const accent = swatch.dataset.accent;
      const accent2 = swatch.dataset.accent2;
      const colorway = swatch.dataset.colorway as Colorway | undefined;

      if (accent && accent2) {
        gsap.to(root3, {
          "--accent": accent,
          "--accent-2": accent2,
          duration: 0.6,
          ease: "power2.out",
        });
        const glow = hexToRgb(accent);
        if (glow)
          root3.style.setProperty("--glow", `${glow.r}, ${glow.g}, ${glow.b}`);
        extras.setAccent(accent, accent2);
      }

      if (colorway) duoScene?.setColorway(colorway);
      if (colorNameEl) colorNameEl.textContent = swatch.dataset.name ?? "";
    });
  });

  // ------------------------------------------------------------------
  // Fold state — shared across every `.fold-btn` on the page
  // ------------------------------------------------------------------
  foldBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const state = btn.dataset.state as FoldState | undefined;
      if (state) {
        duoScene?.setAutoPlay(false);
        duoScene?.setFoldState(state);
      }
    });
  });

  // ------------------------------------------------------------------
  // Camera presets + wallpaper cycling
  // ------------------------------------------------------------------
  document.querySelectorAll<HTMLButtonElement>(".camera-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = btn.dataset.preset;
      if (
        preset === "front" ||
        preset === "back" ||
        preset === "macro" ||
        preset === "hero"
      ) {
        duoScene?.flyTo(preset);
      }
    });
  });

  document.getElementById("wallpaperBtn")?.addEventListener("click", (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    btn.disabled = true;
    duoScene?.cycleWallpaper().finally(() => {
      btn.disabled = false;
    });
  });

  // ------------------------------------------------------------------
  // Bootstrap component init (carousel already auto-inits via data-bs-ride)
  // ------------------------------------------------------------------
  document
    .querySelectorAll<HTMLElement>('[data-bs-toggle="tooltip"]')
    .forEach((el) => new Tooltip(el));

  return function cleanup(): void {
    cancelled = true;
    document.removeEventListener("scroll", onScroll);
    heroTimeline?.kill();
    heroSplit?.revert();
    extras.cleanup();
    ctx.revert();
    duoScene?.dispose();
  };
}
