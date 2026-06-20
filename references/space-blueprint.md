# Space Blueprint

Write `space-spec.json` as the implementation source of truth. Keep it spoiler-safe and concise.
This is an **engineering blueprint**, not a literary description. It must directly guide code generation.

## Schema

```json
{
  "book": {
    "title": "",
    "author": ""
  },
  "template": {
    "primary": "window",
    "reason": ""
  },
  "layout": {
    "aspectRatio": "16:9",
    "scrim": "fixed-light",
    "companionPanel": "window-bottom-center"
  },
  "assets": {
    "images": [
      { "role": "base", "path": "./assets/images/base.png", "template": "window" }
    ],
    "audio": {
      "bgmFile": "./assets/audio/bgm.mp3",
      "ambienceFiles": [],
      "isInstrumental": true
    }
  },
  "stages": [
    {
      "id": "",
      "label": "",
      "sourceRange": "",
      "chapters": [],
      "readingHint": "",
      "weather": {
        "kind": "",
        "defaultLevel": "low"
      },
      "light": "",
      "ambience": "",
      "motion": "",
      "uiAccent": ""
    }
  ],
  "companion": {
    "type": "panel",
    "controls": ["stage", "timer", "pomodoro", "sound", "bgm-volume", "ambience-volume", "weather", "guide-replay", "notes"]
  },
  "effects": {
    "weatherKinds": ["rain", "fog", "snow"],
    "guideMotion": "window-fog-clear"
  },
  "entryGuide": {
    "durationSec": 20,
    "soundRequiredAfterStart": true,
    "motion": "window-fog-clear",
    "steps": [
      {
        "id": "",
        "eyebrow": "",
        "text": "",
        "emphasis": "",
        "visual": "",
        "focusWords": [],
        "entryRegion": "sleeve-left | center | screen-right",
        "objectCue": "tonearm-hover | needle-drop | power-on"
      }
    ]
  },
  "validation": {
    "minStages": 3,
    "maxStages": 6,
    "requiresImage": true,
    "templateContract": "window"
  }
}
```

## Required Rules

- `template.primary` must be one of `window`, `vinyl`, `instrument`, `route`, `oracle`.
- `entryGuide.soundRequiredAfterStart` must be `true`.
- `entryGuide.steps` must not be empty.
- Stages must be 3 to 6.
- Every stage must have `sourceRange` and a non-empty `chapters` array.
- Every stage must have a spoiler-safe `readingHint`.
- `weather.kind` must be one of the runtime allowlist: `rain`, `storm-rain`, `fog`, `snow`, `wind`, `ripple`, `water`, `dust`, `embers`, `fire`, `signal`, `paper`, `stars`.
- Do not use `floatingTexts`; use `readingHint` inside the template control or brief stage transition text.
- `entryGuide.motion` must be a template preset or a template-specific value.
- `entryGuide.durationSec` is only a pacing hint; every step still waits for user click.
- Do not add `skipControl`, `showSkipButton`, or similar fields. Skip is always visible and not configurable.

## Audio-Weather Consistency

The following ambience→weather pairings are mandatory (see the mapping in `effects-recipes.md` → Audio-Weather Coupling):

- Rain audio (`drizzle`, `moderate-rain`, `rain-on-the-window`, `thunder-freight`) → `weather.kind` must be `rain` or `storm-rain`
- Fireplace audio (`fireplace-crackling`) → `weather.kind` must be `fire` or `embers`
- Wind audio (`soft-wind`, `distant-breeze`, `forest-wind-with-birds`, `windstorm`) → `weather.kind` must be `wind`
- Water audio (`lake-wavelet`, `sea-and-seagull-wave`, `mountain-stream`) → `weather.kind` must be `ripple` or `water`

All other ambience/weather combinations have no coupling requirement.

## Stage Derivation

Do not ask the user for the TOC by default. Search for it.
If the TOC is long, group chapters by sequence and structural turns.
If reliable chapter titles are unavailable, use conservative chapter-number ranges and say so in internal notes, not visible UI.

Do not reveal late plot information in stage labels or hints.

## What This Blueprint Is NOT

This blueprint is NOT a place for:
- Literary atmosphere descriptions ("the book breathes with a quiet longing")
- World-building prose ("a vast desert of silence stretches...")
- Design strategy explanations
- Visual motif descriptions

Those belong in `bookDirection` or internal agent reasoning. The blueprint is purely engineering: what components, what states, what assets, what contracts.
