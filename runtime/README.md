# V2 Shared Runtime

Generated pages must copy and link the shared runtime. Do not inline it and do
not load it twice.

Use the scaffold:

```bash
python scripts/scaffold-output.py --output-dir "output/<task>"
```

Standard load order:

```html
<link rel="stylesheet" href="./runtime/v2-runtime.css">
<link rel="stylesheet" href="./style.css">
...
<script src="./runtime/libs/p5.min.js"></script>
<script src="./app.js"></script>
<script src="./runtime/v2-runtime.js"></script>
```

`app.js` must synchronously define `window.VIBE_READING_SPEC` at top level.

The runtime owns:

- guide state and click-stepped guide progression;
- BGM start plus current-stage ambience handling;
- stage ambience crossfades;
- weather layer setup;
- stage switching events;
- timer and pomodoro state;
- hook-based `data-vr-*` event binding.

The runtime does not define a universal companion panel. Templates provide their
own controls and connect them through shared hooks.
