import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap } from "gsap";

/**
 * The source glTF has NO hinge joint or morph targets — it's two separate,
 * fully-rigid meshes baked in their own rest pose ("Apple iPhone Duo_1" =
 * closed phone, "Apple iPhone Duo_2" = open tablet). There is no vertex
 * correspondence between them, so a continuous open/close *angle* cannot be
 * derived from this asset without re-rigging it in 3D software. What IS
 * genuinely programmatic here: material color (titanium finish), screen
 * texture content, camera framing/choreography, and which of the two real
 * baked states is visible (swapped with a directed transition, not faked
 * geometry).
 */

export type FoldState = "folded" | "unfolded";
export type Colorway = "starlight" | "midnight";
export type CameraPreset = "hero" | "front" | "back" | "macro";

interface ColorwayDef {
  frame: number;
  dark: number;
  rim: number;
}

const COLORWAYS: Record<Colorway, ColorwayDef> = {
  starlight: { frame: 0xf3efe4, dark: 0xd9d3c2, rim: 0xd8b26b },
  midnight: { frame: 0x0a0b0f, dark: 0x1a1a1e, rim: 0x6e6bff },
};

// GLTFLoader sanitizes node names (spaces -> underscores) when building the
// Object3D graph, so these must match the *sanitized* form, not the raw
// glTF JSON name ("Apple iPhone Duo_1").
const GROUP_NAMES: Record<FoldState, string> = {
  folded: "Apple_iPhone_Duo_1",
  unfolded: "Apple_iPhone_Duo_2",
};

export interface DuoSceneHandle {
  setColorway(name: Colorway): void;
  setFoldState(state: FoldState): void;
  cycleWallpaper(): void;
  flyTo(preset: CameraPreset): void;
  dispose(): void;
}

export interface DuoSceneCallbacks {
  onLoaded?: () => void;
  onError?: (err: unknown) => void;
}

