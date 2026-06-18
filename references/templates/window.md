# Window

## Role

Use a window-side reading space to let the reader look, wait, and tune weather.
The book is expressed through outside view, glass, weather, light, and a few short text moments.

## Best For

Literary fiction, nature, place, seasons, solitude, urban observation, waiting, memory, and books with strong atmosphere.

## Stable Object Skeleton

The image is the main visual, but the template still needs a surrounding DOM structure:

```text
.vr-scene                          (full viewport, 16:9)
  img.vr-scene-image               (base image or current stage variant)
  .vr-weather-layer                 (p5 or canvas weather overlay, pointer-events: none)
  .vr-window-frame                  (CSS border/shadow framing the glass edge)
  [data-vr-stage]                   (stage indicator strip or glass-edge marks)
  [data-vr-companion]               (companion entry: condensation mark, latch, paper slip)
  .vr-guide (data-vr-guide)         (pre-reading guide overlay)
```

The frame, stage indicator, and companion entry sit on top of the image but must not dominate it. Weather renders behind the frame but in front of (or blended with) the image.

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

## Stage Switching

Window may create one base image plus up to three image-to-image variants.
Variants may change:

```text
outside view, weather, season, time of day, light
```

Do not change:

```text
camera angle, window geometry, room structure, book identity
```

If only one image is available, use p5 weather, light overlays, glass texture, and color grading for stage changes.

## Companion Control

After the guide, show only the small companion entry (condensation mark, latch, paper slip, glass-edge tab) by default. Expand the full control panel only after user click. The expanded control may sit along the frame or sill, but must not cover the window view.

Required functions:

- replay guide;
- stage switching;
- weather strength for current stage;
- sound;
- reading timer and pomodoro.

## Weather / Atmosphere

Weather is the main expressive engine.

Stage examples:

- early: mist, weak dawn, light condensation;
- middle: rain streaks, city reflections, stronger wind;
- late: snow, night reflection, dark glass, distant lights.

Low and medium levels must both be visible.

## Entry Guide

The guide feels like slowly seeing through glass.

- Text appears near frame, sill, reflection, or dim interior.
- Focus mask points to the outside view or glass surface.
- Object feedback may be fog clearing, rain appearing, latch glow, or window light changing.
- Skip is secondary, not an invitation to avoid the ceremony.

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
- image prompts that include UI instructions or text.
