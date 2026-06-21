# p5 Weather And Atmospheric Effects

Use p5 for weather, particles, guide art, and stage feedback when CSS alone feels flat.
Do not use p5 to draw real HTML controls. Controls must remain accessible HTML.

## Runtime Effect Presets

The runtime (`v2-runtime.js`) has built-in presets for all weather kinds below.
Agents select weather via `weather.kind` in `space-spec.json` — **do not write custom p5 sketches**.

```js
// In space-spec.json / app.js:
{ "weather": { "kind": "rain", "defaultLevel": "medium" } }
```

### Preset Catalog

| kind | visual behavior | useful for | status |
| --- | --- | --- | --- |
| `rain` | diagonal streaks, splash ripples, depth glow | windows, memory, night streets | implemented |
| `storm-rain` | heavy rain, wind斜 streaks, strong splash | storms, drama, conflict | implemented |
| `fog` | noise-drifted fields, multi-layer depth haze | uncertainty, quiet books, interiors | implemented |
| `snow` | noise-wind drift, dual-layer glow particles | winter, distance, silence | implemented |
| `wind` | noise-gust curved streaks, turbulence | route, travel, exposed landscapes | implemented |
| `ripple` | expanding concentric circles, life-cycle fade | water, dreams, memory | implemented |
| `water` | horizontal wave curves, gentle drift | rivers, lakes, calm water | implemented |
| `dust` | floating warm motes, gentle gravity | archives, old rooms, history | implemented |
| `embers` | rising sparks with glow halos, noise-waver | fireplace, warmth, evening | implemented |
| `fire` | noise-flicker three-layer flame, turbulence | fireplaces, warmth, intensity | implemented |
| `signal` | scanlines with sweep bright spot | instrument, media, systems | implemented |
| `paper` | rotating fiber shapes, gentle drift | oracle, letters, literary fragments | implemented |
| `stars` | twinkle with parallax depth, slow drift | myth, philosophy, cosmic distance | implemented |
| `leaves` | polygon leaf shape, vein detail, depth parallax, noise-wind | autumn, nature, change | implemented |
| `fireflies` | triple-glow, flocking neighbor attraction, mouse interaction | summer nights, quiet wonder | implemented |

> Status lifecycle: `implemented` → `visually approved` (after effect gallery review) → `fixture covered` (after visual fixture test). Do not mark as `visually approved` without a rendered screenshot comparison.

### Unified Entry Point

The runtime exposes `renderEffect()` for programmatic effect creation:

```js
renderEffect({ layer, kind, level, accent, mode, reducedMotion })
```

Parameters:
- `layer`: DOM element to mount the effect canvas into
- `kind`: weather kind string (from allowlist)
- `level`: "off" / "medium" / "high"
- `accent`: stage.uiAccent color
- `mode`: "weather" | "guide"
- `reducedMotion`: boolean

In practice, agents don't call this directly. They set `weather.kind` in the spec and the runtime handles rendering.

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
  "weather": { "kind": "fog", "defaultLevel": "medium" },
  "light": "warm lamp glow with cooler window edges",
  "motion": "slow condensation drift"
}
```

The weather control changes only the current stage strength:

```text
off     no particles, keep static light/texture
medium  clearly visible, calm enough for normal reading (default)
high    denser and more expressive, while controls remain readable
```

## Guide Effects

The guide should use p5 or object feedback, not text-only fades.

The runtime provides **guide motion presets** per template. Agents select via `entryGuide.motion`:

| preset | template | behavior |
| --- | --- | --- |
| `window-fog-clear` | window | particles fall like condensation, window frame draws, glass clears |
| `vinyl-groove-orbit` | vinyl | groove circles orbit, dust follows, tonearm shadow |
| `instrument-scan-lock` | instrument | scanlines stabilize, noise collapses, indicator lights pulse |
| `route-path-light` | route | route line draws forward, station dots glow |
| `oracle-card-reveal` | oracle | card shadows gather, candle motes, ink/star converge |

Agents select by name in `entryGuide.motion`:

```json
{ "entryGuide": { "motion": "window-fog-clear" } }
```

Do not write custom p5 guide sketches. Use the preset names.

## Audio-Weather Coupling

The following ambience-to-weather pairings are recommended defaults. Known mismatches may produce a non-blocking validator warning; they never fail delivery. All other combinations are left to the book-specific art direction.

| Ambience assets | Required `weather.kind` |
| --- | --- |
| `drizzle`, `moderate-rain`, `rain-on-the-window`, `thunder-freight` | `rain` or `storm-rain` |
| `fireplace-crackling` | `fire` or `embers` |
| `soft-wind`, `distant-breeze`, `forest-wind-with-birds`, `windstorm` | `wind` |
| `lake-wavelet`, `sea-and-seagull-wave`, `mountain-stream` | `ripple` or `water` |

Assets not listed here (birds, library, cafe, city apartment, etc.) have no visual recommendation.

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
- Make medium clearly visible and high meaningfully stronger; otherwise the control feels broken.
