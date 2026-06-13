#!/usr/bin/env python3
"""
VibeReading BGM 生成器
独立脚本：检查连通性 → 提交请求 → 下载音频

用法:
  python bgm-gen.py --prompt "..." --output-dir ./output/xxx/
  python bgm-gen.py --prompt "..." --output ./output/xxx/bgm.mp3

环境变量:
  MINIMAX_API_KEY  — 必须设置，否则报错退出

流程:
  1. 检查 API Key
  2. 检查网络连通性（curl api.minimaxi.com）
  3. 提交 BGM 生成请求
  4. 等待生成完成（最长 180s）
  5. 下载 mp3 到目标路径
  6. 写入 bgm-meta.json
"""

import argparse
import json
import os
import subprocess
import sys
import time


def check_api_key():
    key = os.environ.get("MINIMAX_API_KEY", "").strip()
    if not key:
        print("[FAIL] 环境变量 MINIMAX_API_KEY 未设置", file=sys.stderr)
        print("  设置方式: export MINIMAX_API_KEY='your-key-here'", file=sys.stderr)
        sys.exit(1)
    return key


def check_connectivity():
    """检查 MiniMax API 是否可达"""
    print("[..] 检查 API 连通性...")
    try:
        result = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
             "--max-time", "10",
             "https://api.minimaxi.com/v1/models"],
            capture_output=True, text=True, timeout=15, encoding="utf-8", errors="replace"
        )
        code = result.stdout.strip()
        if code and int(code) < 500:
            print(f"[OK] API 可达 (HTTP {code})")
            return True
        else:
            print(f"[FAIL] API 返回 HTTP {code}", file=sys.stderr)
            return False
    except Exception as e:
        print(f"[FAIL] 网络不通: {e}", file=sys.stderr)
        return False


def submit_bgm(api_key, prompt):
    """提交 BGM 生成请求，返回完整响应 JSON"""
    print("[..] 提交 BGM 生成请求...")
    payload = json.dumps({
        "model": "music-2.6-free",
        "prompt": prompt,
        "is_instrumental": True,
        "output_format": "url",
        "audio_setting": {
            "sample_rate": 44100,
            "bitrate": 256000,
            "format": "mp3"
        }
    })

    result = subprocess.run(
        ["curl", "-s", "-X", "POST",
         "https://api.minimaxi.com/v1/music_generation",
         "-H", f"Authorization: Bearer {api_key}",
         "-H", "Content-Type: application/json",
         "--max-time", "300",
         "-d", payload],
        capture_output=True, text=True, timeout=310, encoding="utf-8", errors="replace"
    )

    if result.returncode != 0:
        print(f"[FAIL] curl 失败: {result.stderr}", file=sys.stderr)
        sys.exit(1)

    try:
        resp = json.loads(result.stdout)
    except json.JSONDecodeError:
        print(f"[FAIL] 响应不是 JSON: {result.stdout[:200]}", file=sys.stderr)
        sys.exit(1)

    status = resp.get("base_resp", {}).get("status_code", -1)
    if status != 0:
        msg = resp.get("base_resp", {}).get("status_msg", "未知错误")
        print(f"[FAIL] API 错误 ({status}): {msg}", file=sys.stderr)
        sys.exit(1)

    print("[OK] BGM 生成请求已提交")
    return resp


def extract_audio_url(resp):
    """从响应中提取音频 URL"""
    data = resp.get("data", {})
    audio = data.get("audio", "")
    if not audio:
        print("[FAIL] 响应中没有 audio URL", file=sys.stderr)
        print(f"  完整响应: {json.dumps(resp, ensure_ascii=False)[:500]}", file=sys.stderr)
        sys.exit(1)
    return audio


def download_audio(url, output_path):
    """下载 MP3 文件"""
    print(f"[..] 下载音频到 {output_path}...")
    result = subprocess.run(
        ["curl", "-L", "-o", output_path,
         "--max-time", "120", url],
        capture_output=True, text=True, timeout=130, encoding="utf-8", errors="replace"
    )
    if result.returncode != 0:
        print(f"[FAIL] 下载失败: {result.stderr}", file=sys.stderr)
        sys.exit(1)

    file_size = os.path.getsize(output_path)
    if file_size < 1000:
        print(f"[FAIL] 文件太小 ({file_size} bytes)，可能下载失败", file=sys.stderr)
        sys.exit(1)

    print(f"[OK] 下载完成 ({file_size / 1024 / 1024:.1f} MB)")
    return file_size


def write_meta(output_dir, prompt, file_size):
    """写入 bgm-meta.json"""
    meta = {
        "status": "generated",
        "is_instrumental": True,
        "file": "./assets/audio/bgm.mp3",
        "prompt": prompt,
        "reason": ""
    }
    meta_path = os.path.join(output_dir, "bgm-meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"[OK] 已写入 {meta_path}")


def main():
    parser = argparse.ArgumentParser(description="VibeReading BGM 生成器")
    parser.add_argument("--prompt", "-p", required=True, help="BGM 风格描述（英文）")
    parser.add_argument("--output-dir", "-d", help="输出目录（包含 assets/audio/）")
    parser.add_argument("--output", "-o", help="直接指定 mp3 输出路径")
    args = parser.parse_args()

    # 确定输出路径
    if args.output:
        output_mp3 = args.output
        output_dir = os.path.dirname(output_mp3)
    elif args.output_dir:
        output_dir = args.output_dir
        output_mp3 = os.path.join(output_dir, "assets", "audio", "bgm.mp3")
    else:
        print("[FAIL] 需要 --output-dir 或 --output 参数", file=sys.stderr)
        sys.exit(1)

    # 确保输出目录存在
    os.makedirs(os.path.dirname(output_mp3), exist_ok=True)

    # Step 1: 检查 API Key
    api_key = check_api_key()

    # Step 2: 检查连通性
    if not check_connectivity():
        print("\n请检查网络代理是否开启，或 API Key 是否有效", file=sys.stderr)
        sys.exit(1)

    # Step 3: 提交请求
    resp = submit_bgm(api_key, args.prompt)

    # Step 4: 提取 URL
    audio_url = extract_audio_url(resp)

    # Step 5: 下载
    file_size = download_audio(audio_url, output_mp3)

    # Step 6: 写 meta
    write_meta(output_dir, args.prompt, file_size)

    print("\n[DONE] BGM 生成完毕")


if __name__ == "__main__":
    main()
