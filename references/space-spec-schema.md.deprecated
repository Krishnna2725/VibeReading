# Space Spec Schema

Write `space-spec.json` as the implementation source of truth. Keep it spoiler-safe and concise.

Recommended shape:

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
  "bookDirection": {
    "visualMotif": "",
    "musicDirection": "",
    "textVoice": "",
    "motionCharacter": "",
    "uiLanguage": "",
    "avoid": []
  },
  "visualDesign": {
    "archetype": "",
    "materialSystem": "",
    "typography": "",
    "palette": [],
    "nestedArchitecture": "",
    "motionChoreography": ""
  },
  "entryGuide": {
    "durationSec": 20,
    "soundRequiredAfterStart": true,
    "layout": "",
    "motion": "",
    "steps": [
      {
        "id": "",
        "eyebrow": "",
        "text": "",
        "emphasis": "",
        "visual": "",
        "focusWords": ["关键词1", "关键词2"],
        "entryRegion": "sleeve-left | center | screen-right",
        "objectCue": "tonearm-hover | needle-drop | power-on"
      }
    ]
  },
  "audio": {
    "bgmFile": "./assets/audio/bgm.mp3",
    "ambienceFiles": [],
    "bgmPrompt": "",
    "isInstrumental": true
  },
  "weather": {
    "defaultLevel": "low"
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
  ]
}
```

## Required Rules

- `template.primary` must be one of `window`, `vinyl`, `instrument`, `route`, `oracle`.
- `entryGuide.soundRequiredAfterStart` must be `true`.
- `entryGuide.steps` must not be empty.
- Stages must be 3 to 6.
- Every stage must have `sourceRange` and a non-empty `chapters` array.
- Every stage must have a spoiler-safe `readingHint`.
- Do not use `floatingTexts`; use `readingHint` inside the template control or brief stage transition text.
- `visualDesign` is internal guidance only. Do not display its field names in the page.
- `entryGuide.layout` and `entryGuide.motion` must be template/book-specific, not the same default for every page.
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
