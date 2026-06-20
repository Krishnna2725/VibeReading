# Image Generation

Use image generation only when the selected template needs image assets.

Default:

- `window`: generate one base 16:9 image; optionally up to three image-to-image variants.
- `vinyl`: generate one cover/sleeve or atmospheric main image if useful.
- `route`: generate one route/travel image if useful.
- `instrument`: normally no image generation; build with DOM/CSS/SVG/p5.
- `oracle`: normally no image generation; build with DOM/CSS/p5.

## Prompt Discipline

The image prompt is for the image model only. Do not paste UI requirements, runtime instructions, checklist text, or implementation notes into it.

Convert requirements into pure visual language:

```text
subject, composition, lighting, material, camera, mood, color, texture, negative constraints
```

Always include the exact no-text constraint:

```text
No text, no letters, no numbers, no logo, no watermark, no signage, no labels, no UI, no panels.
```

## Window Composition

For `window`, the prompt must explicitly enforce:

```text
The window and outside view occupy at least 70% of the frame.
The visible outside scenery occupies at least 55% of the frame.
Indoor furniture and interior decor occupy no more than 30% of the frame.
Do not make chairs, sofas, beds, desk lamps, bookshelves, or desks the main subject.
```

The generated base image should already contain the complete window-side reading space.
The frontend should not redraw a complex window frame.

## Variants

Only `window` may generate up to three variants from the base image.
Variants may change:

```text
outside view, weather, season, time of day, light
```

Variants must preserve:

```text
room structure, camera angle, main window geometry, book identity
```

## Output Files

When image generation is used, write:

```text
concept-image.png
prompts/image.txt
stage-2.png       optional
stage-3.png       optional
stage-4.png       optional
```

If a template does not use generated imagery, it may still include a simple placeholder `concept-image.png` only when the output contract requires it; do not let that placeholder carry real UI.

## Negative Constraints

Never generate:

- text embedded in images;
- UI controls inside images;
- posters, title cards, signs, labels, book covers with readable text;
- over-detailed furniture that steals focus from the template;
- faces or characters unless explicitly necessary and spoiler-safe.
