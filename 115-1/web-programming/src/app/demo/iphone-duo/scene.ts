import * as THREE from "three";
import { USDLoader } from "three/examples/jsm/loaders/USDLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap } from "gsap";
import { loadWallpaperTheme, loadTheme, type UITheme } from "./ui";

/**
 * This is Apple's own iPhone Duo reference model (USDZ "Landscape" pose,
 * flattened — see scripts/prepare-assets.py), not a hand-authored stand-in.
 * It has no hinge joint or morph targets either, but unlike the old
 * hand-made glb it already has real continuity to exploit: the flat/open
 * pose splits cleanly into a half that never moves (rear-camera shell,
 * descended from node "SiftyleUEEZwLhF") and a half that swings shut
 * (descended from "upTUAKvMVkPOMKq"), plus four meshes — the continuous
 * inner display among them — that straddle the hinge and must bend rather
 * than rotate rigidly. The hinge-rotation/screen-bend shader technique and
 * the exact UV-projection math below are ported from
 * https://github.com/jadon7/iphone-duo (MIT), which this asset pipeline
 * also comes from; all the magic numbers are *measured* against this exact
 * geometry, not guessed.
 */

export type FoldState = "folded" | "unfolded";
export type Colorway = "starlight" | "midnight";
export type CameraPreset = "hero" | "front" | "back" | "macro";

// Ported from the original Vite project (my-project/), which served this at the
// domain root via import.meta.env.BASE_URL. In the merged Next.js app, the assets
// live under public/iphone-duo/ instead, so this is a fixed path rather than a
// build-time base — see public/iphone-duo/models/.
const MODEL_URL = "/iphone-duo/models/iPhone_Duo_Render.usdc";
const MODEL_SCALE = 100;

// Node names are USD content hashes, not semantic labels — these were
// identified by inspecting the loaded asset (see the comment above), not
// guessed. They're stable as long as the model file itself doesn't change.
const MOVING_ROOT_NAME = "upTUAKvMVkPOMKq"; // cover half — rotates shut
const FIXED_ROOT_NAME = "SiftyleUEEZwLhF"; // rear-camera half — stays put
const FLEXIBLE_MESH_NAMES = new Set([
  "JnJdTkxbQgUtLwU",
  "xdyyaajWsatVNxN",
  "UXtsBZYlaUvHoEh",
  "MvKPXGSdYDVvSpk",
]);
const INNER_SCREEN_MESH_NAME = "UXtsBZYlaUvHoEh";
const OUTER_SCREEN_MESH_NAME = "hhgAIoCGsHXeDPY";
const HINGE_CENTER_Y = 5.8974;
const HINGE_Z = 0.275454;

// The camera module's two lenses, located by inspecting the fixed half's
// geometry (a tight cluster of small round meshes near one top corner) —
// used only to frame the "macro" preset; the asset has no semantic name for
// "camera bump" to look up directly.
const CAMERA_MODULE_CENTER = new THREE.Vector3(5.8, 4.37, -0.65);
const CAMERA_MODULE_SIZE = new THREE.Vector3(2.6, 2.0, 1.2);

const COLORWAYS: Record<Colorway, { frame: number | null; rim: number }> = {
  starlight: { frame: null, rim: 0xd8b26b }, // null = restore each part's own baked tone
  midnight: { frame: 0x15151a, rim: 0x6e6bff },
};

// -- Fixed front-view UI projection ---------------------------------------
// uiReferenceEye is a *virtual* projection origin (not the real orbiting
// camera) so the screen content stays a flat, undistorted "image" under the
// fold instead of a UV-mapped texture that would skew with viewing angle.
const UI_REFERENCE_EYE = new THREE.Vector3(0, 0, 40);
const INNER_UI_FRAME = new THREE.Vector4(
  -7.89935,
  0.34562 - HINGE_CENTER_Y,
  15.7987,
  11.1035,
);
const OUTER_UI_FRAME = new THREE.Vector4(
  0.23396,
  0.27173 - HINGE_CENTER_Y,
  7.73936,
  11.2513,
).multiplyScalar(
  (UI_REFERENCE_EYE.z - 0.24948) / (UI_REFERENCE_EYE.z - 0.825538),
);

