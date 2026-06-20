# Window

## Role

Use a window-side reading space to let the reader look, wait, and tune weather.
The book is expressed through outside view, glass, weather, light, and a few short text moments.

## Best For

Literary fiction, nature, place, seasons, solitude, urban observation, waiting, memory, and books with strong atmosphere.

## Production Mode

Image-led.
Generate a complete 16:9 window-side scene as the base image. The frontend should add weather, guide, stage transitions, and the template control; it should not redraw a complex window.

## Image Composition Contract

The image prompt must include:

```text
The window and outside view occupy at least 70% of the frame.
The visible outside scenery occupies at least 55% of the frame.
Indoor furniture and interior decor occupy no more than 30% of the frame.
Do not make chairs, sofas, beds, desk lamps, bookshelves, or desks the main subject.
No text, no letters, no numbers, no logo, no watermark, no signage, no labels, no UI, no panels.
```

The generated image may include interior context, but the window and outside world must dominate.

### Variants

Only `window` may generate up to three variants from the base image.
Variants may change:

```text
outside view, weather, season, time of day, light
```

Do not change:

```text
camera angle, window geometry, room structure, book identity
```

If only one image is available, use p5 weather, light overlays, glass texture, and color grading for stage changes.

### Prompt Discipline

The image prompt is for the image model only. Do not paste UI requirements, runtime instructions, checklist text, or implementation notes into it. Convert requirements into pure visual language:

```text
subject, composition, lighting, material, camera, mood, color, texture, negative constraints
```

Always include the exact no-text constraint. Never generate text embedded in images, UI controls inside images, posters, title cards, signs, labels, book covers with readable text, over-detailed furniture, or faces unless explicitly necessary and spoiler-safe.

### Output Files

When image generation is used, save only the image assets and declare every path in `space-spec.json` `assets.images[]`:

```text
assets/images/base.png
assets/images/stage-2.png       optional
assets/images/stage-3.png       optional
assets/images/stage-4.png       optional
```

The image prompt is a process input, not a deliverable file.

## Window Companion Panel (阿勒泰规格)

The Window template uses a **预制 companion panel** injected by the runtime. This is the fixed engineering contract — agents do not design the panel, they use it.

### Panel Contract

```text
position:         fixed, bottom center
max-width:        min(74vw, 640px)
border-radius:    20px 20px 0 0
background:       rgba(18, 20, 20, 0.74) with backdrop-filter: blur(16px)
border:           1px solid rgba(255,255,255,0.1), bottom none
z-index:          50
```

### Panel Structure (Four Layers)

```text
Layer 1: Stage Selector
  - horizontal scroll row of stage pills
  - data-vr-stage attributes for runtime binding
  - aria-pressed state for current stage

Layer 2: Stage Info
  - data-vr-current-stage  (title, accent color)
  - data-vr-current-range  (chapter range)
  - data-vr-current-hint   (reading hint)

Layer 3: Controls Row
  - data-vr-timer-display  (MM:SS)
  - data-vr-timer-toggle   (pause/resume)
  - data-vr-timer-reset
  - data-vr-timer-mode     (elapsed/pomodoro select)
  - data-vr-sound-toggle   (mute/unmute)
  - data-vr-bgm-volume     (range slider)
  - data-vr-ambience-volume (range slider)
  - data-vr-weather-level  (off/low/medium buttons)
  - data-vr-guide-replay

Layer 4: Note Area
  - data-vr-note-textarea  (reading note input)
  - data-vr-note-save      (save as markdown)
```

### Panel Behavior

- After guide completes, the panel fades in at bottom center.
- The panel toggle tab collapses/expands the panel content.
- The panel is always visible in reading mode (data-vr-mode="reading").
- Frosted glass style may be recolored via --book-accent for book theming.
- The panel does NOT cover the window view — it sits at the bottom edge.

### Why This Panel Exists

Previously, the Window companion was a right-bottom 220px card that agents had to design from scratch each time. This led to inconsistent, fragile outputs. The预制 panel eliminates that variance: every Window page gets the same solid panel, and the agent only writes book-specific stage data and visual styling around it.

## Stage Switching

Window may create one base image plus up to three image-to-image variants.
Use p5 weather, light overlays, and color grading for stage changes when only one image is available.

## Weather / Atmosphere

Weather is the main expressive engine.

Stage examples:

- early: mist, weak dawn, light condensation;
- middle: rain streaks, city reflections, stronger wind;
- late: snow, night reflection, dark glass, distant lights.

Low and medium levels must both be visible.

The runtime provides these weather presets (see `effects-recipes.md` for full spec):
`rain`, `storm-rain`, `fog`, `snow`, `wind`, `ripple`, `water`, `dust`, `embers`, `fire`, `signal`, `paper`, `stars`.

## Entry Guide

The guide feels like slowly seeing through glass.

- Text appears near frame, sill, reflection, or dim interior.
- Focus mask points to the outside view or glass surface.
- Object feedback may be fog clearing, rain appearing, latch glow, or window light changing.
- Skip is secondary, not an invitation to avoid the ceremony.

Guide motion preset: `window-fog-clear` (particles fall like condensation, window frame draws, glass clears).

## Visual Anti-Patterns

UI control vocabulary for window:

- All controls use frosted glass / modern UI language
- One consistent component style: translucent pill buttons, glass-edge sliders, minimal icons
- Control entry: condensation mark, latch, paper slip, glass-edge tab (expand on click)
- No skeuomorphic knobs or mechanical textures

Avoid:

- interior furniture as main subject;
- centered subtitle-only guide;
- companion card floating far from the window;
- stage chips covering the view;
- image prompts that include UI instructions or text;
- right-bottom 220px small card (use the预制 panel instead).
