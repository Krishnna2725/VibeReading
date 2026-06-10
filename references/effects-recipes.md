# Atmospheric Effects Recipes

Read this file for every generation.
Every page must implement at least one persistent, visible, low-distraction weather effect selected for the book and template.
Do not default every page to rain or snow: fog, wind, dust, ash, pollen, dew, heat haze, and storm light are also valid weather.
Leaves, insects, scanlines, signal motes, and decorative particles do not satisfy the weather requirement by themselves.

## Core Rule

Natural and atmospheric effects should be living elements, not wallpaper.
Prefer small generated element sets with varied position, delay, duration, opacity, size, blur, and drift.
Avoid single full-screen `repeating-linear-gradient` layers that create barcode, fence, or screen-door artifacts.

The selected weather must remain recognizable across states, respond to scene or atmosphere changes, and become quieter in Companion mode.
Color shifts, audio-only ambience, scanlines, signal noise, generic glow, and random particles do not count as weather.

If a stage, tone, sound, button, or label explicitly names a concrete image such as rain, snow, dust, falling leaves, fireflies, butterflies, ash, or signal motes, the rendered page must include a lightweight visible layer for that image.
Do not use "rain", "snow", or similar concrete words when the page only changes color, audio, or mood.

Use this family pattern for:

```text
rain, snow, ash, dust, pollen, leaves, paper scraps, fireflies, butterflies, sparks, signal motes
```

## Particle Layer Pattern

```html
<div class="particle-layer" aria-hidden="true"></div>
```

```css
.particle-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: var(--particle-opacity, .75);
}

.particle {
  position: absolute;
  left: var(--x);
  top: var(--start-y, -12vh);
  width: var(--w, 2px);
  height: var(--h, 2px);
  opacity: var(--o);
  transform: translate3d(0, 0, 0);
  animation: particleFall var(--d) linear infinite;
  animation-delay: var(--delay);
}

@keyframes particleFall {
  to {
    transform: translate3d(var(--dx, 0), var(--dy, 120vh), 0) rotate(var(--r, 0deg));
  }
}
```

```js
function mountParticles(layer, items, className = "particle") {
  layer.replaceChildren(...items.map(item => {
    const el = document.createElement("span");
    el.className = className;
    Object.entries(item).forEach(([key, value]) => {
      el.style.setProperty(`--${key}`, value);
    });
    return el;
  }));
}
```

## Rain

Rain should be individual falling streaks. Keep screen scanlines separate.

```css
.rain-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: var(--rain-opacity, .75);
  mix-blend-mode: screen;
}

.rain-drop {
  position: absolute;
  top: -14vh;
  left: var(--x);
  width: 1px;
  height: 8rem;
  border-radius: 999px;
  background: linear-gradient(to bottom, transparent, rgba(203, 213, 225, .9), transparent);
  opacity: var(--o);
  transform: translateY(-14vh);
  animation: rainDrop var(--d) linear infinite;
  animation-delay: var(--delay);
}

@keyframes rainDrop {
  to { transform: translateY(120vh); }
}
```

```js
const rainDrops = Array.from({ length: 88 }, (_, i) => ({
  x: `${(i * 37) % 100}%`,
  delay: `${-(i % 16) * 0.16}s`,
  d: `${0.8 + (i % 9) * 0.08}s`,
  o: `${0.13 + (i % 5) * 0.045}`
}));

mountParticles(document.querySelector(".rain-layer"), rainDrops, "rain-drop");
```

## Snow / Ash / Dust

Snow, ash, dust, and pollen need slower fall, wider drift, more size variation, and softer opacity.

```js
const softFall = Array.from({ length: 42 }, (_, i) => ({
  x: `${(i * 53) % 100}%`,
  "start-y": `${-8 - (i % 5) * 4}vh`,
  w: `${1 + (i % 4)}px`,
  h: `${1 + (i % 4)}px`,
  dx: `${((i % 7) - 3) * 6}vw`,
  dy: "118vh",
  r: `${(i % 2 ? 1 : -1) * (60 + i * 7)}deg`,
  delay: `${-(i % 18) * 0.4}s`,
  d: `${9 + (i % 8) * 1.4}s`,
  o: `${0.12 + (i % 5) * 0.045}`
}));
```

Represent snow with pale dots, ash with gray flakes, dust with tiny warm motes, and pollen with soft yellow specks.
Use fewer particles in companion mode.

## Fog / Wind / Dew / Heat Haze

These effects are useful when falling particles would not fit the book.

- **Fog**: use 2-5 oversized blurred layers with different drift directions and very low opacity. Fog must reveal depth by passing behind foreground objects and in front of distant layers.
- **Wind**: make existing environmental traces respond together, such as paper corners, curtain edges, dust direction, grass shadows, or hanging labels. A generic moving gradient alone is not wind.
- **Dew / condensation**: use sparse translucent droplets or a mask on glass and cold surfaces. Let light catch the droplets; keep them away from readable text.
- **Heat haze**: use a localized, slow distortion or blurred shimmer above a plausible surface. Never distort readable UI.
- **Storm light**: use rare, restrained illumination changes paired with visible cloud, rain, or shadow pressure. A flashing screen alone is not weather.

## Leaves / Paper Scraps

Leaves and paper scraps should tumble, not fall like rain.
Use 8-24 elements, larger width/height, wider horizontal drift, slower duration, and rotation.
Do not cover text.

## Fireflies

Fireflies should be sparse points with glow and intermittent opacity, not falling particles.
Use 6-18 elements with slow drifting and a separate pulsing animation.

```css
.firefly {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 235, 150, .9);
  box-shadow: 0 0 14px rgba(255, 220, 120, .7);
  animation: fireflyDrift var(--d) ease-in-out infinite alternate, fireflyPulse 2.8s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes fireflyDrift {
  to { transform: translate3d(var(--dx), var(--dy), 0); }
}

@keyframes fireflyPulse {
  50% { opacity: .25; filter: blur(1px); }
}
```

## Butterflies / Moths

Butterflies and moths should be rare, slow, and symbolic.
Use 3-9 elements near light, flowers, margins, or thresholds.
Small CSS/SVG silhouettes are acceptable, but avoid cute cartoon insects.

## Scanlines And Signal

Scanlines are not weather.
Keep them horizontal, very low opacity, and visually independent from rain, snow, or particles.
Use signal effects only when the book's world includes media, surveillance, networks, machines, archives, or damaged recordings.

## Self-Check

Before finishing, ask:

```text
Does this effect belong to the book and selected template?
Is it built from varied elements instead of one regular full-screen stripe?
Does it avoid covering readable content?
Can the effect density change with scene, tone, or focus mode?
Does it remain subtle enough for long reading?
```
