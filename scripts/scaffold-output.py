#!/usr/bin/env python3
"""Create a reliable VibeReading V2 output scaffold.

The scaffold copies the shared runtime instead of asking agents to rebuild it.
Book-specific work should happen in the generated app.js, style.css,
space-spec.json, bgm-meta.json, and local assets.

Cross-platform note: on Windows the ``python3`` command may not exist.
Invoke via ``python scripts/scaffold-output.py`` (or ``python3`` on
Unix/macOS) — both work.
"""

import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

APP_TEMPLATE = """/* [SCAFFOLD — replace with book-specific app.js before delivery] */
window.VIBE_READING_SPEC = {
  book: { title: "Untitled", author: "" },
  template: { primary: "window", reason: "" },
  entryGuide: { durationSec: 20, steps: [], soundRequiredAfterStart: true },
  audio: { bgmFile: "./assets/audio/bgm.mp3", ambienceFiles: [] },
  weather: { defaultLevel: "low" },
  assets: { images: [] },
  stages: []
};

window.addEventListener("vibereading:stage", (event) => {
  document.documentElement.style.setProperty("--book-accent", event.detail.stage.uiAccent || "");
});
"""

STYLE_TEMPLATE = """* { box-sizing: border-box; }
html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
.vr-scene { position: fixed; inset: 0; aspect-ratio: 16 / 9; overflow: hidden; }
.vr-scene-image { width: 100%; height: 100%; object-fit: cover; }
.vr-weather-layer { position: absolute; inset: 0; pointer-events: none; }
"""

SPACE_SPEC_TEMPLATE = """{
  "book": { "title": "Untitled", "author": "" },
  "template": { "primary": "window", "reason": "" },
  "layout": {
    "aspectRatio": "16:9",
    "scrim": "fixed-light",
    "companionPanel": "window-bottom-center"
  },
  "assets": {
    "images": []
  },
  "entryGuide": {
    "durationSec": 20,
    "soundRequiredAfterStart": true,
    "motion": "window-fog-clear",
    "steps": []
  },
  "audio": {
    "bgmFile": "./assets/audio/bgm.mp3",
    "ambienceFiles": [],
    "isInstrumental": true
  },
  "weather": { "defaultLevel": "low" },
  "stages": []
}
"""

BGM_META_TEMPLATE = """{
  "status": "failed",
  "is_instrumental": true,
  "file": "./assets/audio/bgm.mp3",
  "fallback": []
}
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    output = Path(args.output_dir).resolve()
    runtime = output / "runtime"
    audio = output / "assets" / "audio"
    images = output / "assets" / "images"

    runtime.mkdir(parents=True, exist_ok=True)
    (runtime / "libs").mkdir(parents=True, exist_ok=True)
    audio.mkdir(parents=True, exist_ok=True)
    images.mkdir(parents=True, exist_ok=True)

    shutil.copy2(ROOT / "runtime" / "page-shell.html", output / "index.html")
    shutil.copy2(ROOT / "runtime" / "v2-runtime.js", runtime / "v2-runtime.js")
    shutil.copy2(ROOT / "runtime" / "v2-runtime.css", runtime / "v2-runtime.css")
    shutil.copy2(ROOT / "runtime" / "libs" / "p5.min.js", runtime / "libs" / "p5.min.js")

    (output / "app.js").write_text(APP_TEMPLATE, encoding="utf-8")
    (output / "style.css").write_text(STYLE_TEMPLATE, encoding="utf-8")
    (output / "space-spec.json").write_text(SPACE_SPEC_TEMPLATE, encoding="utf-8")
    (output / "bgm-meta.json").write_text(BGM_META_TEMPLATE, encoding="utf-8")

    print(f"[READY] {output}")


if __name__ == "__main__":
    main()
