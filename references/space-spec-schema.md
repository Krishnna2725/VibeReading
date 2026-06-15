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
  "readingCoordinate": {
    "world": "",
    "concern": "",
    "notice": "",
    "permission": ""
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
      {"id": "settle", "text": "", "visual": "", "audio": ""},
      {"id": "orient", "text": "", "visual": "", "audio": ""},
      {"id": "attune", "text": "", "visual": "", "audio": ""},
      {"id": "begin", "text": "", "visual": "", "audio": ""}
    ],
    "skipControl": true,
    "soundRequiredAfterStart": true
  },
  "visual": {
    "primaryPrompt": "",
    "imageRole": "",
    "safeArea": "",
    "windowVariations": []
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

- `readingCoordinate` 四项完整，总字数不超过 180 个汉字。
- `entryGuide.steps` 精确包含 `settle`、`orient`、`attune`、`begin`。
- `entryGuide.durationSec` 为 15–25 秒。
- `soundRequiredAfterStart` 必须为 `true`。
- `stages` 精确包含四项。
- 每个阶段至少有 2 条 `floatingTexts`。
- 只有 `window` 可填写 `windowVariations`，最多三项。
- `audio.isInstrumental` 必须为 `true`。
- 全书只使用一个 `bgmFile`。
- `weather.levels` 必须支持 `off`、`low`、`medium`。
- `primaryCapabilities` 必须包含入静、天气、声音、阶段、计时和番茄钟。
- `firstScreen` 与 `fileProtocol` 的布尔值必须全部为 `true`。

不要添加本 Schema 未定义的旧版机制字段或额外流程状态。
