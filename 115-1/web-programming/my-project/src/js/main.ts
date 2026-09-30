import { Tooltip } from "bootstrap";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createDuoScene, type Colorway, type DuoSceneHandle, type FoldState } from "./scene";
import duoModelUrl from "../assets/models/iphone-duo.glb?url";
import "../scss/styles.scss";

gsap.registerPlugin(ScrollTrigger);

// ------------------------------------------------------------------
// Navbar: blur/shrink on scroll
// ------------------------------------------------------------------
const nav = document.getElementById("mainNav");
const onScroll = (): void => {
  nav?.classList.toggle("scrolled", window.scrollY > 20);
};
document.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ------------------------------------------------------------------
// Reveal-on-scroll — GSAP + ScrollTrigger, staggered per section
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

gsap.utils.toArray<HTMLElement>(".feature-card, .price-card").forEach((el, i) => {
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
// Hero entrance timeline
// ------------------------------------------------------------------
gsap.set(".hero .badge-pill-glass, .hero h1, .hero-lead, .hero .btn, .hero-trust-item", {
  autoAlpha: 0,
  y: 24,
});
gsap
  .timeline({ defaults: { ease: "power3.out" } })
  .to(".hero .badge-pill-glass", { autoAlpha: 1, y: 0, duration: 0.6 }, 0.1)
  .to(".hero h1", { autoAlpha: 1, y: 0, duration: 0.8 }, 0.25)
  .to(".hero-lead", { autoAlpha: 1, y: 0, duration: 0.7 }, 0.45)
  .to(".hero .btn", { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1 }, 0.6)
  .to(".hero-trust-item", { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 }, 0.8)
  .fromTo("#modelStage", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1 }, 0.3);

// ------------------------------------------------------------------
// Interactive 3D model
// ------------------------------------------------------------------
const duoCanvas = document.getElementById("duoCanvas") as HTMLCanvasElement | null;
const modelLoading = document.getElementById("modelLoading");
let duoScene: DuoSceneHandle | null = null;

if (duoCanvas) {
  createDuoScene(duoCanvas, duoModelUrl, {
    onLoaded: () => modelLoading?.classList.add("is-hidden"),
    onError: (err) => {
      console.error("Failed to load iPhone Duo model:", err);
      if (modelLoading) modelLoading.textContent = "3D 模型載入失敗";
    },
  })
    .then((handle) => {
      duoScene = handle;
    })
    .catch(() => {
      /* onError already surfaced this */
    });
}

// ------------------------------------------------------------------
// Color swatch switcher — CSS custom properties + the 3D model's
// actual material color (frame + rim light) via DuoScene.
// ------------------------------------------------------------------
const swatches = document.querySelectorAll<HTMLButtonElement>(".color-swatch");
const colorNameEl = document.getElementById("colorName");
const root = document.documentElement;

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
      gsap.to(root, {
        "--accent": accent,
        "--accent-2": accent2,
        duration: 0.6,
        ease: "power2.out",
      });

      const glow = hexToRgb(accent);
      if (glow) root.style.setProperty("--glow", `${glow.r}, ${glow.g}, ${glow.b}`);
    }

    if (colorway) duoScene?.setColorway(colorway);
    if (colorNameEl) colorNameEl.textContent = swatch.dataset.name ?? "";
  });
});

// ------------------------------------------------------------------
// Fold state — shared across every `.fold-btn` on the page (both the
// 3D hero's controls and the real-photo section further down), plus
// the two real photo frames, plus the live 3D model when it's ready.
// ------------------------------------------------------------------
const photoFolded = document.getElementById("photoFolded");
const photoUnfolded = document.getElementById("photoUnfolded");
const foldBtns = document.querySelectorAll<HTMLButtonElement>(".fold-btn");
let autoTimer: ReturnType<typeof setInterval> | undefined;

function applyFoldState(state: FoldState): void {
  const opening = state === "unfolded";
  photoFolded?.classList.toggle("active", !opening);
  photoUnfolded?.classList.toggle("active", opening);
  foldBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.state === state));
  duoScene?.setFoldState(state);
}

function resetAutoTimer(): void {
  clearInterval(autoTimer);
  autoTimer = setInterval(() => {
    const isOpen = photoUnfolded?.classList.contains("active") ?? false;
    applyFoldState(isOpen ? "folded" : "unfolded");
  }, 5000);
}

foldBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const state = btn.dataset.state as FoldState | undefined;
    if (state) applyFoldState(state);
    resetAutoTimer();
  });
});

if (photoFolded && photoUnfolded) resetAutoTimer();

// ------------------------------------------------------------------
// Camera presets + wallpaper cycling on the 3D model
// ------------------------------------------------------------------
document.querySelectorAll<HTMLButtonElement>(".camera-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = btn.dataset.preset;
    if (preset === "front" || preset === "back" || preset === "macro" || preset === "hero") {
      duoScene?.flyTo(preset);
    }
  });
});

document.getElementById("wallpaperBtn")?.addEventListener("click", () => {
  duoScene?.cycleWallpaper();
});

// ------------------------------------------------------------------
// Magnetic buttons — nudge toward the cursor within their own bounds
// ------------------------------------------------------------------
document.querySelectorAll<HTMLElement>(".btn-glow, .btn-outline-glow").forEach((btn) => {
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
// Cursor-tracking spotlight on feature/spec cards
// ------------------------------------------------------------------
document.querySelectorAll<HTMLElement>(".feature-card").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    card.style.setProperty("--my", `${e.clientY - rect.top}px`);
  });
});

// ------------------------------------------------------------------
// Bootstrap component init (carousel already auto-inits via data-bs-ride)
// ------------------------------------------------------------------
document.querySelectorAll<HTMLElement>('[data-bs-toggle="tooltip"]').forEach((el) => new Tooltip(el));
