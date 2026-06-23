const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const runtime = fs.readFileSync(path.join(__dirname, "../../runtime/v2-runtime.js"), "utf8");

test("runtime includes unified Pointer Tracker", () => {
  assert.match(runtime, /function createPointerTracker/);
  assert.match(runtime, /idleTime: 999/);
  assert.match(runtime, /active: false/);
  assert.match(runtime, /function update\(dt\)/);
  assert.match(runtime, /function destroy\(\)/);
});

test("pointer tracker binds only once (dedup guard)", () => {
  assert.match(runtime, /let bound = false/);
  assert.match(runtime, /if \(bound\) return/);
});

test("pointer tracker is exposed via test hooks", () => {
  assert.match(runtime, /createPointerTracker/);
});

test("initial pointer is inactive (idleTime starts at 999)", () => {
  assert.match(runtime, /idleTime: 999/);
});

test("off level does not draw mouse glow (idleFade <= 0 when idle)", () => {
  assert.match(runtime, /function drawMouseGlow/);
  assert.match(runtime, /idleFade.*Math\.max\(0, 1 - s\.idleTime/);
});

test("old low still maps to medium via normalizeWeatherLevel", () => {
  assert.match(runtime, /function normalizeWeatherLevel/);
  assert.match(runtime, /return "medium"/);
  assert.doesNotMatch(runtime, /vrWeatherLevel \|\| "low"|defaultLevel \|\| "low"/);
});

test("Gradient Sprite Cache has MAX limit and destroy method", () => {
  assert.match(runtime, /function createGradientSpriteCache/);
  assert.match(runtime, /const MAX = 64/);
  assert.match(runtime, /function destroy\(\)/);
  assert.match(runtime, /cache\.clear\(\)/);
});

test("gradient stops use valid rgba format", () => {
  assert.match(runtime, /addColorStop\(0, "rgba\(/);
  assert.match(runtime, /addColorStop\(Math\.min\(0\.999/);
  assert.match(runtime, /addColorStop\(1, "rgba\(/);
});

test("gradient cache key includes blur and quantized alpha", () => {
  assert.match(runtime, /Math\.round\(\(o\.alpha \|\| 1\) \* 10\) \/ 10/);
  assert.match(runtime, /o\.blur \|\| 0/);
});

test("fireflies uses p._particles instead of outer scope particles variable", () => {
  assert.match(runtime, /const allParticles = p\._particles/);
  assert.doesNotMatch(runtime, /if \(particles\.length > 1\)/);
});

test("fireflies uses force-based pointer interaction (applyPointerField)", () => {
  assert.match(runtime, /applyPointerField\(particle, p\._pointer/);
  assert.doesNotMatch(runtime, /particle\.x \+= \(dx \/ dist\) \* 0\.8/);
});

test("Frame Clock clamps dt to 0..0.05s", () => {
  assert.match(runtime, /function createFrameClock/);
  assert.match(runtime, /Math\.min\(0\.05, Math\.max\(0, raw\)\)/);
});

test("Particle Pool has spawn, deactivate, forEach, count, clear", () => {
  assert.match(runtime, /function createParticlePool/);
  assert.match(runtime, /spawn\(init\)/);
  assert.match(runtime, /deactivate\(p\)/);
  assert.match(runtime, /forEach\(fn\)/);
  assert.match(runtime, /count\(\)/);
  assert.match(runtime, /clear\(\)/);
});

test("Intensity Profiles exist for all 15 weather kinds", () => {
  assert.match(runtime, /const INTENSITY_PROFILES/);
  const kinds = ["rain", "storm-rain", "fog", "snow", "wind", "ripple", "water", "dust", "embers", "fire", "signal", "paper", "stars", "leaves", "fireflies"];
  for (const kind of kinds) {
    // Keys may be quoted or unquoted; storm-rain must be quoted
    const escaped = kind.replace("-", "\\-");
    const re = new RegExp(`["']?${escaped}["']?:\\s*\\{`);
    assert.match(runtime, re, `INTENSITY_PROFILES must include "${kind}"`);
  }
});

test("each intensity profile has off, medium, and high levels", () => {
  assert.match(runtime, /off: \{/g);
  assert.match(runtime, /medium: \{/g);
  assert.match(runtime, /high: \{/g);
});

test("getIntensityProfile is exposed via test hooks", () => {
  assert.match(runtime, /getIntensityProfile/);
});

test("p5 engine uses frame clock for dt", () => {
  assert.match(runtime, /const clock = createFrameClock\(\)/);
  assert.match(runtime, /clock\.update\(performance\.now\(\)\)/);
  assert.match(runtime, /const dt = clock\.dt/);
});

test("p5 engine creates and manages gradient cache", () => {
  assert.match(runtime, /localCache = createGradientSpriteCache\(p\)/);
  assert.match(runtime, /p\._cache = localCache/);
});

test("guide clock and cache share createGuideArt lifecycle scope", () => {
  const createGuide = runtime.indexOf("function createGuideArt()");
  const sketch = runtime.indexOf("const sketch = (p) =>", createGuide);
  const clock = runtime.indexOf("const guideClock = createFrameClock()", createGuide);
  const cache = runtime.indexOf("let guideCache = null", createGuide);

  assert.ok(createGuide >= 0 && sketch > createGuide);
  assert.ok(clock > createGuide && clock < sketch);
  assert.ok(cache > createGuide && cache < sketch);
});

test("p5 engine attaches pointer to p instance for effects", () => {
  assert.match(runtime, /p\._pointer = pointer/);
});

test("p5 engine attaches particles array for effects", () => {
  assert.match(runtime, /p\._particles = particles/);
});

test("p5 engine uses Intensity Profile for spawn scaling", () => {
  assert.match(runtime, /getIntensityProfile\(kind, lvl\)/);
  assert.match(runtime, /profile\.spawnScale/);
});

test("mouse glow uses gradient sprite (drawMouseGlow call)", () => {
  assert.match(runtime, /drawMouseGlow\(p, pointer, localCache\)/);
  assert.doesNotMatch(runtime, /for \(let i = 3; i > 0; i--\)/);
});

test("snow uses gradient sprite cache", () => {
  assert.match(runtime, /cache\.radial\(\{[\s\S]*radius: 18/);
});

test("fire uses ellipse-shaped gradient sprite", () => {
  assert.match(runtime, /shape: "e"/);
});

test("stars uses screen blend for flare sprite", () => {
  assert.match(runtime, /cache\.draw\(flareSprite[\s\S]*"screen"/);
});

test("embers uses screen blend for halo sprite", () => {
  assert.match(runtime, /cache\.draw\(haloSprite[\s\S]*"screen"/);
});

test("runtime exposes infrastructure through test hooks", () => {
  assert.match(runtime, /createFrameClock/);
  assert.match(runtime, /createPointerTracker/);
  assert.match(runtime, /createGradientSpriteCache/);
  assert.match(runtime, /createParticlePool/);
  assert.match(runtime, /smoothFalloff/);
});
