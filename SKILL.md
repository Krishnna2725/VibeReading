---
name: vibereading
description: >
  Generate a 16:9 desktop VibeReading companion page for a book. Use this skill
  when the user asks for an atmospheric reading space with a pre-reading guide,
  sound, weather, directory-based reading stages, a template-specific companion
  control, and a stable file://-friendly HTML/CSS/JS output.
---

# VibeReading V2

> **Single authority.** This file is the definitive generation contract.
> If any other document in this project contradicts SKILL.md, follow SKILL.md.

Create a quiet, book-specific reading companion space. It is not a plot guide,
not a puzzle game, not an ebook reader, and not a generic dashboard.

## Output Contract

Every output must include:

- one selected template: `window`, `vinyl`, `instrument`, `route`, or `oracle`;
- a pre-reading guide that appears again after every page refresh;
- sound immediately after the user clicks Start: play BGM first, fall back to ambience if BGM fails;
- exactly one instrumental BGM for the whole book;
- 3 to 6 reading stages derived from the real table of contents or chapter order;
- visible weather or atmospheric motion, adjustable for the current stage;
- a template-specific companion control whose visibility behavior is defined by the selected template;
- reading timer plus a 25-minute pomodoro mode;
- complete 16:9 desktop presentation;
- `file://` double-click support, keyboard operability, and reduced-motion support.

Do not build mobile-first layouts. Optimize for a 16:9 horizontal desktop viewport.

Browser autoplay rules mean the page cannot play audible sound before user interaction:

```text
page load -> guide homepage -> user clicks Start -> BGM starts; if it fails, ambience starts
```

The guide must not auto-advance. Start, Continue, Skip, and Enter Reading Space must all be user-clicked.

## Context Budget

Read only what the current step needs.

Always read:

```text
SKILL.md
references/template-index.md
references/templates/[selected-template].md
references/space-spec-schema.md
references/audio-manifest.json
```

Read on demand:

```text
references/visual-design-contract.md   high-end visual direction
references/entry-guide.md              pre-reading guide design
references/image-generation.md         image prompt and asset rules
references/music-generation.md         BGM generation workflow
references/effects-recipes.md          p5 weather and atmospheric effects
references/technical-contract.md       runtime state, controls, validation
```

Do not read unselected templates. Do not read old templates from Git history. Do not read
`references/tests/` while generating a page unless a test failure gives no other actionable clue.

## Workflow

1. Get the book title and optional author.
2. Search for reliable background information and the table of contents. Do not wait for the user to provide the TOC.
3. Choose exactly one template from `template-index.md`.
4. Read only that template file.
5. Define the book identity:

```text
visualMotif, musicDirection, textVoice, motionCharacter, uiLanguage, avoid
```

6. Group the TOC into 3 to 6 spoiler-safe reading stages. Each stage needs:

```text
label, sourceRange, chapters, readingHint, weather, light, ambience, motion, uiAccent
```

7. Read `visual-design-contract.md` and set a concrete visual system before writing UI.
8. Read `entry-guide.md` and design the guide as a short book-specific ceremony with sound, typography, focus, p5/light/object feedback, and click-by-click pacing.
9. Read `space-spec-schema.md` and write `space-spec.json`.
10. Read `music-generation.md`; use `scripts/bgm-gen.py start` for new BGM generation. Do not poll the remote API manually and do not skip because it is slow.
11. Read `image-generation.md` only when the selected template needs generated images.
12. Select required ambience from `audio-manifest.json`.
13. Read `technical-contract.md`.
14. Run:

```bash
python scripts/scaffold-output.py --output-dir "output/<task-folder>"
```

15. Modify only the book-specific output files unless the user explicitly asks to improve the skill itself.
16. Copy every actually referenced local image/audio asset into the output folder. **Asset reuse only**: copy image and audio files from previous outputs if they fit the new book. Never reuse `app.js`, `style.css`, `space-spec.json`, or `index.html` from a prior generation — those contain book-specific implementation and must be written fresh each time.
17. Run deterministic code validation.

## Output Structure

```text
output/YYYY-MM-DD-BookTitle-purpose/
├── index.html
├── style.css
├── app.js
├── space-spec.json
├── bgm-meta.json
├── concept-image.png          # required only for image-driven templates
├── prompts/
│   ├── image.txt              # required only when image generation is used
│   └── bgm.txt
├── stage-2.png                # optional, mainly Window
├── stage-3.png
├── stage-4.png
└── assets/
    └── audio/
        ├── bgm.mp3
        └── ...
```

Keep HTML, CSS, and JS separate. Copy and link the shared runtime; do not inline it and do not load it twice.
Define page configuration in `app.js`. Do not depend on `fetch()` for local metadata.

## Audio-Weather Coupling

The following ambience-to-weather pairings are mandatory. All other combinations have no requirement.

- Rain audio (`drizzle`, `moderate-rain`, `rain-on-the-window`, `thunder-freight`) → `rain` or `storm-rain` visual
- Fireplace audio (`fireplace-crackling`) → `fire` or `embers` visual
- Wind audio (`soft-wind`, `distant-breeze`, `forest-wind-with-birds`, `windstorm`) → `wind` visual
- Water audio (`lake-wavelet`, `sea-and-seagull-wave`, `mountain-stream`) → `ripple` or `water` visual

