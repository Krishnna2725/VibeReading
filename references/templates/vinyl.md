# Vinyl

## Role

Use a record player as a reading ritual. The book becomes one instrumental record: the needle drops once, and stages feel like liner notes, groove positions, sleeve marks, or side changes.

The whole book still uses one BGM.

## Best For

Memory, time, music-like prose, private history, nostalgia, albums, letters, and books that feel intimate or cyclical.

## Stable Object Skeleton

Build a strong record player scene:

```text
.vr-scene                          (full viewport, 16:9)
  .vr-vinyl-player                  (turntable container, centered or slightly off-center)
    .vr-vinyl-platter               (spinning record disc, CSS animation or p5)
      .vr-vinyl-label               (center label or mark, stage-aware color)
    .vr-vinyl-tonearm               (arm with pivot, rests on record when playing)
    .vr-vinyl-base                  (player body, wood/metal/plastic material)
  .vr-vinyl-sleeve                  (album sleeve or liner notes area, optional image)
  .vr-weather-layer                 (dust, lamplight, rain outside — pointer-events: none)
  [data-vr-stage]                   (stage marks on groove, liner tabs, or sleeve)
  [data-vr-companion]               (companion entry: volume knob, preamp switch, sleeve flap)
  .vr-guide (data-vr-guide)         (pre-reading guide overlay)
```

The record, tonearm, and sleeve must feel like physical objects with material. Do not make it only a flat circle with buttons.

## Production Mode

Use DOM/CSS/SVG/p5 for the player and motion.
Optionally generate one cover/sleeve or background image if it improves the book identity.

## Stage Switching

Stage switching does not change BGM.
Express stages through:

- tonearm position;
- label marker;
- groove highlight;
- liner note tab;
- sleeve insert;
- side/track cue without implying multiple songs.

If there are many chapters, use a compact groove scale or liner tabs, not large cards.

## Companion Control

The control must belong to the player. Controls are always visible as part of the record player — do not collapse or hide them behind a toggle:

- stage switcher as groove/track selector;
- weather as surface dust, room rain, lamp haze, or paper atmosphere;
- sound control as volume knob or preamp switch;
- timer as small counter, tape label, or sleeve stamp;
- replay guide as needle-lift or power action.

No external generic companion card.

## Weather / Atmosphere

Vinyl weather can be:

- dust in lamplight;
- rain outside the listening room;
- paper fibers on sleeve;
- groove shimmer;
- smoke-like room haze;
- low amber static.

Each stage should adjust light, dust, sleeve texture, or groove behavior.

## Entry Guide

The guide feels like a needle-drop ceremony.

- Start powers the player and begins sound.
- First step: record rotates slowly; tonearm hovers.
- Later steps: needle descends, groove glow responds, liner note text appears.
- Text should live near sleeve, label, tonearm, or liner notes, not as generic centered subtitles.
- Every step waits for user click.

## Visual Anti-Patterns

UI control vocabulary for vinyl:

- Continuous values (volume, weather intensity): rotary knob with conic-gradient brass/bakelite surface, hidden range input for interaction, rotation dot indicator
- Discrete states (sound toggle, timer mode): mechanical toggle switch or small push button
- Timer display: tape counter, sleeve stamp, or small LCD embedded in player base
- Stage switching: groove marks, liner tabs, or label position indicators
- Do not use: generic HTML buttons with text labels ("mute", "start", "play"), default range sliders, dropdown selects, checkboxes

Avoid:

- many records or album tracks unless explicitly requested;
- default audio sliders;
- flat black disc with no material;
- long explanatory panels;
- generic bottom-right card.
