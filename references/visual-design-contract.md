# High-End Visual Design Contract

Use this file before writing UI. The goal is not "pretty decoration"; it is a deliberate, book-specific object space with agency-level composition, material, typography, and motion.

## Anti-Generic Rules

The design fails if it looks like:

- default centered title + object cards + bottom-right generic panel;
- plain glassmorphism on a flat background;
- random tag pills, floating text blobs, or decorative labels;
- default system font UI without a typographic decision;
- white cards with thin borders and no material logic;
- visible agent-facing planning labels such as `prompt`, `visualMotif`, `deckPalette`, or `style strategy`.

## Required Design Decisions

Before coding, define these internally:

```text
Visual Archetype       e.g. archival noir, coastal minimalism, CRT bureau, nocturnal paper table
Material System        paper, glass, lacquer, brushed metal, rubber, dust, fog, water, vinyl, enamel
Typography             book-appropriate display rhythm + readable UI fallback
Palette                3 to 5 colors with one accent; avoid generic purple/blue gradients
Nested Architecture    object inside frame inside room, not isolated widgets on a page
Motion Choreography    slow sequence, stagger, object-state change, not random micro-motions
Weather Atmosphere     stage-aware p5/weather behavior
Companion Integration  controls must feel physically embedded in the template object
```

These decisions guide the output but must not be shown as headings in the page.

## Composition

Design for 16:9 desktop first.

- Keep one strong focal object or view.
- Reserve safe zones for guide text and companion entry.
- Use depth: foreground object, midground control surface, background atmosphere.
- Prefer asymmetry with intentional balance.
- Avoid filling every corner with UI.
- After guide exit, keep the first reading view clean.

## Typography

Use expressive typography, but keep it stable and readable.

- Pair a characterful display treatment with a quiet UI face.
- Use size contrast, tracking, opacity, and placement to create hierarchy.
- Do not rely on default `Arial`, `Roboto`, or plain system stacks unless matching the concept.
- For Chinese book copy, choose font stacks that support Chinese text gracefully.
- Avoid all-caps labels everywhere; use them only for machine/interface aesthetics.

## Materials

Make controls feel like part of the object. Each template has a design language direction — the agent chooses specific materials, era, and surface texture according to the book's character. The examples below are starting points, not fixed requirements:

- Window: frosted glass, condensation, reflection, translucent layered modern UI — no skeuomorphic knobs.
- Vinyl: paper sleeve, label ring, tonearm, groove highlights — skeuomorphic controls, continuous values via rotary knobs, discrete states via mechanical toggles.
- Instrument: screen glass, shell, rubber knobs, LCD, channel scale — skeuomorphic receiver controls embedded in the device.
- Route: ticket paper, sign, ink, road paint, station light, worn metal — travel/paper language, never specific paper type or print process.
- Oracle: card stock, cloth, gilding, candle soot, ink wash, paper fibers — card/cloth/ritual language, never specific material grade.

Use layered shadows, bevels, inner strokes, texture overlays, and subtle noise. Avoid cheap blur-only panels.

## Motion

Motion must be slow, legible, and purposeful.

- Default UI/object transitions: 900 to 1800 ms.
- Use easing such as `cubic-bezier(0.32, 0.72, 0, 1)` or similarly soft curves.
- Animate transforms and opacity before layout properties.
- Stage switching should change weather/light/object state, not only text.
- The guide must have object feedback: power-on, needle drop, glass clearing, route lighting, or card reveal.
- Respect reduced motion.

## Companion Control Quality

The companion control is not a generic card. It must be part of the template:

- visibility behavior follows the selected template's companion spec (some collapse/expand, others are always embedded);
- stage controls, weather, sound, timer, and pomodoro arranged in the object's logic;
- readable at 16:9 without hiding the main object;
- no duplicate external panel if the template object already contains controls.

## Weather Quality

Weather is a spatial layer, not a checkbox.

- Each stage should try to have a distinct weather/atmosphere profile.
- Weather may be rain, fog, snow, dust, scanlines, signal noise, heat shimmer, water ripple, star drift, paper ash, or wind.
- Controls adjust the current stage's weather strength.
- The visual effect must be clearly visible at medium and high levels without obscuring reading controls.

## Final Taste Check

Before delivery, ask:

- Does the page look like it belongs to this book?
- Is there one memorable object or view?
- Are controls integrated rather than pasted on?
- Does the guide feel like a ceremony, not subtitles?
- Would a reader understand what to click without seeing agent instructions?