See `references/effects-recipes.md` for the full allowlist and `references/audio-manifest.json` for the `visualWeather` / `visualRequired` fields.

## Stage Rules

Stage count is decided by the agent from the real book structure:

- minimum: 3 stages;
- maximum: 6 stages;
- group by chapter sequence, section breaks, or structural turns;
- never replace TOC-based stages with pure emotion stages;
- keep all labels and hints spoiler-safe for readers who have not read the book.

Except for `window`, stages usually reuse one main visual. Express stage change through weather,
light, ambience, short text, object state, and motion.

`readingHint` must appear inside the selected template's own companion control or main object.
Do not create a second generic stage panel, floating tag cloud, or persistent text bubble outside the template.
If a scene needs text, show at most one short line after stage change, then fade it out.

## Companion Control

Each template must embed these controls in its own visual language:

- replay guide;
- current-stage weather strength: off / low / medium;
- sound play/pause/volume;
- 3 to 6 stage switcher;
- reading timer: pause / resume / reset;
- 25-minute pomodoro.

After the guide, each template defines its own companion visibility: some collapse to a small entry and expand on click, others embed controls directly into the device. Follow the selected template's companion control spec.
Never generate the old generic bottom-right "Reading Companion" card.

## Template UI Language

Each template has a distinct design language for controls. Do not mix languages across templates.

- **vinyl / instrument**: Use skeuomorphic controls — rotary knobs for continuous values (volume, tuning, weather intensity), toggle switches or mechanical buttons for discrete states (sound on/off, timer mode), LCD or seven-segment for timer, groove marks / channel buttons / liner tabs for stage switching. Do not label controls with raw text like "mute", "volume", "start" on the control surface.
- **window**: Use frosted glass and modern UI — glass-edge tabs, condensation marks, paper slips as control entry points. The design language is transparent, layered, and ambient. One fixed component style can be reused for all window pages.
- **route**: Use paper and travel textures — ticket stubs, stamps, signposts, map legends, compass plates. The design language is worn, folded, inked, and stamped.
- **oracle**: Use card and cloth textures — card faces, linen cloth, candle glow, ink wash. The design language is ritual, slow, and symbolic.

Rule: do not try to render materials that CSS cannot achieve (e.g. real wood grain, photorealistic metal). Keep textures achievable with gradients, shadows, and SVG.

## Layering Model

Before writing code, make one decision for each layer:

```text
Background     main visual and safe composition area
Atmosphere     weather, particles, light, breath, texture, lines, depth
Spatial Object selected template's main object
Entry Guide    text hierarchy, focus, p5/light/object feedback
Companion UI   template-defined companion entry and controls
Audio          BGM, ambience, fades, fallback behavior
App State      how stage, sound, timer, guide, and weather affect the scene
```

These decisions may appear in `space-spec.json`, `app.js`, or `style.css`, but must not appear as visible
labels in the final page. Never display agent-facing labels such as `Deck Palette`, `Symbol System`,
`Style Strategy`, `visualMotif`, `prompt`, or `design strategy`.

## Old Output Reuse

Old `output/` folders may be used as **asset libraries only**. An agent inspecting a prior output may:

- copy media assets: audio files, images, textures, fonts;
- read asset paths and assess asset suitability for the new book.

An agent must **not** copy from old outputs:

- HTML structure or DOM layout;
- CSS architecture or stylesheet rules;
- JavaScript app logic, event wiring, or interaction framework;
- `space-spec.json`, `app.js`, or `index.html` structure.

If an old output is inspected, use it only for asset discovery, not as a page implementation reference.
Every page must be authored fresh for the current book.

## Visual Assets

- `window`, `vinyl`, and `route` normally use one generated 16:9 main image.
- `instrument` and `oracle` normally build the main object with DOM/CSS/SVG/p5 and do not call image generation.
- Convert design requirements into pure visual prompts before using an image tool.
- Generated images must contain no text, letters, numbers, logos, watermarks, signs, labels, UI, or panels.
- `window` base image must show a complete window reading space: window plus outside view at least 70% of frame; visible outside view at least 55%; indoor furniture at most 30%.
- Only `window` may create up to three image-to-image weather/view variants from the base image.

## Sound

- Generate or reuse exactly one BGM for the whole book.
- BGM generation requests must include `is_instrumental: true`.
- Final BGM status must be `generated`, `reused`, or `failed`, never `skipped`.
- After user clicks Start, play BGM immediately.
- If BGM fails, play ambience immediately.
- Do not wait for local JSON or remote generation before deciding playback paths.
- Copy only actually used audio assets.

## Validation

Run deterministic checks only:

```bash
node --check "output/<task-folder>/app.js"
node references/tests/evaluate-vibereading-output.mjs "output/<task-folder>"
```

Use validation failures to fix deterministic issues only. Do not spend time writing aesthetic self-reviews.

Do not attempt visual/browser-based validation. Visual review is handled separately by CASE with dedicated tooling. The generating agent's job is to deliver quality output fast — do not waste tokens on visual self-inspection.
