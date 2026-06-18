# p5 Weather And Atmospheric Effects

Use p5 for weather, particles, guide art, and stage feedback when CSS alone feels flat.
Do not use p5 to draw real HTML controls. Controls must remain accessible HTML.

## Purpose

Atmosphere is persistent spatial weather:

```text
light, shadow, texture, particles, lines, depth, environmental motion
```

Every page must include at least one weather or atmospheric effect. Prefer stage-specific effects when possible.

## Standard Profiles

Use or adapt these profiles:

| profile | visual behavior | useful for |
| --- | --- | --- |
| `rain` | diagonal streaks, glass beads, bottom ripples | windows, memory, night streets |
| `fog` | soft drifting fields, depth haze, focus reveal | uncertainty, quiet books, interiors |
| `snow` | slow particles, pale glow, muffled depth | winter, distance, silence |
| `dust` | floating motes, warm light shafts | archives, old rooms, history |
| `signal` | scanlines, wave noise, tuning jitter | instrument, media, systems |
| `ripple` | expanding circles, refracted highlights | water, dreams, memory |
| `stars` | slow drift, small parallax, dark space | myth, philosophy, cosmic distance |
| `paper` | fibers, ash specks, ink blooms | oracle, letters, literary fragments |
| `wind` | directional particles, cloth/leaf motion | route, travel, exposed landscapes |

## Stage Adaptation

Each stage should set:

```text
weather.kind
weather.defaultLevel
light
ambience
motion
uiAccent
```

Examples:

```json
{
  "label": "Early Rooms",
  "weather": { "kind": "fog", "defaultLevel": "low" },
  "light": "warm lamp glow with cooler window edges",
  "motion": "slow condensation drift"
}
```

The weather control changes only the current stage strength:

```text
off     no particles, keep static light/texture
low     visible but calm
medium  stronger motion, still readable
```

## Guide Effects

The guide should use p5 or object feedback, not text-only fades.

Ideas by template:

- Window: rain gathers on glass, fog clears near the text, outside light blooms.
- Vinyl: groove highlights orbit, dust follows the record, tonearm shadow moves.
- Instrument: scanlines stabilize, noise collapses into a readable channel, indicator lights pulse.
- Route: route line draws forward, station dots glow in staggered order, dust/wind crosses the path.
- Oracle: card shadows gather, candle motes drift, ink or star particles converge on the selected card.

## Audio-Weather Coupling

The following ambience-to-weather pairings are **mandatory**. All other ambience and weather combinations have no coupling requirement — use whatever fits the book.

| Ambience assets | Required `weather.kind` |
| --- | --- |
| `drizzle`, `moderate-rain`, `rain-on-the-window`, `thunder-freight` | `rain` or `storm-rain` |
| `fireplace-crackling` | `fire` or `embers` |
| `soft-wind`, `distant-breeze`, `forest-wind-with-birds`, `windstorm` | `wind` |
| `lake-wavelet`, `sea-and-seagull-wave`, `mountain-stream` | `ripple` or `water` |

This is a strict allowlist: only the pairs above are enforced. Assets not listed here (birds, library, cafe, city apartment, etc.) have no visual requirement.

## Implementation Rules

- Mount p5 into `[data-vr-weather]` or a template-owned art layer.
- Keep `pointer-events: none` on weather canvases.
- Resize on window resize.
- Destroy old p5 instances before creating new ones.
- Respect `prefers-reduced-motion`: reduce particle count and speed, keep static light/focus.
- Do not block the main thread with thousands of particles.
- Do not hide text readability.

## Visual Quality Rules

- Use several particle sizes and alpha values.
- Let particles react to stage light/accent.
- Add depth with parallax speed differences.
- Use slow movement; avoid arcade effects.
- Combine particles with CSS gradients, masks, and blend modes.
- Make low level clearly visible; otherwise the control feels broken.