const SCREEN_SHADER = `
uniform float foldAngle;
uniform vec2 uiPixel;
uniform vec4 uiFrame;
uniform vec2 uiGradient;
uniform vec3 uiReferenceEye;
varying vec3 vUIPosition;
vec3 screenColor() {
  // Intersect the fixed front-view ray with the unfolded inner-screen plane.
  float depth = (0.24948 - uiReferenceEye.z) / (vUIPosition.z - uiReferenceEye.z);
  vec2 projected = uiReferenceEye.xy + (vUIPosition.xy - uiReferenceEye.xy) * depth;
  vec2 sourceUV = (projected - uiFrame.xy) / uiFrame.zw;
  #ifdef INNER_UI
    float progress = clamp(foldAngle / 1.570796327, 0.0, 1.0);
  #else
    // Anchor the image to the projected hinge-side edge of the outer screen.
    float c = cos(foldAngle), s = sin(foldAngle);
    vec2 hingeEdge = vec2(-0.23396, -0.27463 - 0.275454);
    vec2 foldedEdge = vec2(c * hingeEdge.x + s * hingeEdge.y,
      -s * hingeEdge.x + c * hingeEdge.y + 0.275454);
    float edgeDepth = (0.24948 - uiReferenceEye.z) / (foldedEdge.y - uiReferenceEye.z);
    float anchorX = uiReferenceEye.x + (foldedEdge.x - uiReferenceEye.x) * edgeDepth;
    sourceUV.x = uiGradient.x + (projected.x - anchorX) / uiFrame.z;
    float progress = clamp((3.141592654 - foldAngle) / 1.570796327, 0.0, 1.0);
  #endif
  float edge = (sourceUV.x - uiGradient.x) / (uiGradient.y - uiGradient.x);
  float motion = smoothstep(0.0, 1.0, progress);
  float blurGradient = clamp(edge, 0.0, 1.0);
  float darkenGradient = clamp((edge - 0.2) / 0.8, 0.0, 1.0);
  float effect = motion * pow(darkenGradient, 1.35);
  float radius = 72.0 * motion * pow(blurGradient, 1.35);
  vec2 aa = max(fwidth(sourceUV), uiPixel * 0.5);
  vec2 dx = dFdx(sourceUV) / uiPixel;
  vec2 dy = dFdy(sourceUV) / uiPixel;
  float baseLod = log2(max(1.0, max(length(dx), length(dy))));
  vec2 coverage = smoothstep(-aa, aa, sourceUV)
    * (1.0 - smoothstep(vec2(1.0) - aa, vec2(1.0) + aa, sourceUV));
  vec3 color = textureLod(map, clamp(sourceUV, vec2(0.0), vec2(1.0)), baseLod).rgb * coverage.x * coverage.y;
  if (radius > 0.0) {
    float lod = max(baseLod, log2(max(1.0, radius)));
    vec2 footprint = max(aa, uiPixel * radius * 0.75);
    color = vec3(0.0);
    for (int y = -2; y <= 2; y++) {
      for (int x = -2; x <= 2; x++) {
        float wx = x == 0 ? 6.0 : (abs(x) == 1 ? 4.0 : 1.0);
        float wy = y == 0 ? 6.0 : (abs(y) == 1 ? 4.0 : 1.0);
        vec2 sampleUV = sourceUV + vec2(float(x), float(y)) * uiPixel * radius;
        vec2 coverage = smoothstep(-footprint, footprint, sampleUV)
          * (1.0 - smoothstep(vec2(1.0) - footprint, vec2(1.0) + footprint, sampleUV));
        color += textureLod(map, clamp(sampleUV, vec2(0.0), vec2(1.0)), lod).rgb
          * coverage.x * coverage.y * wx * wy / 256.0;
      }
    }
  }
  return color * (1.0 - min(1.0, effect * 2.0));
}
`;

