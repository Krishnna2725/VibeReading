# VibeReading Skill

VibeReading turns a book into a quiet 16:9 desktop reading companion page.
It uses a short pre-reading guide, a book-specific visual object, weather, sound,
TOC-based reading stages, timer, and pomodoro to help a reader enter and sustain a reading state.

The authoritative workflow is `SKILL.md`.

## Templates

| template | core object |
| --- | --- |
| `window` | a weather-aware window-side reading space |
| `vinyl` | a record player and liner-note reading ritual |
| `instrument` | a CRT Reading Receiver with channel/tuning controls |
| `route` | a journey route with stops and atmosphere |
| `oracle` | a spoiler-safe reading card table |

## Minimal Read Path

Ordinary generation tasks should read:

1. `SKILL.md`
2. `references/template-index.md`
3. one selected template
4. `references/space-spec-schema.md`
5. `references/audio-manifest.json`

Read other references only when the corresponding step needs them.

## Scaffold

```bash
python scripts/scaffold-output.py --output-dir "output/YYYY-MM-DD-BookTitle-purpose"
```

Generated pages must support direct `file://` use and prioritize 16:9 desktop viewports.

## Validation

```bash
node --check runtime/v2-runtime.js
node --test references/tests/note-share-export.test.js references/tests/v2-runtime-contract.test.js references/tests/output-evaluator.test.js references/tests/bgm-gen.test.js
node references/tests/evaluate-vibereading-output.mjs output/<folder>
```
