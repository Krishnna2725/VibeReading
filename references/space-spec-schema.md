# V2 SpaceSpec

只记录会直接改变页面的决策。字段内容使用中文。

```json
{
  "book": {
    "title": "",
    "author": ""
  },
  "template": {
    "primary": "window|vinyl|instrument|route|symbols",
    "reason": ""
  },
  "bookDirection": {
    "visualMotif": "",
    "musicDirection": "",
    "textVoice": "",
    "motionCharacter": "",
    "uiLanguage": "",
    "avoid": []
  },
  "entryGuide": {
    "durationSec": 20,
    "steps": [
      {"id": "", "text": "", "visual": "", "audio": ""}
    ],
    "skipControl": true,
    "soundRequiredAfterStart": true
  },
  "visual": {
    "primaryPrompt": "",
    "imageRole": "",
    "safeArea": "",
    "windowVariations": [],
    "windowComposition": {
      "windowAndExteriorMinPercent": 70,
      "exteriorMinPercent": 55,
      "interiorMaxPercent": 30
    }
  },
  "audio": {
    "bgmPrompt": "",
    "bgmFile": "./assets/audio/bgm.mp3",
    "ambienceFiles": [],
    "isInstrumental": true,
    "fallback": ""
  },
  "stages": [
    {
      "id": "",
      "label": "",
      "sourceRange": "",
      "chapters": [],
      "readingHint": "",
      "floatingTexts": [],
      "weather": "",
      "light": "",
      "ambience": "",
      "motion": "",
      "uiAccent": "",
      "image": ""
    }
  ],
  "weather": {
    "kind": "",
    "levels": ["off", "low", "medium"],
    "reducedMotionFallback": ""
  },
  "companion": {
    "preset": "frosted-glass|deck-controls|control-surface|wayfinder|symbol-tokens",
    "primaryCapabilities": ["entry-guide", "weather", "sound", "stages", "timer", "pomodoro"]
  },
  "firstScreen": {
    "aspectRatio": "16:9",
    "noVerticalCrowding": true,
    "noCriticalCrop": true
  },
  "fileProtocol": {
    "worksByDoubleClick": true,
    "noLocalFetchForJson": true,
    "relativeAssetsOnly": true
  }
}
```

规则：

- `entryGuide` 同时承担读前介绍，不再生成独立的额外理解框架。
- `entryGuide.steps` 数量与结构由 AI 根据书籍决定；全部文字建议 60–160 个汉字。
- `entryGuide.durationSec` 为 15–25 秒。
- `soundRequiredAfterStart` 必须为 `true`。
- `stages` 必须包含 3–6 项，由 AI 主动检索目录并按章节进度聚合。
- 每个阶段必须填写 `sourceRange` 和 `chapters`，不得使用纯情绪阶段替代目录依据。
- 每个阶段至少有 2 条 `floatingTexts`。
- 只有 `window` 可填写 `windowVariations`，最多三项。
- Window 的 `windowComposition` 必须保持 `70 / 55 / 30` 构图底线。
- `audio.isInstrumental` 必须为 `true`。
- 全书只使用一个 `bgmFile`。
- `weather.levels` 必须支持 `off`、`low`、`medium`。
- `primaryCapabilities` 必须包含入静、天气、声音、阶段、计时和番茄钟。
- `firstScreen` 与 `fileProtocol` 的布尔值必须全部为 `true`。

不要添加本 Schema 未定义的旧版机制字段或额外流程状态。