// The camera half stays in its original transform; only the cover half
// rotates, and the continuous screen bends through a narrow strip at the
// hinge instead of creasing.
const FOLD_SHADER = `
uniform float foldAngle;
vec2 rotateHinge(vec2 p) {
  float c = cos(foldAngle), s = sin(foldAngle);
  p.y -= ${HINGE_Z};
  return vec2(c * p.x + s * p.y, -s * p.x + c * p.y + ${HINGE_Z});
}
#ifdef FLEXIBLE_SCREEN
vec4 bendStrip(vec3 p) {
  float halfWidth = 0.35;
  if (p.x >= halfWidth) return vec4(p.x, p.z, 1.0, 0.0);
  if (p.x <= -halfWidth) return vec4(rotateHinge(p.xz), cos(foldAngle), -sin(foldAngle));
  float t = (p.x + halfWidth) / (2.0 * halfWidth);
  float t2 = t * t, t3 = t2 * t;
  vec2 a = rotateHinge(vec2(-halfWidth, p.z));
  vec2 b = vec2(halfWidth, p.z);
  vec2 ta = 2.0 * halfWidth * vec2(cos(foldAngle), -sin(foldAngle));
  vec2 tb = vec2(2.0 * halfWidth, 0.0);
  vec2 point = (2.0 * t3 - 3.0 * t2 + 1.0) * a + (t3 - 2.0 * t2 + t) * ta
    + (-2.0 * t3 + 3.0 * t2) * b + (t3 - t2) * tb;
  vec2 tangent = normalize((6.0 * t2 - 6.0 * t) * a + (3.0 * t2 - 4.0 * t + 1.0) * ta
    + (-6.0 * t2 + 6.0 * t) * b + (3.0 * t2 - 2.0 * t) * tb);
  return vec4(point, tangent);
}
#endif
`;

type ScreenKind = "inner" | "outer";

interface ScreenInfo {
  material: THREE.MeshBasicMaterial;
  // Partial: "launcher" is only fetched (and added here) on first use —
  // see loadTheme() in ./ui and cycleWallpaper() below.
  defaultTextures: Partial<Record<UITheme, THREE.CanvasTexture>>;
  frame: { value: THREE.Vector4 };
  gradient: { value: THREE.Vector2 };
  pixel: { value: THREE.Vector2 };
}

type MeshGroup = "fixed" | "moving" | "flexible";

interface MeshInfo {
  group: MeshGroup;
  localBox: THREE.Box3;
}

