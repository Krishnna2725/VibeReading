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

| kind | visual behavior | useful for | pointer | status |
| --- | --- | --- | --- | --- |
| `rain` | multi-layer drops (far/mid/near), gust field, splash beads + elliptical ripples, surface glare | windows, memory, night streets | bend | implemented |
| `storm-rain` | enhanced rain with stronger wind, more impacts, ambient brightness pulse | storms, drama, conflict | bend | implemented |
| `fog` | low-res volume buffer, 8 elliptical clumps, 2 parallax layers, pointer dissolution via destination-out | uncertainty, quiet books, interiors | dissolve | implemented |
| `snow` | 3 depth layers, flow field, pointer attract with smooth falloff, damping + speed cap | winter, distance, silence | attract + orbit | implemented |
| `wind` | 6-point continuous curves, flow field, depth layers, gust | route, travel, exposed landscapes | bend | implemented |
| `ripple` | elliptical perspective compression, ease-out, inner ring phase offset | water, dreams, memory | spawn-ripple | implemented |
| `water` | 7-point wave bands, thin highlight strips with screen blend | rivers, lakes, calm water | bend | implemented |
| `dust` | depth-based alpha, gradient sprite rendering, pointer scatter | archives, old rooms, history | scatter | implemented |
| `embers` | gradient sprite core + warm halo, screen blend for glow | fireplace, warmth, evening | repel | implemented |
| `fire` | elliptical flame sprites (heat + flame + core), screen blend | fireplaces, warmth, intensity | illuminate | implemented |
| `signal` | scanline wobble, noise burst glitches, bright sweep | instrument, media, systems | bend | implemented |
| `paper` | flat fiber with edge highlight, rotation flip, air resistance | oracle, letters, literary fragments | scatter | implemented |
| `stars` | gradient sprite core + flare, screen blend for large stars | myth, philosophy, cosmic distance | illuminate | implemented |
| `leaves` | polygon leaf with front/back flip, air resistance, gust | autumn, nature, change | bend | implemented |
| `fireflies` | gradient sprite halo + inner + hot core, force-based pointer, flocking | summer nights, quiet wonder | repel | implemented |

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
| `window-fog-clear` | window | mist wisps thin with steps, growing light shaft |
| `window-rain-reveal` | window | diagonal rain traces on glass, reflection edge |
| `window-light-shaft` | window | expanding diagonal beam with dust motes |
| `vinyl-needle-descent` | vinyl | concentric grooves activating, needle shadow |
| `vinyl-groove-resonance` | vinyl | elliptical resonance waves from center |
| `vinyl-dust-orbit` | vinyl | dust particles orbiting central point |
| `instrument-signal-lock` | instrument | scanlines stabilizing with lock indicator |
| `instrument-dial-seek` | instrument | frequency dial sweeping with pointer line |
| `instrument-device-wake` | instrument | CRT warm-up radial glow |
| `route-path-draw` | route | path line drawing forward with station dots |
| `route-distant-lights` | route | light points appearing with glow sprites |
| `route-map-wind` | route | wind-swept texture lines |
| `oracle-table-reveal` | oracle | table texture with growing candle glow |
| `oracle-card-turn` | oracle | card silhouettes rotating per step |
| `oracle-symbol-bloom` | oracle | expanding ink bloom circles |

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
