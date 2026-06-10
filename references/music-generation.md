# Music Generation (BGM)

Use MiniMax `music-2.6-free` to generate strictly instrumental BGM with no lyrics and no vocals. Domestic Chinese API endpoint — do NOT use proxy.

Every request must include `"is_instrumental": true`. Never ask for vocals, singing, spoken words, chants, lyrics, or vocal pads.

## Prerequisites

- `MINIMAX_API_KEY` must be set in environment
- If not set, skip BGM and write `bgm-meta.json` with `status: "skipped"`

## Timing

Free tier (`music-2.6-free`) 实测很慢，约 **120–150 秒**才返回响应。不要同步等待。

## 异步工作流（推荐）

BGM 生成很慢，但 agent 不应该干等。正确的做法是 **先发请求 → 继续干活 → 最后回来收结果**：

```text
1. 在生成 space-spec.json 之后、生成 HTML/CSS/JS 之前，后台发起 BGM 请求
2. 不等待响应，直接继续生成 HTML/CSS/JS
3. 先写 bgm-meta.json status: "pending"
4. 完成所有其他工作后，回来检查 BGM 结果
   - 如果响应已就绪 → 下载 mp3，更新 bgm-meta.json 为 "generated"
   - 如果仍未响应 → 再等 30 秒，再检查一次
   - 如果超时 180 秒 → 写 "failed"，页面用环境音替代
5. 最后更新 index.html 和 app.js 引用 bgm.mp3
```

## API Call

发送请求（后台运行，不等结果）：

```bash
curl -s -X POST "https://api.minimaxi.com/v1/music_generation" \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -H "Content-Type: application/json" \
  --max-time 300 \
  -d '{
    "model": "music-2.6-free",
    "prompt": "<BGM_PROMPT>",
    "is_instrumental": true,
    "output_format": "url",
    "audio_setting": { "sample_rate": 44100, "bitrate": 256000, "format": "mp3" }
  }' > output/[run-folder]/bgm_response.json &
```

Response: `data.audio` = download URL, `data.status` = 2 when ready. Download:

```bash
curl -L -o "output/[run-folder]/assets/audio/bgm.mp3" "<data.audio>"
```

## Prompt

Generate from SpaceSpec's `emotionalTemperature`, `dominantImage`, `atmosphere`. Describe **emotion and scene** — not genre labels. Write in English.

End every prompt with: `Strictly instrumental, no vocals, no singing, no spoken words, no lyrics.`

**Best example** (melancholic/cinematic):
> Cinematic, melancholic reading atmosphere, slow tempo, cold yet immersive, sparse piano, bowed strings, distant resonant percussion, restrained dynamics, suitable for introspective reading. Strictly instrumental, no vocals, no singing, no spoken words, no lyrics.

## bgm-meta.json

```json
{
  "status": "generated",  // "generated" | "pending" | "skipped" | "failed"
  "is_instrumental": true,
  "file": "./assets/audio/bgm.mp3",
  "prompt": "...",
  "reason": ""
}
```

If API call fails (non-zero `base_resp.status_code`), write `status: "failed"` and continue the workflow. Do not block page generation.
