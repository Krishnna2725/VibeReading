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
```

Use runtime events when useful:

```text
vibereading:guide-step
vibereading:guide-complete
vibereading:stage
vibereading:weather
```

## File Rules

- Do not use `fetch()` for local JSON metadata.
- Do not inline the shared runtime.
- Do not load the shared runtime twice.
- Do not depend on a local web server for normal use; `file://` must work.
- HTML must link local CSS and JS with relative paths.
- All referenced assets must exist in the output folder.

## Controls

Each template must provide accessible HTML controls for:

- Start / Continue / Skip guide;
- replay guide;
- sound play/pause and volume;
- stage switching;
- weather strength for the current stage;
- timer pause/resume/reset;
- pomodoro mode.

Stage controls are authored by the selected template. The runtime binds existing `[data-vr-stage]` controls.

Keep real controls as accessible HTML, styled to belong to the selected template object.

## Sound

On Start click:

1. call `audio.play()` for BGM immediately;
2. if BGM errors, switch to ambience immediately;
3. keep volume fades smooth;
4. keep sound toggle available in the template control.

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
