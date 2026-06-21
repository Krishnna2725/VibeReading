#!/usr/bin/env python3
"""Create a reliable VibeReading V2 output scaffold.

The scaffold copies the shared runtime instead of asking agents to rebuild it.
Book-specific work should happen in the generated app.js, style.css,
space-spec.json, bgm-meta.json, and local assets.

Cross-platform note: on Windows the ``python3`` command may not exist.
Invoke via ``python scripts/scaffold-output.py`` (or ``python3`` on
Unix/macOS); both work.
"""

import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

APP_TEMPLATE = """/* [SCAFFOLD - replace with book-specific app.js before delivery] */
/* Required capability hooks may be authored in index.html or created here:
   data-vr-guide-start, data-vr-stage, data-vr-sound-toggle,
   data-vr-timer-toggle, data-vr-timer-mode.
   Their visual form belongs to the selected template. */
window.VIBE_READING_SPEC = {
  book: { title: "Untitled", author: "" },
  template: { primary: "", reason: "" },
  entryGuide: { durationSec: 20, steps: [], soundRequiredAfterStart: true, motion: "" },
  audio: {
    bgmFile: "./assets/audio/bgm.mp3",
    ambienceFiles: {}
  },
  weather: { defaultLevel: "medium" },
  assets: { images: [] },
  stages: []
};

window.addEventListener("vibereading:stage", (event) => {
  document.documentElement.style.setProperty("--book-accent", event.detail.stage.uiAccent || "");
});
"""

STYLE_TEMPLATE = """* { box-sizing: border-box; }
html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
.vr-shell { width: 100%; height: 100%; }
.vr-scene { position: fixed; inset: 0; aspect-ratio: 16 / 9; overflow: hidden; }
.vr-scene-slot, .vr-companion-root { position: relative; z-index: 5; }
.vr-scene-image { width: 100%; height: 100%; object-fit: cover; }
.vr-weather-layer { position: absolute; inset: 0; pointer-events: none; }
"""

SPACE_SPEC_TEMPLATE = {
    "book": {"title": "Untitled", "author": ""},
    "template": {"primary": "", "reason": ""},
    "layout": {
        "aspectRatio": "16:9",
    },
    "assets": {
        "images": [],
    },
    "audio": {
        "bgmFile": "./assets/audio/bgm.mp3",
        "ambienceFiles": {},
        "isInstrumental": True,
    },
    "weather": {"defaultLevel": "medium"},
    "stages": [],
    "companion": {
        "entry": "",
        "behavior": "",
        "controls": [],
    },
    "effects": {
        "weatherKinds": [],
        "guideMotion": "",
    },
    "entryGuide": {
        "durationSec": 20,
        "soundRequiredAfterStart": True,
        "motion": "",
        "steps": [],
    },
}

BGM_META_TEMPLATE = {
    "status": "failed",
    "is_instrumental": True,
    "file": "./assets/audio/bgm.mp3",
    "reason": "",
}


def write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")


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
    write_json(output / "space-spec.json", SPACE_SPEC_TEMPLATE)
    write_json(output / "bgm-meta.json", BGM_META_TEMPLATE)

    print(f"[READY] {output}")


if __name__ == "__main__":
    main()
