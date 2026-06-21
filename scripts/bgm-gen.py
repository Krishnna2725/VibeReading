#!/usr/bin/env python3
"""Background BGM generator for VibeReading.

Agents should only use:

  python scripts/bgm-gen.py start --prompt "..." --output-dir output/xxx
  python scripts/bgm-gen.py status --output-dir output/xxx

`start` returns immediately. A detached worker waits for MiniMax, downloads the
audio file, and writes bgm-meta.json. Do not skip BGM because the API is slow.
"""

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

API_URL = "https://api.minimaxi.com/v1/music_generation"
MODEL = "music-2.6-free"


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(data, ensure_ascii=True, indent=2), encoding="utf-8")
    temp.replace(path)


def paths(output_dir):
    root = Path(output_dir).resolve()
    return {
        "root": root,
        "audio": root / "assets" / "audio" / "bgm.mp3",
        "meta": root / "bgm-meta.json",
        "job": root / "bgm-job.json",
        "log": root / "bgm-generation.log",
    }


def pending_meta():
    return {
        "status": "pending",
        "is_instrumental": True,
        "file": "./assets/audio/bgm.mp3",
        "reason": "Background generation is running. Check later with status. Do not change this to skipped because the API is slow.",
    }


def final_meta(status, reason="", reused_from=""):
    meta = {
        "status": status,
        "is_instrumental": True,
        "file": "./assets/audio/bgm.mp3",
        "reason": reason,
    }
    if reused_from:
        meta["reused_from"] = reused_from
    return meta


def read_prompt(args):
    return (args.prompt or "").strip()


