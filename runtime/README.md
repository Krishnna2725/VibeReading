# V2 Shared Runtime

Generated pages must copy and link the shared runtime. Do not inline it after copying it, and do not load the same runtime script or stylesheet twice.

Use the scaffold:

```bash
python scripts/scaffold-output.py --output-dir "output/<task>"
```

Standard load order:

```html
<link rel="stylesheet" href="./runtime/v2-runtime.css">
<link rel="stylesheet" href="./style.css">
...
<script src="./app.js"></script>
<script src="./runtime/v2-runtime.js"></script>
```

`app.js` must synchronously define `window.VIBE_READING_SPEC` at top level.

The runtime owns:

- guide state and click-stepped guide progression;
- sound start and BGM-to-ambience fallback;
- weather layer setup;
- stage switching events;
- timer and pomodoro state;
- `data-vr-*` event binding.

The runtime binds state and events only. Each template provides its own embedded companion control and connects it through `data-vr-stage`, `data-vr-current-stage`, `data-vr-current-hint`, `data-vr-weather-level`, `data-vr-sound-toggle`, and `data-vr-timer-*` attributes.

The scaffold copies local `runtime/libs/p5.min.js`. Shared weather prefers p5 instance mode and falls back to Canvas 2D if p5 is unavailable.