export async function createDuoScene(
  canvas: HTMLCanvasElement,
  modelUrl: string,
  callbacks: DuoSceneCallbacks = {},
): Promise<DuoSceneHandle> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
  camera.position.set(0.6, 0.5, 2.4);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.7);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff2e0, 2.2);
  key.position.set(2, 3, 2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 10;
  key.shadow.bias = -0.0015;
  scene.add(key);

  const rim = new THREE.DirectionalLight(COLORWAYS.midnight.rim, 1.4);
  rim.position.set(-2, 1.5, -2);
  scene.add(rim);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.ShadowMaterial({ opacity: 0.32 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.32;
  ground.receiveShadow = true;
  scene.add(ground);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  // Zoom is deliberately off: OrbitControls captures wheel events for
  // dolly-zoom by default, which hijacks page scroll the instant the
  // cursor rests over the canvas (bit us with <model-viewer> earlier
  // for the same reason). Framing is handled entirely via flyTo presets.
  controls.enableZoom = false;
  controls.minDistance = 0.6;
  controls.maxDistance = 6;
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

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(modelUrl).catch((err) => {
    callbacks.onError?.(err);
    throw err;
  });

  const root = gltf.scene;
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  scene.add(root);

  const foldedNode = root.getObjectByName(GROUP_NAMES.folded);
  const unfoldedNode = root.getObjectByName(GROUP_NAMES.unfolded);
  if (!foldedNode || !unfoldedNode) {
    // If either lookup fails, falling back to `root` for both would alias
    // them to the same object — hiding one would hide the whole model.
    // Surface this loudly and keep both visible instead of going blank.
    console.error(
      "[DuoScene] expected node(s) not found in the glTF scene graph:",
      !foldedNode ? GROUP_NAMES.folded : null,
      !unfoldedNode ? GROUP_NAMES.unfolded : null,
    );
  }
  const groups: Record<FoldState, THREE.Object3D> = {
    folded: foldedNode ?? root,
    unfolded: unfoldedNode ?? root,
  };

  // Materials are shared by name across both baked instances (glTF
  // deduplicates by material index), which is exactly what we want for
  // color: one tween recolors the frame on both states identically.
  const materials: Record<string, THREE.MeshStandardMaterial> = {};
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        if (mat instanceof THREE.MeshStandardMaterial && !materials[mat.name]) {
          materials[mat.name] = mat;
        }
      }
    }
  });

  const frameMat = materials["Frame (Night Sky)"];
  const darkMat = materials["Dark"];
  const innerScreenMat = materials["Screen.001"];
  const outerScreenMat = materials["Screen.002"];

  // -- Screen content: a runtime-drawn wallpaper cycles in alongside the
  // model's own baked textures, proving the map is genuinely swappable.
  function makeWallpaper(top: string, bottom: string, label: string): THREE.CanvasTexture {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 1024;
    const ctx = c.getContext("2d") as CanvasRenderingContext2D;
    const grad = ctx.createLinearGradient(0, 0, 0, c.height);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "700 108px system-ui, -apple-system, sans-serif";
    ctx.fillText("9:41", c.width / 2, c.height * 0.34);
    ctx.font = "500 30px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(label, c.width / 2, c.height * 0.41);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;
    tex.needsUpdate = true;
    return tex;
  }

  const wallpapers: { inner?: THREE.Texture; outer?: THREE.Texture }[] = [
    { inner: innerScreenMat?.map ?? undefined, outer: outerScreenMat?.map ?? undefined },
    {
      inner: makeWallpaper("#1c1c26", "#05050a", "iPhone Duo"),
      outer: makeWallpaper("#1c1c26", "#05050a", "iPhone Duo"),
    },
    {
      inner: makeWallpaper("#3a2a10", "#0a0603", "Starlight"),
      outer: makeWallpaper("#3a2a10", "#0a0603", "Starlight"),
    },
  ];
  let wallpaperIndex = 0;

  function cycleWallpaper(): void {
    wallpaperIndex = (wallpaperIndex + 1) % wallpapers.length;
    const set = wallpapers[wallpaperIndex];
    if (innerScreenMat && set.inner) {
      innerScreenMat.map = set.inner;
      innerScreenMat.needsUpdate = true;
    }
    if (outerScreenMat && set.outer) {
      outerScreenMat.map = set.outer;
      outerScreenMat.needsUpdate = true;
    }
  }

  function setColorway(name: Colorway): void {
    const target = COLORWAYS[name];
    if (frameMat) gsap.to(frameMat.color, toRGB(target.frame, 0.8));
    if (darkMat) gsap.to(darkMat.color, toRGB(target.dark, 0.8));
    gsap.to(rim.color, toRGB(target.rim, 0.8));
  }

  function toRGB(hex: number, duration: number) {
    const c = new THREE.Color(hex);
    return { r: c.r, g: c.g, b: c.b, duration, ease: "power2.out" };
  }

  // -- Fold state: swap which baked instance is visible. The swap itself
  // is masked by a quick canvas dip (a directed "cut", not a fake hinge),
  // and the incoming group pops in with a soft scale-in for flourish.
  let currentFold: FoldState = "folded";
  if (groups.folded !== groups.unfolded) groups.unfolded.visible = false;

  function setFoldState(state: FoldState): void {
    if (state === currentFold) {
      flyTo("hero");
      return;
    }
    currentFold = state;
    const incoming = groups[state];
    const outgoing = groups[state === "folded" ? "unfolded" : "folded"];

    gsap
      .timeline()
      .to(canvas, { opacity: 0.06, duration: 0.3, ease: "power2.in" })
      .add(() => {
        outgoing.visible = false;
        incoming.visible = true;
        incoming.scale.setScalar(0.92);
      })
      .to(incoming.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: "back.out(1.6)" }, ">-0.05")
      .to(canvas, { opacity: 1, duration: 0.5, ease: "power2.out" }, "<");

    flyTo("hero");
  }

  // -- Camera choreography: fit-to-box computed live from real geometry
  // (no more guessed camera-target coordinates), so every preset frames
  // correctly regardless of which state is currently visible.
  function fitBox(obj: THREE.Object3D, theta: number, phi: number, padding: number) {
    const box = new THREE.Box3().setFromObject(obj);
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

  function activeGroup(): THREE.Object3D {
    return groups[currentFold];
  }

  function findDescendant(root: THREE.Object3D, names: string[]): THREE.Object3D | null {
    for (const name of names) {
      const found = root.getObjectByName(name);
      if (found) return found;
    }
    return null;
  }

  function flyTo(preset: CameraPreset): void {
    let pos: THREE.Vector3;
    let target: THREE.Vector3;

    switch (preset) {
      case "front": {
        ({ pos, target } = fitBox(activeGroup(), 0.15, 1.35, 1.4));
        break;
      }
      case "back": {
        ({ pos, target } = fitBox(activeGroup(), Math.PI + 0.15, 1.35, 1.4));
        break;
      }
      case "macro": {
        // GLTFLoader sanitizes node names for safe animation-path binding
        // (strips spaces AND dots), so "Camera.001" becomes "Camera001".
        // The camera bump sits on the BACK of the device, so this needs
        // roughly the same theta/phi as "back", just tighter.
        const cam = findDescendant(activeGroup(), ["Camera", "Camera001"]);
        ({ pos, target } = fitBox(cam ?? activeGroup(), Math.PI - 0.35, 1.3, cam ? 2.4 : 1.4));
        break;
      }
      case "hero":
      default: {
        ({ pos, target } = fitBox(activeGroup(), 0.35, 1.3, 1.6));
        break;
      }
    }

    animateCameraTo(pos, target);
  }

  function animateCameraTo(pos: THREE.Vector3, target: THREE.Vector3, duration = 1.1): void {
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

  let raf = 0;
  function tick(): void {
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  tick();

  // Settle into the default framing once geometry is in the scene.
  flyTo("hero");
  canvas.style.opacity = "1";
  callbacks.onLoaded?.();

  function dispose(): void {
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    controls.dispose();
    renderer.dispose();
    pmrem.dispose();
  }

  return { setColorway, setFoldState, cycleWallpaper, flyTo, dispose };
}
