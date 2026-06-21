# Oracle

## Role

Use a card table to translate the book into a set of revealable reading cards.
The cards offer spoiler-safe angles for reading. They are not fortune telling, not puzzles, and not predictions.

## Best For

Myth, allegory, poetry, psychological texts, fate-like structure, symbolic fiction, and books that invite contemplation through images and gestures.

## Production Mode

Normally no external image generation.
Build the table, card backs, card faces, guardian card, spread, reveal motion, and texture with HTML/CSS/SVG/p5.

Only generate an image if a wordless table or paper texture is genuinely needed. Card text, card structure, and controls must remain real HTML.

### Image Rules (Oracle)

- **Default: no image generation.** Build the card table with HTML/CSS/SVG/p5.
- If an image is generated, follow standard prompt discipline: no text, no UI, no labels.
- When no image is generated, do not create placeholder image deliverables.

## Stable Object Skeleton

The card table must include:

```text
.vr-scene                          (full viewport, 16:9)
  .vr-oracle-table                  (table surface with cloth/material texture)
    .vr-oracle-deck                 (card stack or draw pile)
    .vr-oracle-cards                (3 to 6 stage cards, laid out or stacked)
      .vr-oracle-card-face          (card face with readingHint text)
      .vr-oracle-card-back          (card back art system)
    .vr-oracle-guardian              (guardian / companion card, separate from stage cards)
  .vr-weather-layer                 (candle dust, ink, ash, star drift — pointer-events: none)
  [data-vr-stage]                   (card highlight, reveal position, spread state)
  .vr-guide (data-vr-guide)         (pre-reading guide overlay)
```

Cards must be real HTML elements, not images. The guardian card may expand on click to reveal the companion control.

## Deck Art Direction

Oracle must define a real card-art system before coding:

```text
deckPalette
cardMaterial
backPattern
edgeTreatment
symbolSystem
tableMaterial
revealMotion
guardianCardShape
```

These are internal decisions only. Do not display these field names in the page.

Good directions:

- ink-wash paper cards;
- dull gold edges on dark linen;
- archival index-card oracle;
- coastal shell/paper deck;
- constructivist symbolic deck;
- moonlit botanical cards;
- minimal blind-embossed cards.

Avoid white blank cards, generic tarot symbols, neon magic circles, and game-stat cards.

## Stage Switching

Stages are card draws, rows, spreads, or revealed positions.
Switching stage may:

- reveal one card;
- move the focus card forward;
- change card edge light;
- shift the table weather;
- briefly show one spoiler-safe card line.

Do not explain the plot. Do not imply prophecy.

## Companion Control

The companion control is the guardian card or a small table object. After the guide, show the guardian card in its compact form. Expand the full companion control panel only after user click.

Required functions:

- replay guide;
- stage/card switcher;
- weather strength;
- sound;
- timer/pomodoro.

The guardian card may expand on click. Do not create an external bottom-right companion card.

## Weather / Atmosphere

Oracle weather may be:

- candle dust;
- ink blooms;
- paper fibers;
- ash motes;
- star drift;
- table shadow ripple;
- slow card-edge glow.

Each stage should feel like a different table state or card atmosphere.

## Entry Guide

The guide feels like the table appearing.

- Start brings sound and the first table glow.
- First step: card backs or dust appear.
- Later steps: a card slowly turns, shadow gathers, or ink spreads.
- Text should sit near card face, cloth edge, candlelight, or guardian card.
- Every step waits for user click.

## Visual Anti-Patterns

Avoid:

- whiteboard cards;
- visible planning labels;
- random mystical clutter;
- long explanatory panels;
- generic transparent UI cards;
- a card deck whose style does not match the book.
