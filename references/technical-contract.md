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
soundState    playing / paused / bgm-failed-ambience / bgm+ambience
stageIndex    0-based current stage
weatherLevel  off / medium / high
timerState    reading / paused / pomodoro
panelState    template-defined
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

- No template control block shall exceed 80vw width.
- Control height should not exceed 45vh unless the template object itself justifies it.

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
50      template-owned control layers
70      toast / notification
100     pre-reading guide overlay
200     toast (runtime-injected)
```

### Scrim

Image-led templates may add a contrast layer when weather or controls would
otherwise disappear against the image. Its color, opacity, blend mode, and
placement belong to the selected template's art direction; the shared runtime
does not inject a fixed scrim.

## Controls

Each template must provide accessible HTML controls for:

- Start / Continue / Skip guide;
- replay guide;
- sound play/pause and volume;
- stage switching;
- weather strength for the current stage;
- timer pause/resume/reset;
- pomodoro mode.

Use Chinese reader-facing button labels by default. The runtime hooks remain in
English because they are implementation identifiers, not visible copy.

Stage controls are authored by the selected template. The runtime binds existing `[data-vr-stage]` controls.

Keep real controls as accessible HTML, styled to belong to the selected template object.

## Sound

Use this data contract:

```js
audio: {
  bgmFile: "./assets/audio/bgm.mp3",
  ambienceFiles: {
    "rain-window": "./assets/audio/rain-window.mp3"
  }
}

stage: {
  ambience: "rain-window"
}
```

On Start click:

1. call `audio.play()` for BGM immediately;
2. resolve the current stage ambience from `stage.ambience`;
3. allow BGM and current ambience to coexist;
4. if BGM errors, keep current stage ambience as fallback when possible;
5. keep volume fades smooth;
6. BGM and ambience have separate volume controls in runtime state;
7. when switching stages, old ambience fades out and new ambience fades in.

Do not iterate through the full ambience library and play everything.

## Guide

The guide must be click-stepped, not timed auto-play.
The shared shell provides only the guide root and neutral overlay layers.
Guide content hierarchy, text placement, button placement, and visual form are authored by the page itself.

The skip action must enter the reading space and still start sound/fallback.

## Validation

Run:

```bash
node --check "output/<task-folder>/app.js"
node references/tests/evaluate-vibereading-output.mjs "output/<task-folder>"
```

Use validation failures to fix deterministic runtime issues only. Do not turn validation back into a fixed UI DOM audit.
