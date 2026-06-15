# 单首 BGM 生成

每本书只生成一首严格纯音乐 BGM。
BGM 是入静引导与阅读陪伴的核心声音，不是可选赠品。

## 请求要求

每次请求必须包含：

```json
"is_instrumental": true
```

Prompt 必须使用英文，并在结尾明确：

```text
Strictly instrumental, no vocals, no singing, no spoken words, no lyrics.
```

不得要求歌唱、朗诵、吟唱、人声垫底或 vocal pads。

## Prompt 内容

描述：

- 书籍气质与核心张力；
- 适合阅读的速度和动态；
- 主要与次要乐器；
- 声音距离与空间感；
- 与天气和模板空间的关系；
- 循环友好、克制、不抢注意力。

## 工作流

1. 完成 SpaceSpec 后异步启动 BGM 生成。
2. 同时继续生成页面。
3. 生成成功后写入 `assets/audio/bgm.mp3`。
4. 最终写入 `bgm-meta.json`。
5. 失败时写入 `failed` 或 `skipped`，页面使用环境音兜底。

最终状态只能为：

```text
generated, skipped, failed
```

不得交付 `pending`。

## 播放规则

- 页面加载时展示入静首页；
- 用户点击开始后立即尝试播放 `./assets/audio/bgm.mp3`；
- BGM 不可用时立即播放环境音；
- 不依赖 `fetch()` 元数据后才发现 BGM；
- 全书只引用一条 BGM；
- BGM 可与低音量环境音同时存在。

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
