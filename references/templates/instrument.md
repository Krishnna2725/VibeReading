# Instrument

## Role

Build a CRT Reading Receiver: a physical device that tunes into the book as a signal.
The reader changes stages by tuning channels, stabilizing frequency, or scanning bands.

This template is usually built entirely with DOM/CSS/SVG/p5. Do not generate a large background image by default.

## Best For

Thought, social observation, systems, media, technology, politics, philosophy, nonfiction, dystopia, and books that feel like a signal being decoded.

## Avoid

Books whose main experience is landscape contemplation, travel, music memory, or mythic card symbolism may fit other templates better.

## Image Rules (Instrument)

- **Default: no image generation.** Build the CRT receiver with DOM/CSS/SVG/p5.
- If the agent determines an image is genuinely needed, follow the standard prompt discipline: no text, no UI, no labels in the image.
- When no image is generated, do not create placeholder image or prompt deliverable files.

## Stable Object Skeleton

The receiver must include:

```text
screen
channel controls
tuning control
volume control
power / guide control
small LCD timer
signal / noise feedback
```

The companion control must be inside the device. Do not add a separate generic companion panel.

## Style Strategy

The agent chooses the style according to the book.
Allowed directions include:

- Bauhaus
- Constructivism
- Atompunk
- Art Deco
- Neo-Futurism
- Cyberpunk
- Steampunk
- Neo-Brutalism
- Minimalism
- Biomorphism
- 80s nostalgic television

The style must support the idea of a "reading receiver": screen, channel scale, tuning, buttons, knobs, LCD timer, signal/noise.

Before coding, answer internally:

1. What era, culture, or imagined product world does this receiver come from?
2. How does it embody the book's atmosphere?
3. How does the screen show stage text and SVG/signal graphics?
4. How do channel/frequency controls switch reading stages?
5. How is the small LCD timer physically embedded?

Do not display these questions in the page.

## Screen

The screen is the emotional center.

It may show:

- current stage label;
- readingHint as a signal caption;
- waveform or scanline SVG;
- subtle static, interference, ghost image, or focus bloom;
- guide text during pre-reading.

Do not put long paragraphs on the screen. Keep it readable and atmospheric.

## Stage Switching

Prefer a channel or tuning metaphor:

- rotary tuner with stage positions;
- horizontal frequency scale;
- mechanical channel buttons;
- scanning bar that locks into the selected stage.

If there are many stage labels, do not make large cards. Use a dial, channel strip, or compact buttons.

The HTML must include real `[data-vr-stage]` controls shaped as receiver parts.

## Timer

The timer must feel like part of the device:

- small LCD;
- seven-segment display;
- paper counter;
- oscilloscope corner readout;
- maintenance display.

Do not let stage controls push the timer out of the 16:9 viewport.

## Weather / Atmosphere

Instrument weather can be:

- signal noise;
- scanlines;
- dust in CRT glow;
- rain reflected on screen glass;
- electromagnetic shimmer;
- paper tape flutter;
- weak broadcast waves.

Each stage should try to have a distinct signal/weather quality.

## Entry Guide

The guide feels like tuning into a stable frequency.

- Start action powers the device.
- First step: screen glow and base noise.
- Later steps: scanline stabilizes, channel pointer moves, signal becomes readable.
- Text may appear on CRT, LCD, paper tape, or device label.
- Every step waits for user click.

## Companion Control

Required functions:

- replay guide: power/guide button;
- stage switcher: channel/tuning control;
- weather strength: signal/noise or atmospheric strength;
- sound: volume/power control;
- timer/pomodoro: LCD and small mode button.

All controls are embedded directly into the receiver device and are always visible. Do not collapse or hide them behind a toggle. Do not duplicate these controls outside the receiver.

## Visual Anti-Patterns

UI control vocabulary for instrument:

- Continuous values (volume, tuning, weather): rotary knob, dial with pointer, slider as physical fader
- Discrete states: rocker switch, channel push button, indicator LED
- Timer: LCD seven-segment, oscilloscope readout, paper counter
- Stage switching: channel buttons, frequency scale, scanning bar
- Do not use: generic HTML buttons with text labels, default dropdown selects

Avoid:

- flat rectangle TV with generic buttons;
- unstyled black screen with text;
- giant bottom-right panel;
- labels like "style strategy" visible in UI;
- too many stage cards;
- tiny timer below the fold.
