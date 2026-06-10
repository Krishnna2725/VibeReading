# BGM 生成

使用 MiniMax `music-2.6-free` 生成严格的纯音乐 BGM，不得包含歌词或人声。国内接口不使用代理。

每次请求必须包含 `"is_instrumental": true`。
提示词不得要求歌唱、朗诵、吟唱、歌词、人声垫底或 vocal pads。

## 前置条件

- 环境变量中必须存在 `MINIMAX_API_KEY`。
- 如果未配置，跳过生成，并将 `bgm-meta.json` 的 `status` 写为 `"skipped"`。

## 异步工作流

免费模型实测约需 120-150 秒。不要同步干等：

```text
1. 完成 space-spec.json 后，后台发起 BGM 请求。
2. 继续生成 HTML、CSS 和 JS。
3. 暂时写入 bgm-meta.json，status 为 "pending"。
4. 其他工作结束后检查响应。
5. 成功则下载 mp3；超过 180 秒则写为 "failed"。
6. 无论 BGM 是否成功，页面都必须能使用普通环境音运行。
```

## API 请求

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

响应中的 `data.audio` 是下载地址，`data.status` 为 `2` 时表示完成：

```bash
curl -L -o "output/[run-folder]/assets/audio/bgm.mp3" "<data.audio>"
```

## 提示词

根据 SpaceSpec 中的核心张力、主导意象、空间天气和情绪生成。
描述情绪、场景、速度、乐器与动态，不要只写音乐类型。
提示词使用英文，并在结尾附加：

```text
必须是纯音乐：不得包含人声、演唱、口白或歌词。
```

示例：

> Cinematic, melancholic reading atmosphere, slow tempo, cold yet immersive, sparse piano, bowed strings, distant resonant percussion, restrained dynamics, suitable for introspective reading. Strictly instrumental, no vocals, no singing, no spoken words, no lyrics.

## bgm-meta.json

```json
{
  "status": "generated",
  "is_instrumental": true,
  "file": "./assets/audio/bgm.mp3",
  "prompt": "...",
  "reason": ""
}
```

`status` 可为 `generated`、`pending`、`skipped` 或 `failed`。
API 失败时写入 `failed` 并继续工作，不得阻塞页面生成。
