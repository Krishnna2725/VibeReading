#!/usr/bin/env python3
"""创建可靠的 V2 输出骨架，避免 Agent 自行拼装共享运行时。"""

import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

APP_TEMPLATE = """window.VIBE_READING_SPEC = {
  book: { title: "待填写", author: "" },
  entryGuide: { durationSec: 20, steps: [], soundRequiredAfterStart: true },
  audio: { bgmFile: "./assets/audio/bgm.mp3", ambienceFiles: [] },
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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()
    output = Path(args.output_dir).resolve()
    runtime = output / "runtime"
    audio = output / "assets" / "audio"
    prompts = output / "prompts"
    runtime.mkdir(parents=True, exist_ok=True)
    audio.mkdir(parents=True, exist_ok=True)
    prompts.mkdir(parents=True, exist_ok=True)

    shutil.copy2(ROOT / "runtime" / "page-shell.html", output / "index.html")
    shutil.copy2(ROOT / "runtime" / "v2-runtime.js", runtime / "v2-runtime.js")
    shutil.copy2(ROOT / "runtime" / "v2-runtime.css", runtime / "v2-runtime.css")
    (output / "app.js").write_text(APP_TEMPLATE, encoding="utf-8")
    (output / "style.css").write_text(STYLE_TEMPLATE, encoding="utf-8")
    (prompts / "image.txt").write_text("REPLACE_WITH_FINAL_VISUAL_PROMPT", encoding="utf-8")
    (prompts / "bgm.txt").write_text("REPLACE_WITH_FINAL_INSTRUMENTAL_BGM_PROMPT", encoding="utf-8")
    print(f"[READY] {output}")


if __name__ == "__main__":
    main()
