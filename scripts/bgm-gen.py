#!/usr/bin/env python3
"""VibeReading 后台 BGM 生成器。

Agent 只使用 start 和 status：
  python scripts/bgm-gen.py start --prompt-file output/xxx/prompts/bgm.txt --output-dir output/xxx
  python scripts/bgm-gen.py status --output-dir output/xxx

start 会立即返回。后台 worker 独立等待 MiniMax、下载音频并写入 bgm-meta.json。
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
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
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


def pending_meta(prompt):
    return {
        "status": "pending",
        "is_instrumental": True,
        "file": "./assets/audio/bgm.mp3",
        "prompt": prompt,
        "reason": "后台生成中，请稍后运行 status 验收；不得因接口延迟改为 skipped。",
    }


def final_meta(status, prompt, reason=""):
    return {
        "status": status,
        "is_instrumental": True,
        "file": "./assets/audio/bgm.mp3",
        "prompt": prompt,
        "reason": reason,
    }


def read_prompt(args):
    if args.prompt_file:
        return Path(args.prompt_file).read_text(encoding="utf-8").strip()
    return (args.prompt or "").strip()


def start_job(args):
    prompt = read_prompt(args)
    if not prompt:
        raise SystemExit("[FAIL] 需要 --prompt-file 或 --prompt")
    target = paths(args.output_dir)
    target["root"].mkdir(parents=True, exist_ok=True)
    target["audio"].parent.mkdir(parents=True, exist_ok=True)

    if target["audio"].exists() and not args.force:
        write_json(target["meta"], final_meta("generated", prompt, "目标 BGM 已存在，未重复生成。"))
        print(f"[READY] {target['audio']}")
        return

    write_json(target["meta"], pending_meta(prompt))
    write_json(target["job"], {
        "status": "pending",
        "pid": None,
        "startedAt": int(time.time()),
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
        "startedAt": int(time.time()),
        "outputDir": str(target["root"]),
    })
    print(f"[STARTED] 后台 BGM 任务 PID={process.pid}")
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
        raise RuntimeError(f"MiniMax 请求失败: {result.stderr.strip()}")
    try:
        response = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise RuntimeError(f"MiniMax 返回非 JSON: {result.stdout[:300]}") from error
    status = response.get("base_resp", {}).get("status_code", -1)
    if status != 0:
        message = response.get("base_resp", {}).get("status_msg", "未知错误")
        raise RuntimeError(f"MiniMax API 错误 {status}: {message}")
    audio_url = response.get("data", {}).get("audio")
    if not audio_url:
        raise RuntimeError("MiniMax 响应没有 audio URL")
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
        raise RuntimeError(f"BGM 下载失败: {result.stderr.strip()}")
    if not output.exists() or output.stat().st_size < 1000:
        raise RuntimeError("下载后的 BGM 文件不存在或过小")


def worker(args):
    target = paths(args.output_dir)
    prompt = args.prompt.strip()
    api_key = os.environ.get("MINIMAX_API_KEY", "").strip()
    try:
        if not api_key:
            raise RuntimeError("环境变量 MINIMAX_API_KEY 未设置")
        audio_url = run_curl(api_key, prompt)
        download(audio_url, target["audio"])
        write_json(target["meta"], final_meta("generated", prompt))
        write_json(target["job"], {
            "status": "generated",
            "finishedAt": int(time.time()),
            "outputDir": str(target["root"]),
        })
        print(f"[DONE] {target['audio']}", flush=True)
    except Exception as error:
        write_json(target["meta"], final_meta("failed", prompt, str(error)))
        write_json(target["job"], {
            "status": "failed",
            "finishedAt": int(time.time()),
            "reason": str(error),
            "outputDir": str(target["root"]),
        })
        print(f"[FAIL] {error}", file=sys.stderr, flush=True)
        raise SystemExit(1)


def status(args):
    target = paths(args.output_dir)
    if not target["meta"].exists():
        print("[MISSING] bgm-meta.json 不存在")
        raise SystemExit(2)
    meta = json.loads(target["meta"].read_text(encoding="utf-8"))
    state = meta.get("status", "missing")
    print(json.dumps(meta, ensure_ascii=False, indent=2))
    if state == "generated" and target["audio"].exists() and target["audio"].stat().st_size >= 1000:
        raise SystemExit(0)
    if state == "failed":
        raise SystemExit(1)
    raise SystemExit(2)


def build_parser():
    parser = argparse.ArgumentParser(description="VibeReading 后台 BGM 生成器")
    subparsers = parser.add_subparsers(dest="command", required=True)

    start = subparsers.add_parser("start", help="启动后台生成并立即返回")
    start.add_argument("--prompt")
    start.add_argument("--prompt-file")
    start.add_argument("--output-dir", required=True)
    start.add_argument("--force", action="store_true")
    start.set_defaults(handler=start_job)

    check = subparsers.add_parser("status", help="读取后台任务结果")
    check.add_argument("--output-dir", required=True)
    check.set_defaults(handler=status)

    internal = subparsers.add_parser("_worker", help=argparse.SUPPRESS)
    internal.add_argument("--prompt", required=True)
    internal.add_argument("--output-dir", required=True)
    internal.set_defaults(handler=worker)
    return parser


def main():
    args = build_parser().parse_args()
    args.handler(args)


if __name__ == "__main__":
    main()
