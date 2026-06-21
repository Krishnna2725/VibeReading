# Technical Contract

The page must work as separated `index.html`, `style.css`, and `app.js` files with copied local assets.

## Runtime State

Use one global config:

```js
window.VIBE_READING_SPEC = {
  book: {},
  template: {},
  entryGuide: {},
  audio: {},
  stages: []
};
```

Core states:

```text
guideState    not-started / active / complete
soundState    playing / paused / bgm-failed-ambience
stageIndex    0-based current stage
weatherLevel  off / low / medium
timerState    reading / paused / pomodoro
panelState    expanded / collapsed
```

Use runtime events when useful:

```text
vibereading:guide-step
vibereading:guide-complete
vibereading:stage
vibereading:weather
vibereading:bgm-volume
vibereading:ambience-volume
vibereading:pomodoro-complete
vibereading:sound-unavailable
```

## File Rules

- Do not use `fetch()` for local JSON metadata.
- Do not inline the shared runtime.
- Do not load the shared runtime twice.
- Do not depend on a local web server for normal use; `file://` must work.
- HTML must link local CSS and JS with relative paths.
- All referenced assets must exist in the output folder.
- Load order: `p5.min.js` → `app.js` → `v2-runtime.js` (app.js defines spec before runtime reads it).

## Desktop 16:9 Hard Rules

These constraints solve "font too small / UI runs off screen / manual zoom to find controls":

### Viewport

- Target viewport: 16:9 horizontal desktop (1920×1080, 1440×810, 1280×720).
- Use `aspect-ratio: 16 / 9` or equivalent in CSS.
- All core UI must be visible in the first viewport — no scrolling required.

### No Mobile

- Do not build mobile-first layouts.
- Do not add responsive breakpoints for screens narrower than 720px.
- Do not use `@media (max-width: ...)` to restack panels.
- Mobile adaptation is explicitly out of scope.

### Typography

- Minimum body font size: `0.72rem` (≈11.5px).
- Minimum control label font size: `0.65rem` (≈10.4px).
- Maximum title font size: `clamp(2.6rem, 7vw, 6.4rem)`.

### Control Interaction Area

- Minimum button/control touch target: 32px height.
- Minimum range input height: 4px (with 32px hit area).
- Controls must not overlap each other.

### Panel Dimensions

- Window companion panel: `max-width: min(74vw, 640px)`, positioned at bottom center.
- No panel shall exceed 80vw width.
- Panel height should not exceed 45vh (leave room for the scene above).

### Text Overflow

- All text containers must use `text-wrap: balance` or `overflow-wrap: break-word`.
- No text shall overflow its container horizontally.
- Stage pills and control buttons must have `white-space: nowrap` or `overflow: hidden`.

### Z-Index Hierarchy

Fixed z-index scale (no z-index wars):

```text
0-4     atmospheric engine (light, shadow, grain, depth, weather) — pointer-events: none
5-10    scene shell, template affordances
20-30   micro-spaces, detail chambers
40      companion-mode overlay
50      companion panel, modals, stage selector, atmosphere control
70      toast / notification
100     pre-reading guide overlay
200     toast (runtime-injected)
```

### Scrim

All image-led templates (window, vinyl, route) must include a fixed light scrim:

```css
.vr-scene::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  background: rgba(4, 8, 10, 0.16);
  pointer-events: none;
}
```

This scrim is **fixed** — it is not variable, not adjustable, and not optional.
It ensures weather particles are visible on bright backgrounds without darkening the scene.

## Controls

Each template must provide accessible HTML controls for:

- Start / Continue / Skip guide;
- replay guide;
- sound play/pause and volume (BGM and ambience separately);
- stage switching;
- weather strength for the current stage (off / low / medium);
- timer pause/resume/reset;
- pomodoro mode.

Stage controls are authored by the selected template. The runtime binds existing `[data-vr-stage]` controls.
The Window template uses a预制 panel with all controls pre-structured.

Keep real controls as accessible HTML, styled to belong to the selected template object.

## Sound

On Start click:

1. call `audio.play()` for BGM immediately;
2. if BGM errors, switch to ambience immediately;
3. keep volume fades smooth;
4. BGM and ambience have **separate volume sliders** — the runtime holds `bgmVolume` and `ambienceVolume` independently;
5. keep sound toggle available in the template control.

## Guide

The guide must be click-stepped, not timed auto-play.
The skip action must enter the reading space and still start sound/fallback.

## 16:9

The first viewport must show the full main object and primary controls at 16:9.
Use `aspect-ratio: 16 / 9` or equivalent aspect-ratio handling.
Do not hide essential controls below the fold in a normal 16:9 desktop viewport.

## Validation

Run:

```bash
node --check "output/<task-folder>/app.js"
node references/tests/evaluate-vibereading-output.mjs "output/<task-folder>"
```

Use validation failures to fix deterministic issues only. Do not spend time writing aesthetic self-reviews.