function injectFoldShader(
  material: THREE.Material,
  bend: { value: number },
  flexible: boolean,
  kind: ScreenKind | null,
  screens: Record<ScreenKind, ScreenInfo>,
): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.foldAngle = bend;
    if (kind) {
      shader.uniforms.uiFrame = screens[kind].frame;
      shader.uniforms.uiGradient = screens[kind].gradient;
      shader.uniforms.uiReferenceEye = { value: UI_REFERENCE_EYE };
      shader.uniforms.uiPixel = screens[kind].pixel;
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <map_pars_fragment>",
          `
            #include <map_pars_fragment>
            ${kind === "inner" ? "#define INNER_UI" : ""}
            ${SCREEN_SHADER}
          `,
        )
        .replace(
          "#include <map_fragment>",
          "diffuseColor.rgb *= screenColor();",
        );
      shader.vertexShader = `varying vec3 vUIPosition;\n${shader.vertexShader}`;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        `
          vUIPosition = transformed;
          #include <project_vertex>
        `,
      );
    }
    shader.vertexShader = `${flexible ? "#define FLEXIBLE_SCREEN\n" : ""}${FOLD_SHADER}\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      flexible
        ? `
          vec4 folded = bendStrip(position);
          vec3 transformed = vec3(folded.x, position.y, folded.y);
        `
        : `
          vec2 folded = rotateHinge(position.xz);
          vec3 transformed = vec3(folded.x, position.y, folded.y);
        `,
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <beginnormal_vertex>",
      `
        vec3 objectNormal = vec3(normal);
        ${flexible ? "vec4 strip = bendStrip(position); float a = atan(-strip.w, strip.z);" : "float a = foldAngle;"}
        objectNormal.x = cos(a) * normal.x + sin(a) * normal.z;
        objectNormal.z = -sin(a) * normal.x + cos(a) * normal.z;
      `,
    );
  };
  material.customProgramCacheKey = () =>
    `fold-${flexible ? "flex" : "rigid"}-${kind ?? "body"}`;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(0,0,0,0.55)");
  gradient.addColorStop(0.55, "rgba(0,0,0,0.25)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function rotateBoxCorners(box: THREE.Box3, angle: number): THREE.Box3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const out = new THREE.Box3();
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        const zz = z - HINGE_Z;
        out.expandByPoint(
          new THREE.Vector3(c * x + s * zz, y, -s * x + c * zz + HINGE_Z),
        );
      }
    }
  }
  return out;
}

export interface DuoSceneHandle {
  setColorway(name: Colorway): void;
  setFoldState(state: FoldState): void;
  setFoldProgress(
    t: number,
    opts?: { animate?: boolean; duration?: number },
  ): void;
  getFoldProgress(): number;
  setAutoPlay(playing: boolean): void;
  cycleWallpaper(): Promise<void>;
  flyTo(preset: CameraPreset): void;
  dispose(): void;
}

export interface DuoSceneCallbacks {
  onLoaded?: () => void;
  onError?: (err: unknown) => void;
  onFoldChange?: (progress: number) => void;
  onAutoPlayChange?: (playing: boolean) => void;
  /** 0–1, covering the model + its referenced textures (not the UI screen images). */
  onLoadProgress?: (progress: number) => void;
}

export async function createDuoScene(
  canvas: HTMLCanvasElement,
  callbacks: DuoSceneCallbacks = {},
): Promise<DuoSceneHandle> {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
  camera.position.set(20, 16, 70);

  // No real-time shadows: at this model's scale a shadow-mapped light needs
  // constant frustum/bias babysitting for no real payoff on a UI hero prop.
  // A soft, art-directed contact-shadow blob below reads just as well and
  // never acnes or peters out at a glancing angle.
  const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2a3a, 0.95);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff2e0, 2.4);
  key.position.set(18, 30, 22);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.6);
  fill.position.set(-14, 8, 24);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(COLORWAYS.midnight.rim, 1.6);
  rim.position.set(-20, 15, -20);
  scene.add(rim);

  const contactShadowTexture = createContactShadowTexture();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 28),
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minDistance = 8;
  controls.maxDistance = 90;
  controls.minPolarAngle = Math.PI * 0.18;
  controls.maxPolarAngle = Math.PI * 0.62;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.1;

  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const pauseAutoRotate = () => {
    controls.autoRotate = false;
    if (idleTimer) clearTimeout(idleTimer);
  };
  const scheduleAutoRotate = (delay = 2200) => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      controls.autoRotate = true;
    }, delay);
  };
  controls.addEventListener("start", pauseAutoRotate);
  controls.addEventListener("end", () => scheduleAutoRotate());

  // -- Fold state: a single live group, continuously deformable by a shader
  // uniform. See FOLD_SHADER above for the hinge-rotation / screen-bend math.
  const bend = { value: Math.PI }; // 0 = flat/open, PI = fully closed
  let foldProgress = 0; // 0 = folded (closed), 1 = unfolded (open)
  const progressProxy = { t: foldProgress };

  let uiTheme: UITheme = "wallpaper";

  // -- Load the model and its default screen content in parallel, not in
  // sequence: they're independent network resources, and on a slow
  // connection a waterfall here means waiting through both full download
  // times back to back instead of the slower of the two. A LoadingManager
  // tracks the model's own fetch *and* every texture USDLoader pulls in
  // while parsing it (both go through `manager`), giving a real completion
  // percentage instead of a bare spinner.
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, loaded, total) => {
    callbacks.onLoadProgress?.(total > 0 ? loaded / total : 0);
  };
  const loader = new USDLoader(manager);

  const onLoadError = (err: unknown): never => {
    callbacks.onError?.(err);
    throw err;
  };
  const [wallpaperTheme, model] = await Promise.all([
    loadWallpaperTheme().catch(onLoadError),
    loader.loadAsync(MODEL_URL).catch(onLoadError),
  ]);
  model.scale.multiplyScalar(MODEL_SCALE);
  model.updateMatrixWorld(true);

  const screens = {} as Record<ScreenKind, ScreenInfo>;
  for (const kind of ["inner", "outer"] as const) {
    const texture = new THREE.CanvasTexture(wallpaperTheme[kind]);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    screens[kind] = {
      material: new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
      defaultTextures: { wallpaper: texture },
      frame: {
        value: (kind === "inner" ? INNER_UI_FRAME : OUTER_UI_FRAME).clone(),
      },
      gradient: {
        value: new THREE.Vector2(kind === "inner" ? 0.5 : 0, kind === "inner" ? 0 : 1),
      },
      pixel: { value: new THREE.Vector2(1 / wallpaperTheme[kind].width, 1 / wallpaperTheme[kind].height) },
    };
  }

  // Fetches (once — cached by ./ui) and registers whichever theme isn't
  // loaded yet, so applyUITheme() below always has a texture to switch to.
  async function ensureTheme(theme: UITheme): Promise<void> {
    if (screens.inner.defaultTextures[theme]) return;
    const data = await loadTheme(theme);
    for (const kind of ["inner", "outer"] as const) {
      const texture = new THREE.CanvasTexture(data[kind]);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      screens[kind].defaultTextures[theme] = texture;
    }
  }

  function applyUITheme(): void {
    for (const kind of ["inner", "outer"] as const) {
      const screen = screens[kind];
      const texture = screen.defaultTextures[uiTheme];
      if (!texture) continue;
      screen.material.map = texture;
      screen.pixel.value.set(1 / texture.image.width, 1 / texture.image.height);
    }
  }

  async function cycleWallpaper(): Promise<void> {
    uiTheme = uiTheme === "wallpaper" ? "launcher" : "wallpaper";
    await ensureTheme(uiTheme);
    applyUITheme();
  }

  const phone = new THREE.Group();
  scene.add(phone);

  const meshInfos: MeshInfo[] = [];
  const frameCandidates: {
    material: THREE.MeshPhysicalMaterial;
    originalColor: THREE.Color;
  }[] = [];

  model.traverse((object) => {
    if (!(object as THREE.Mesh).isMesh) return;
    const obj = object as THREE.Mesh;
    const srcMat = (
      Array.isArray(obj.material) ? obj.material[0] : obj.material
    ) as THREE.MeshPhysicalMaterial;

    const geometry = obj.geometry.clone().applyMatrix4(obj.matrixWorld);
    geometry.translate(0, -HINGE_CENTER_Y, 0);

    let ancestor: THREE.Object3D | null = obj;
    while (
      ancestor &&
      ancestor.name !== MOVING_ROOT_NAME &&
      ancestor.name !== FIXED_ROOT_NAME
    )
      ancestor = ancestor.parent;
    const moving = ancestor?.name === MOVING_ROOT_NAME;
    const flexible = FLEXIBLE_MESH_NAMES.has(obj.name);
    const kind: ScreenKind | null =
      obj.name === INNER_SCREEN_MESH_NAME
        ? "inner"
        : obj.name === OUTER_SCREEN_MESH_NAME
          ? "outer"
          : null;

    if (kind) {
      const p = geometry.attributes.position;
      const uv = new Float32Array(p.count * 2);
      for (let i = 0; i < p.count; i++) {
        uv[i * 2] =
          kind === "inner"
            ? (p.getX(i) + 7.89935) / 15.7987
            : (-0.23396 - p.getX(i)) / 7.73936;
        uv[i * 2 + 1] =
          kind === "inner"
            ? (p.getY(i) + HINGE_CENTER_Y - 0.34562) / 11.1035
            : (p.getY(i) + HINGE_CENTER_Y - 0.27173) / 11.2513;
      }
      geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    }

    const material: THREE.Material = kind
      ? screens[kind].material
      : srcMat.clone();
    if (moving || flexible)
      injectFoldShader(material, bend, flexible, kind, screens);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = obj.name;
    mesh.frustumCulled = false;
    phone.add(mesh);

    geometry.computeBoundingBox();
    meshInfos.push({
      group: flexible ? "flexible" : moving ? "moving" : "fixed",
      localBox: geometry.boundingBox!.clone(),
    });

    if (!kind) {
      const c = srcMat.color;
      const luminance = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
      // Large light-colored titanium shell parts get recolored by
      // setColorway(); small dark trim (hinge, seals, lens rings) stays put —
      // matches how Apple's own colorways work in practice.
      if (!srcMat.map && luminance > 0.5) {
        frameCandidates.push({
          material: material as THREE.MeshPhysicalMaterial,
          originalColor: c.clone(),
        });
      }
    }
  });

  // Ground the model: sit the contact-shadow blob just under its lowest
  // point, in whichever direction the fold happens to push it.
  const restBox = new THREE.Box3().setFromObject(phone);
  ground.position.y = restBox.min.y - 0.3;

  function setColorway(name: Colorway): void {
    const def = COLORWAYS[name];
    for (const { material, originalColor } of frameCandidates) {
      const target =
        def.frame === null ? originalColor : new THREE.Color(def.frame);
      gsap.to(material.color, {
        r: target.r,
        g: target.g,
        b: target.b,
        duration: 0.8,
        ease: "power2.out",
      });
    }
    gsap.to(rim.color, toRGB(def.rim, 0.8));
  }

  function toRGB(hex: number, duration: number) {
    const c = new THREE.Color(hex);
    return { r: c.r, g: c.g, b: c.b, duration, ease: "power2.out" };
  }

  // -- Drive the fold from a single progress value in [0, 1]: 0 = folded
  // (closed), 1 = unfolded (open/flat). Everything else (slider, swipe,
  // buttons, auto-play) funnels through here — called every frame while
  // dragging or auto-playing, so it stays allocation-free.
  let outerScreenVisible = true;
  function applyProgress(t: number): void {
    foldProgress = THREE.MathUtils.clamp(t, 0, 1);
    bend.value = (1 - foldProgress) * Math.PI;
    // The outer screen lives on the back of the cover half; once the device
    // is flat/open it faces away from the viewer entirely, so fade it out.
    const visible = foldProgress < 0.98;
    if (visible !== outerScreenVisible) {
      outerScreenVisible = visible;
      screens.outer.material.color.setScalar(visible ? 1 : 0);
    }
    callbacks.onFoldChange?.(foldProgress);
  }
  applyProgress(0);

  function setFoldProgress(
    t: number,
    opts: { animate?: boolean; duration?: number } = {},
  ): void {
    const { animate = false, duration = 0.5 } = opts;
    gsap.killTweensOf(progressProxy);
    const target = THREE.MathUtils.clamp(t, 0, 1);
    if (!animate) {
      progressProxy.t = target;
      applyProgress(target);
      return;
    }
    gsap.to(progressProxy, {
      t: target,
      duration,
      ease: "power2.inOut",
      onUpdate: () => applyProgress(progressProxy.t),
    });
  }

  function setFoldState(state: FoldState): void {
    setFoldProgress(state === "unfolded" ? 1 : 0, {
      animate: true,
      duration: 0.7,
    });
    flyTo("hero");
  }

  // -- Swipe-to-fold: a touch/pointer drag directly on the canvas. The
  // gesture's dominant axis decides intent on the first few pixels of
  // movement — mostly vertical hands off to the fold, anything else is left
  // to OrbitControls so free orbiting (including tilt) still works exactly
  // as before.
  let dragMode: "idle" | "deciding" | "orbit" | "fold" = "idle";
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartProgress = 0;
  const DRAG_DEAD_ZONE = 8;
  const DRAG_RANGE_PX = 220;

  function onPointerDown(e: PointerEvent): void {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragMode = "deciding";
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartProgress = foldProgress;
    resetHoverTilt();
  }

  function onPointerMove(e: PointerEvent): void {
    if (dragMode === "idle" || dragMode === "orbit") return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (dragMode === "deciding") {
      if (Math.hypot(dx, dy) < DRAG_DEAD_ZONE) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.2) {
        dragMode = "fold";
        controls.enabled = false;
        pauseAutoRotate();
        setAutoPlay(false);
        gsap.killTweensOf(progressProxy);
      } else {
        dragMode = "orbit";
        return;
      }
    }
    e.preventDefault();
    const t = dragStartProgress - dy / DRAG_RANGE_PX;
    progressProxy.t = THREE.MathUtils.clamp(t, 0, 1);
    applyProgress(progressProxy.t);
  }

  function onPointerUp(): void {
    if (dragMode === "fold") {
      controls.enabled = true;
      scheduleAutoRotate();
      setFoldProgress(foldProgress >= 0.5 ? 1 : 0, {
        animate: true,
        duration: 0.35,
      });
    }
    dragMode = "idle";
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  // -- Idle parallax: while not orbiting or folding, the device tilts
  // gently toward the cursor — a "looking at you" ambient reaction, eased
  // toward a per-frame target in tick() rather than snapped directly, so it
  // never fights the drag gestures above.
  const HOVER_TILT = THREE.MathUtils.degToRad(6);
  let tiltTargetX = 0;
  let tiltTargetY = 0;

  function onHoverMove(e: PointerEvent): void {
    if (dragMode !== "idle") return;
    const rect = canvas.getBoundingClientRect();
    const nx = THREE.MathUtils.clamp(
      (e.clientX - rect.left) / rect.width - 0.5,
      -0.5,
      0.5,
    );
    const ny = THREE.MathUtils.clamp(
      (e.clientY - rect.top) / rect.height - 0.5,
      -0.5,
      0.5,
    );
    tiltTargetY = nx * HOVER_TILT * 2;
    tiltTargetX = -ny * HOVER_TILT * 2;
  }

  function resetHoverTilt(): void {
    tiltTargetX = 0;
    tiltTargetY = 0;
  }

  canvas.addEventListener("pointermove", onHoverMove);
  canvas.addEventListener("pointerleave", resetHoverTilt);

  // -- Auto-play: loop pause-open / fold-closed / pause-closed / fold-open.
  let autoPlaying = false;
  let autoPhase = 0;

  function setAutoPlay(playing: boolean): void {
    if (playing === autoPlaying) return;
    autoPlaying = playing;
    if (playing) {
      gsap.killTweensOf(progressProxy);
      autoPhase =
        1.2 +
        (Math.acos(THREE.MathUtils.clamp(2 * foldProgress - 1, -1, 1)) /
          Math.PI) *
          3.1;
    }
    callbacks.onAutoPlayChange?.(playing);
  }

  // -- Camera choreography: fit-to-box computed live from the *deformed*
  // geometry (rigid halves rotated by the current hinge angle), so every
  // preset frames correctly at any fold amount — not only at the endpoints.
  function liveBoxForMesh(info: MeshInfo): THREE.Box3 {
    if (info.group === "fixed") return info.localBox.clone();
    const rotated = rotateBoxCorners(info.localBox, bend.value);
    if (info.group === "moving") return rotated;
    return info.localBox.clone().union(rotated);
  }

  function liveBox(): THREE.Box3 {
    const box = new THREE.Box3();
    for (const info of meshInfos) box.union(liveBoxForMesh(info));
    return box;
  }

  function frameBox(
    box: THREE.Box3,
    theta: number,
    phi: number,
    padding: number,
  ) {
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.01);
    const fov = (camera.fov * Math.PI) / 180;
    const dist = (maxDim / 2 / Math.tan(fov / 2)) * padding;
    const pos = new THREE.Vector3(
      center.x + dist * Math.sin(phi) * Math.sin(theta),
      center.y + dist * Math.cos(phi),
      center.z + dist * Math.sin(phi) * Math.cos(theta),
    );
    return { pos, target: center };
  }

  function flyTo(preset: CameraPreset): void {
    let pos: THREE.Vector3;
    let target: THREE.Vector3;

    switch (preset) {
      case "front": {
        ({ pos, target } = frameBox(liveBox(), 0.15, 1.35, 1.4));
        break;
      }
      case "back": {
        ({ pos, target } = frameBox(liveBox(), Math.PI + 0.15, 1.35, 1.4));
        break;
      }
      case "macro": {
        // The camera bump sits on the fixed half, so its box never moves —
        // no need to run it through liveBoxForMesh.
        const macroBox = new THREE.Box3().setFromCenterAndSize(
          CAMERA_MODULE_CENTER,
          CAMERA_MODULE_SIZE,
        );
        ({ pos, target } = frameBox(macroBox, Math.PI - 0.25, 1.2, 2.2));
        break;
      }
      case "hero":
      default: {
        ({ pos, target } = frameBox(liveBox(), 0.35, 1.3, 1.6));
        break;
      }
    }

    animateCameraTo(pos, target);
  }

  function animateCameraTo(
    pos: THREE.Vector3,
    target: THREE.Vector3,
    duration = 1.1,
  ): void {
    pauseAutoRotate();
    controls.enabled = false;
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const proxy = { t: 0 };
    gsap.to(proxy, {
      t: 1,
      duration,
      ease: "power3.inOut",
      onUpdate: () => {
        camera.position.lerpVectors(startPos, pos, proxy.t);
        controls.target.lerpVectors(startTarget, target, proxy.t);
        controls.update();
      },
      onComplete: () => {
        controls.enabled = true;
        scheduleAutoRotate();
      },
    });
  }

  function resize(): void {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  let lastTime = performance.now();
  let raf = 0;
  function tick(): void {
    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (autoPlaying) {
      autoPhase = (autoPhase + delta) % 8.6;
      let angle: number; // 0..180, 180 = flat/open
      if (autoPhase < 1.2) angle = 180;
      else if (autoPhase < 4.3)
        angle = 90 * (1 + Math.cos(((autoPhase - 1.2) / 3.1) * Math.PI));
      else if (autoPhase < 5.5) angle = 0;
      else angle = 90 * (1 - Math.cos(((autoPhase - 5.5) / 3.1) * Math.PI));
      applyProgress(angle / 180);
    }

    // Ease the idle parallax tilt toward its target every frame — a fixed
    // per-frame factor rather than a delta-scaled one, since this is a
    // cosmetic damped-spring feel, not a physically timed motion.
    phone.rotation.x += (tiltTargetX - phone.rotation.x) * 0.08;
    phone.rotation.y += (tiltTargetY - phone.rotation.y) * 0.08;

    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  tick();

  // Settle into the default framing (closed) once geometry is in the scene.
  flyTo("hero");
  canvas.style.opacity = "1";
  callbacks.onLoaded?.();

  function dispose(): void {
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    canvas.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    canvas.removeEventListener("pointermove", onHoverMove);
    canvas.removeEventListener("pointerleave", resetHoverTilt);
    gsap.killTweensOf(progressProxy);

    // Release GPU resources: every mesh's geometry and (cloned, so not
    // shared with the source asset) material, plus the two screen
    // materials' canvas textures, the ground, and the PMREM environment.
    for (const mesh of phone.children) {
      if (!(mesh instanceof THREE.Mesh)) continue;
      mesh.geometry.dispose();
      if (
        mesh.material !== screens.inner.material &&
        mesh.material !== screens.outer.material
      ) {
        (mesh.material as THREE.Material).dispose();
      }
    }
    for (const kind of ["inner", "outer"] as const) {
      screens[kind].material.dispose();
      for (const theme of Object.keys(
        screens[kind].defaultTextures,
      ) as UITheme[]) {
        screens[kind].defaultTextures[theme]?.dispose();
      }
    }
    ground.geometry.dispose();
    (ground.material as THREE.Material).dispose();
    contactShadowTexture.dispose();
    scene.environment?.dispose();

    controls.dispose();
    renderer.dispose();
    pmrem.dispose();
  }

  return {
    setColorway,
    setFoldState,
    setFoldProgress,
    getFoldProgress: () => foldProgress,
    setAutoPlay,
    cycleWallpaper,
    flyTo,
    dispose,
  };
}