def start_job(args):
    prompt = read_prompt(args)
    if not prompt:
        raise SystemExit("[FAIL] Provide --prompt")

    target = paths(args.output_dir)
    target["root"].mkdir(parents=True, exist_ok=True)
    target["audio"].parent.mkdir(parents=True, exist_ok=True)
    started_at = int(time.time())

    if target["audio"].exists() and not args.force:
        write_json(target["meta"], final_meta("generated", "Target BGM already exists; generation was not repeated."))
        write_json(target["job"], {
            "status": "generated",
            "startedAt": started_at,
            "finishedAt": started_at,
            "outputDir": str(target["root"]),
        })
        print(f"[READY] {target['audio']}")
        return

    write_json(target["meta"], pending_meta())
    write_json(target["job"], {
        "status": "pending",
        "pid": None,
        "startedAt": started_at,
        "outputDir": str(target["root"]),
    })

    command = [
        sys.executable,
        str(Path(__file__).resolve()),
        "_worker",
        "--prompt",
        prompt,
        "--output-dir",
        str(target["root"]),
        "--started-at",
        str(started_at),
    ]

    with target["log"].open("a", encoding="utf-8") as log:
        options = {"stdin": subprocess.DEVNULL, "stdout": log, "stderr": log, "close_fds": True}
        if os.name == "nt":
            options["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS
        else:
            options["start_new_session"] = True
        process = subprocess.Popen(command, **options)

    write_json(target["job"], {
        "status": "running",
        "pid": process.pid,
        "startedAt": started_at,
        "outputDir": str(target["root"]),
    })
    print(f"[STARTED] Background BGM job PID={process.pid}")
    print(f"[STATUS]  python scripts/bgm-gen.py status --output-dir \"{target['root']}\"")


def run_curl(api_key, prompt):
    payload = json.dumps({
        "model": MODEL,
        "prompt": prompt,
        "is_instrumental": True,
        "output_format": "url",
        "audio_setting": {"sample_rate": 44100, "bitrate": 256000, "format": "mp3"},
    })
    result = subprocess.run(
        [
            "curl", "-sS", "-X", "POST", API_URL,
            "-H", f"Authorization: Bearer {api_key}",
            "-H", "Content-Type: application/json",
            "--connect-timeout", "30",
            "--max-time", "1200",
            "-d", payload,
        ],
        capture_output=True,
        text=True,
        timeout=1230,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        raise RuntimeError(f"MiniMax request failed: {result.stderr.strip()}")
    try:
        response = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise RuntimeError(f"MiniMax returned non-JSON output: {result.stdout[:300]}") from error
    status_code = response.get("base_resp", {}).get("status_code", -1)
    if status_code != 0:
        message = response.get("base_resp", {}).get("status_msg", "unknown error")
        raise RuntimeError(f"MiniMax API error {status_code}: {message}")
    audio_url = response.get("data", {}).get("audio")
    if not audio_url:
        raise RuntimeError("MiniMax response did not include an audio URL")
    return audio_url


def download(url, output):
    result = subprocess.run(
        ["curl", "-sS", "-L", "--connect-timeout", "30", "--max-time", "300", "-o", str(output), url],
        capture_output=True,
        text=True,
        timeout=330,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        raise RuntimeError(f"BGM download failed: {result.stderr.strip()}")
    if not output.exists() or output.stat().st_size < 1000:
        raise RuntimeError("Downloaded BGM file is missing or too small")


def worker(args):
    target = paths(args.output_dir)
    prompt = args.prompt.strip()
    started_at = int(args.started_at)
    api_key = os.environ.get("MINIMAX_API_KEY", "").strip()
    try:
        if not api_key:
            raise RuntimeError("Environment variable MINIMAX_API_KEY is not set")
        audio_url = run_curl(api_key, prompt)
        download(audio_url, target["audio"])
        finished_at = int(time.time())
        write_json(target["meta"], final_meta("generated"))
        write_json(target["job"], {
            "status": "generated",
            "startedAt": started_at,
            "finishedAt": finished_at,
            "outputDir": str(target["root"]),
        })
        print(f"[DONE] {target['audio']}", flush=True)
    except Exception as error:
        finished_at = int(time.time())
        write_json(target["meta"], final_meta("failed", str(error)))
        write_json(target["job"], {
            "status": "failed",
            "startedAt": started_at,
            "finishedAt": finished_at,
            "reason": str(error),
            "outputDir": str(target["root"]),
        })
        print(f"[FAIL] {error}", file=sys.stderr, flush=True)
        raise SystemExit(1)


def status(args):
    target = paths(args.output_dir)
    if not target["meta"].exists():
        print("[MISSING] bgm-meta.json does not exist")
        raise SystemExit(2)
    meta = json.loads(target["meta"].read_text(encoding="utf-8"))
    state = meta.get("status", "missing")
    print(json.dumps(meta, ensure_ascii=True, indent=2))
    if state == "generated" and target["audio"].exists() and target["audio"].stat().st_size >= 1000:
        raise SystemExit(0)
    if state == "reused" and target["audio"].exists() and target["audio"].stat().st_size >= 1000:
        raise SystemExit(0)
    if state == "failed":
        raise SystemExit(1)
    raise SystemExit(2)


def build_parser():
    parser = argparse.ArgumentParser(description="VibeReading background BGM generator")
    subparsers = parser.add_subparsers(dest="command", required=True)

    start = subparsers.add_parser("start", help="start background generation and return immediately")
    start.add_argument("--prompt")
    start.add_argument("--output-dir", required=True)
    start.add_argument("--force", action="store_true")
    start.set_defaults(handler=start_job)

    check = subparsers.add_parser("status", help="read the background job result")
    check.add_argument("--output-dir", required=True)
    check.set_defaults(handler=status)

    internal = subparsers.add_parser("_worker", help=argparse.SUPPRESS)
    internal.add_argument("--prompt", required=True)
    internal.add_argument("--output-dir", required=True)
    internal.add_argument("--started-at", required=True)
    internal.set_defaults(handler=worker)
    return parser


def main():
    args = build_parser().parse_args()
    args.handler(args)


if __name__ == "__main__":
    main()
