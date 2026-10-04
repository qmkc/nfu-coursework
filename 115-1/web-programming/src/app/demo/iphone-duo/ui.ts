/**
 * Builds the two default screen layouts (Wallpaper, Launcher) from Apple's
 * own lock-screen and HIG screenshots — ported from
 * https://github.com/jadon7/iphone-duo (MIT). Assets are fetched locally via
 * scripts/prepare-assets.py; see .gitignore.
 *
 * Wallpaper (~420KB) is the default screen, so scene.ts fetches it eagerly,
 * in parallel with the 3D model rather than blocking it. Launcher (~210KB)
 * is never shown until the user clicks the wallpaper-cycle button, so it's
 * only fetched then — on a slow connection that's bytes the hero doesn't
 * need to make the user wait on.
 */

export interface UIScreens {
  inner: HTMLCanvasElement;
  outer: HTMLCanvasElement;
}

export type UITheme = "wallpaper" | "launcher";

// See scene.ts's MODEL_URL comment — same deal, fixed path under public/iphone-duo/.
const UI_BASE = "/iphone-duo/ui/";
const INNER_WIDTH = 1600;
const OUTER_WIDTH = 774;
const HEIGHT = 1125;
const LAUNCHER_CROP: Record<
  "inner" | "outer",
  [number, number, number, number]
> = {
  // The HIG screenshots include a device frame; use only their display area.
  inner: [22, 22, 1072, 754],
  outer: [28, 16, 510, 742],
};

async function loadImage(name: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = `${UI_BASE}${name}`;
  await image.decode();
  return image;
}

function buildScreens(
  draw: (
    ctx: CanvasRenderingContext2D,
    kind: "inner" | "outer",
    width: number,
    height: number,
  ) => void,
): UIScreens {
  const screens = {} as UIScreens;
  for (const kind of ["inner", "outer"] as const) {
    const canvas = document.createElement("canvas");
    canvas.width = kind === "inner" ? INNER_WIDTH : OUTER_WIDTH;
    canvas.height = HEIGHT;
    draw(
      canvas.getContext("2d") as CanvasRenderingContext2D,
      kind,
      canvas.width,
      canvas.height,
    );
    screens[kind] = canvas;
  }
  return screens;
}

export async function loadWallpaperTheme(): Promise<UIScreens> {
  const [wallpaper, clockInner, clockOuter] = await Promise.all([
    loadImage("wallpaper-inner.avif"),
    loadImage("clock-inner.avif"),
    loadImage("clock-outer.avif"),
  ]);
  const clocks = { inner: clockInner, outer: clockOuter };
  return buildScreens((ctx, kind, w, h) => {
    ctx.drawImage(wallpaper, w - INNER_WIDTH, 0, INNER_WIDTH, h);
    ctx.drawImage(clocks[kind], 0, 0, w, h);
  });
}

let launcherPromise: Promise<UIScreens> | null = null;

export function loadLauncherTheme(): Promise<UIScreens> {
  launcherPromise ??= (async () => {
    const [inner, outer] = await Promise.all([
      loadImage("launcher-inner.jpg"),
      loadImage("launcher-outer.jpg"),
    ]);
    const images = { inner, outer };
    return buildScreens((ctx, kind, w, h) => {
      ctx.drawImage(images[kind], ...LAUNCHER_CROP[kind], 0, 0, w, h);
    });
  })();
  return launcherPromise;
}

export function loadTheme(theme: UITheme): Promise<UIScreens> {
  return theme === "wallpaper" ? loadWallpaperTheme() : loadLauncherTheme();
}
