"""Fetch Apple's official iPhone Duo reference assets for /demo/iphone-duo/ and
write them straight into public/iphone-duo/. These are Apple's own assets, not
ours — see the README's "Week 3 Demo" section for the redistribution note —
so this script re-downloads and re-derives them from apple.com each time
rather than them being treated as source to hand-edit. Requires usd-core; see
scripts/requirements-iphone-duo-assets.txt.

Adapted from https://github.com/jadon7/iphone-duo (MIT), whose fold-preview
technique src/app/demo/iphone-duo/scene.ts is built on.
"""

import tempfile
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen, urlretrieve
from zipfile import ZipFile

from PIL import Image
from pxr import Sdf, Usd

root = Path(__file__).resolve().parents[1]
out = root / "public" / "iphone-duo"
models = out / "models"
textures = models / "textures"
ui = out / "ui"
textures.mkdir(parents=True, exist_ok=True)
ui.mkdir(parents=True, exist_ok=True)

with tempfile.TemporaryDirectory() as tmp:
    # Downloaded to a temp dir, not public/iphone-duo/, because the raw
    # .usdz is only an intermediate (its textures get extracted and its
    # geometry gets flattened into models/iPhone_Duo_Render.usdc below) —
    # scene.ts never loads it directly, so there's no reason to ship it.
    model = Path(tmp) / "iPhone_Duo_Star_White.usdz"
    model_url = "https://www.apple.com/105/media/us/iphone-duo/2026/9305e4b9-72d9-4c05-9381-b572adadd5e5/ar/iPhone_Duo_e-sim_Star-White_Variant.usdz"
    print("Downloading the Apple reference model...", flush=True)
    urlretrieve(model_url, model)

    with ZipFile(model) as archive:
        for name in archive.namelist():
            if Path(name).suffix.lower() in {".png", ".jpg", ".jpeg", ".avif"}:
                (textures / Path(name).name).write_bytes(archive.read(name))

    print("Preparing the unfolded pose...", flush=True)
    stage = Usd.Stage.Open(str(model))
    stage.GetDefaultPrim().GetVariantSet("Pose").SetVariantSelection("Landscape")
    flattened = Usd.Stage.Open(stage.Flatten())
    for prim in flattened.Traverse():
        for attribute in prim.GetAttributes():
            value = attribute.Get()
            if isinstance(value, Sdf.AssetPath) and value.path:
                # Flattening resolves USDZ references to package paths; use local texture paths for the browser.
                filename = Path(value.path.split("[")[-1].rstrip("]")).name
                attribute.Set(Sdf.AssetPath(f"textures/{filename}"))
    flattened.GetRootLayer().Export(str(models / "iPhone_Duo_Render.usdc"))

clock_base = (
    "https://www.apple.com/v/iphone-duo/a/static/uploads/dIFKSKvliUSYOBw/MszYeqEKDgnBqxc/CRqwzvoYesuhNwK"
)
hig_base = "https://developer.apple.com/tutorials/images/com.apple.HIG"
ui_downloads = {
    "clock-inner.avif": f"{clock_base}/lockscreen_ui_inner-wallpaper_png.avif",
    "clock-outer.avif": f"{clock_base}/lockscreen_ui_outer-wallpaper_png.avif",
}
# Apple serves these as ~1-1.2MB lossless PNGs; re-encoded to JPEG for the
# browser (the region ui.ts actually crops to has no real transparency left
# once cropped) at ~8x smaller with no visible quality loss at the size
# they're drawn.
launcher_sources = {
    "launcher-inner.jpg": f"{hig_base}/designing-for-iphone-hero-inside@2x.png",
    "launcher-outer.jpg": f"{hig_base}/designing-for-iphone-hero-outside@2x.png",
}

(ui / "wallpaper-inner.avif").write_bytes((textures / "bRLlvSMXjHGTFMA.avif").read_bytes())
for filename, url in ui_downloads.items():
    print(f"Downloading {filename}...", flush=True)
    urlretrieve(url, ui / filename)
for filename, url in launcher_sources.items():
    print(f"Downloading and re-encoding {filename}...", flush=True)
    with urlopen(url) as response:
        png_bytes = response.read()
    Image.open(BytesIO(png_bytes)).convert("RGB").save(ui / filename, "JPEG", quality=88, optimize=True)

print("Assets ready in public/iphone-duo/.")
