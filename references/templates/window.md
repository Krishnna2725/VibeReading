# Window

## Role

Use a window-side reading space to let the reader look, wait, and tune weather.
The book is expressed through outside view, glass, weather, light, and a few short text moments.

## Best For

Literary fiction, nature, place, seasons, solitude, urban observation, waiting, memory, and books with strong atmosphere.

## Production Mode

Image-led.
Generate a complete 16:9 window-side scene as the base image. The frontend should add weather, guide, stage transitions, and the template control; it should not redraw a complex window.

Before writing the image prompt, decide explicitly:

```text
single-image mode
or
base image + 1 to 3 image-to-image stage variants
```

Use variants only when changes in outside world, season, weather, time, or light
carry meaningful reading-stage differences. Do not generate extra variants by
habit.

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

The final prompt submitted to the image tool must not exceed 400 Unicode
characters. Distill the composition, outside world, light, material, mood, and
negative constraints before submission; do not paste planning prose into the
image tool.

### Output Files

When image generation is used, write:

```text
concept-image.png
stage-2.png       optional
stage-3.png       optional
stage-4.png       optional
```

## Window Control Language

Agents must design the control as part of the window-side reading space itself.

### Control Contract

- Controls feel like part of the window or glass structure.
- The default state is collapsed so the reading view stays clean.
- Expanded state should still preserve most of the reading view.
- The entry point should feel adjacent to the book and window: latch, condensation mark, glass-edge tab, paper slip, sill mark, or another window-native cue.
- The runtime only wires stable hooks; it does not provide a fixed four-layer panel or fixed bottom-center dock.

### Control Behavior

- After guide completes, the control entry should remain discoverable but restrained.
- Expand and collapse behavior should feel physically related to the window/book relationship.
- Stage info, timer, weather, sound, and replay guide may be distributed across the window object, as long as the interaction language stays coherent.
- The control must not become a pasted-on dashboard card.

### Why This Matters

Window pages need consistency of capability without losing book-specific authorship.
The shared shell now guarantees wiring only. The page author decides how the
glass, sill, latch, tabs, and slips become the actual interface.

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
- pasted generic companion cards or fixed dashboard slabs;
- stage chips covering the view;
- image prompts that include UI instructions or text.
