# Space Blueprint

Write `space-spec.json` as the engineering source of truth. Keep it concise and
spoiler-safe.

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
    "aspectRatio": "16:9"
  },
  "assets": {
    "images": [
      { "role": "base", "path": "./assets/images/base.png", "template": "window" }
    ]
  },
  "audio": {
    "bgmFile": "./assets/audio/bgm.mp3",
    "ambienceFiles": {
      "drizzle": "./assets/audio/drizzle.mp3"
    },
    "isInstrumental": true
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
        "defaultLevel": "medium"
      },
      "light": "",
      "ambience": "drizzle",
      "motion": "",
      "uiAccent": ""
    }
  ],
  "companion": {
    "entry": "",
    "behavior": "collapsed-by-default | always-visible | expandable",
    "controls": ["stage", "timer", "pomodoro", "sound", "bgm-volume", "ambience-volume", "weather", "guide-replay"]
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
        "entryRegion": "template-specific",
        "objectCue": "template-specific"
      }
    ]
  }
}
```

## Required Rules

- `template.primary` must be one of `window`, `vinyl`, `instrument`, `route`, `oracle`.
- `entryGuide.soundRequiredAfterStart` must be `true`.
- `entryGuide.steps` must not be empty.
- `stages` must contain 3 to 6 items.
- Every stage must have `sourceRange`, non-empty `chapters`, and spoiler-safe `readingHint`.
- `weather.kind` must be one of the runtime allowlist: `rain`, `storm-rain`, `fog`, `snow`, `wind`, `ripple`, `water`, `dust`, `embers`, `fire`, `signal`, `paper`, `stars`, `leaves`, `fireflies`.
- `stage.ambience` must be empty/omitted or reference a key in `audio.ambienceFiles`.
- Do not use `floatingTexts`; use `readingHint` inside the template control or brief stage transition text.
- `entryGuide.motion` must be a template preset or a template-specific value.
- `entryGuide.durationSec` is only a pacing hint; every step still waits for user click.
- Do not add configurable skip flags. The authored guide decides how the secondary skip action is presented.
- Do not use this file to prescribe visual layout, dock positions, card stacks, or panel structure.

## Audio Notes

- `audio.ambienceFiles` is the declared local ambience library for the output.
- Prefer IDs from `audio-manifest.json` as map keys.
- Runtime consumes `stage.ambience` directly.
- At any moment only the current stage ambience may be active.
- If a stage does not need ambience, leave `stage.ambience` empty.

Choose weather and ambience as one coherent atmosphere. Rain audio should normally
accompany `rain` or `storm-rain`; fireplace audio should accompany `fire` or
`embers`; wind audio should accompany `wind`; water audio should accompany
`ripple` or `water`. The validator may report a warning for known mismatches,
but warnings never block delivery.

## Stage Derivation

- Search for the TOC; do not ask the user for it by default.
- Group by chapter sequence or structural turns.
- If reliable chapter titles are unavailable, use conservative chapter-number ranges.
- Do not reveal late plot information in stage labels or hints.

## What This Blueprint Is Not

This blueprint is not a place for literary atmosphere prose, world-building
copy, design-strategy explanations, or visual motif essays. Those
belong in internal art direction. The blueprint records components, states,
assets, and runtime contracts.
