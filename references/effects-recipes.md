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

Environment sound and weather visuals must describe the same physical phenomenon. A mismatch between what the ear hears and what the eye sees is worse than no effect at all — it breaks the reader's sensory coherence.

### Rules

1. If a stage uses an ambience asset whose `visualRequired` is `true` in `audio-manifest.json`, the `weather.kind` for that stage must be a matching visual weather type.
2. If a stage uses a visual weather type (`rain`, `fire`, `wind`, `ripple`, `water`), the stage ambience should preferably be from a matching audio category. Do not pair rain visuals with fireplace audio, or water visuals with wind audio.
3. If the ambience is `indoor-ambient` or `ambient-nature` (`visualRequired: false`), use neutral indoor lighting, glass reflection, paper texture, or subtle nature textures — do not force rain, fire, wind, or water effects.
4. At low or medium weather intensity, the matching visual must still be visible. "off" is the only level where it disappears.

### Forbidden Mismatches

- Rain ambience + dust motes only (no rain visual)
- Fireplace audio + fog or snow visual
- Wind audio + ripple or water visual
- Wave/stream audio + fire or dust visual
- Indoor ambience (library, cafe, city apartment) + rain/fire/wind/water visual

### Audio-Visual Mapping

| Audio category / asset | Required visual direction | Notes |
| --- | --- | --- |
| `drizzle`, `moderate-rain`, `rain-on-the-window`, `thunder-freight` | `rain` / `storm-rain` | Rain streaks, glass beads, window ripples; thunder may add low-frequency light flashes but keep them subtle |
| `fireplace-crackling` | `fire` / `embers` | Slow ember drift, warm micro-glow, fireplace reflection; CSS ember layer is acceptable if p5 is unsuitable |
| `soft-wind`, `distant-breeze`, `forest-wind-with-birds`, `windstorm` | `wind` | Subtle directional lines, wind streaks, paper/window surface flow; reference "My Altay"-style subtle wind texture, not chaotic dust |
| `lake-wavelet`, `sea-and-seagull-wave`, `mountain-stream` | `ripple` / `water` | Faint expanding circles, flowing lines, low-opacity water surface disturbance |
| `birds`, `night-sound-in-village-field` | `ambient-nature` / optional `wind` | Light natural texture; must not disguise as rain or water |
| `a-small-library`, `cafe-ambience`, `city-apartment` | `indoor-ambient` / neutral | Indoor lighting, glass reflection, paper texture, low noise; no forced weather |

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
