const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const runtime = fs.readFileSync(path.join(__dirname, "../../runtime/v2-runtime.js"), "utf8");
const shell = fs.readFileSync(path.join(__dirname, "../../runtime/page-shell.html"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../../runtime/v2-runtime.css"), "utf8");

test("runtime returns to the guide home on every refresh", () => {
  assert.match(runtime, /root\.dataset\.vrMode = "home"/);
  assert.doesNotMatch(runtime, /localStorage|sessionStorage/);
});

test("runtime prioritizes sound with sequential BGM-first fallback", () => {
  // Sequential fallback: try BGM first, then ambience
  assert.match(runtime, /await bgmAudio\.play\(\)/);
  assert.match(runtime, /await audio\.play\(\)/);
  assert.match(runtime, /activeAudioSource = "bgm"/);
  assert.match(runtime, /activeAudioSource = "ambience"/);
  assert.match(runtime, /await beginSound\(\);\s+runGuide\(\)/);
  assert.match(shell, /data-vr-guide-next/);
  assert.match(runtime, /advanceGuide/);
  assert.doesNotMatch(runtime, /window\.setTimeout\(enterReading,\s*total/);
});

test("runtime exposes stage, weather, timer, and pomodoro contracts", () => {
  assert.match(runtime, /initializeStageControls/);
  assert.match(runtime, /document\.addEventListener\("click"/);
  assert.match(runtime, /renderWeather/);
  assert.match(runtime, /data-vr-stage/);
  assert.match(runtime, /data-vr-current-hint/);
  assert.match(runtime, /data-vr-weather-level/);
  assert.match(runtime, /stageWeatherLevels/);
  assert.match(runtime, /25 \* 60/);
  assert.match(runtime, /vibereading:pomodoro-complete/);
});

test("runtime includes guide art and does not output a generic companion card", () => {
  assert.match(runtime, /createGuideArt/);
  assert.match(shell, /data-vr-guide-art/);
  assert.match(shell, /data-vr-guide-focus/);
  assert.match(runtime, /renderGuideText/);
  assert.match(runtime, /vrGuideSpotlight/);
  // Old generic companion card patterns must not exist
  assert.doesNotMatch(shell, /data-vr-companion-toggle/);
  assert.doesNotMatch(shell, /data-vr-companion-close/);
  // The old "阅读陪伴" label and old card class must not exist
  assert.doesNotMatch(shell, /阅读陪伴/);
});

test("runtime prefers p5 weather and provides Canvas fallback", () => {
  assert.match(runtime, /new window\.p5/);
  assert.match(runtime, /vrWeatherEngine = "p5"/);
  assert.match(runtime, /vrWeatherEngine = "canvas"/);
  assert.match(runtime, /createCanvasWeather/);
  assert.match(runtime, /p\.frameRate\(30\)/);
  assert.match(runtime, /vr-weather-canvas/);
  assert.match(runtime, /prefers-reduced-motion: reduce/);
});

test("runtime supports all 15 weather kinds including leaves and fireflies", () => {
  const kinds = ["rain", "storm-rain", "fog", "snow", "wind", "ripple", "water", "dust", "embers", "fire", "signal", "paper", "stars", "leaves", "fireflies"];
  for (const kind of kinds) {
    assert.match(runtime, new RegExp(`"${kind}"`), `runtime must include preset "${kind}"`);
  }
});

test("runtime has separate BGM and ambience volume controls", () => {
  assert.match(runtime, /setBgmVolume/);
  assert.match(runtime, /setAmbienceVolume/);
  assert.match(runtime, /bgmVolume/);
  assert.match(runtime, /ambienceVolume/);
  assert.match(runtime, /data-vr-bgm-volume/);
  assert.match(runtime, /data-vr-ambience-volume/);
});

test("runtime includes WEATHER_ALLOWLIST", () => {
  assert.match(runtime, /WEATHER_ALLOWLIST/);
  assert.match(runtime, /normalizeWeatherKind/);
});

test("page-shell includes Window companion panel structure", () => {
  assert.match(shell, /data-vr-companion-panel/);
  assert.match(shell, /data-vr-panel-expanded/);
  assert.match(shell, /data-vr-panel-toggle/);
  assert.match(shell, /vr-stage-selector/);
  assert.match(shell, /vr-stage-info/);
  assert.match(shell, /vr-controls-row/);
  assert.match(shell, /vr-note-area/);
  assert.match(shell, /data-vr-note-textarea/);
  assert.match(shell, /data-vr-note-save/);
  assert.match(shell, /data-vr-bgm-volume/);
  assert.match(shell, /data-vr-ambience-volume/);
  assert.match(shell, /data-vr-weather-level="off"/);
  assert.match(shell, /data-vr-weather-level="low"/);
  assert.match(shell, /data-vr-weather-level="medium"/);
});

test("CSS includes fixed light scrim", () => {
  assert.match(css, /rgba\s*\(\s*4\s*,\s*8\s*,\s*10/);
  assert.match(css, /\.vr-scene::after/);
});

test("CSS includes Window companion panel styles", () => {
  assert.match(css, /data-vr-companion-panel/);
  assert.match(css, /min\(74vw,\s*640px\)/);
  assert.match(css, /backdrop-filter/);
});

test("runtime includes guide motion presets", () => {
  assert.match(runtime, /GUIDE_MOTION_PRESETS/);
  assert.match(runtime, /window-fog-clear/);
  assert.match(runtime, /vinyl-groove-orbit/);
  assert.match(runtime, /instrument-scan-lock/);
  assert.match(runtime, /route-path-light/);
  assert.match(runtime, /oracle-card-reveal/);
});

test("runtime includes note export support", () => {
  assert.match(runtime, /saveNote/);
  assert.match(runtime, /VibeReadingNoteShare/);
});

test("runtime includes showToast helper", () => {
  assert.match(runtime, /showToast/);
  assert.match(runtime, /vr-toast/);
});

test("runtime includes renderEffect unified entry point", () => {
  assert.match(runtime, /function renderEffect/);
  assert.match(runtime, /layer.*kind.*level/);
});

test("runtime tracks pointer position for mouse illumination", () => {
  assert.match(runtime, /pointerX/);
  assert.match(runtime, /pointerY/);
  assert.match(runtime, /mousemove/);
});

test("runtime effects use noise-based movement", () => {
  // Check that key effects use p.noise() for continuous movement
  assert.match(runtime, /p\.noise\(/);
});

test("runtime guide art has no crosshair or center circle", () => {
  const guideArtSection = runtime.slice(runtime.indexOf("createGuideArt"), runtime.indexOf("showGuideStep"));
  assert.doesNotMatch(guideArtSection, /p\.rect\(tx - 150/);
  assert.doesNotMatch(guideArtSection, /p\.line\(tx, ty - 95/);
  assert.doesNotMatch(guideArtSection, /p\.circle\(tx, ty, 120/);
});

test("renderWeather routes through renderEffect", () => {
  // renderWeather should call renderEffect, not directly createP5Weather
  const renderWeatherFn = runtime.slice(runtime.indexOf("function renderWeather"), runtime.indexOf("function destroyWeatherEngine"));
  assert.match(renderWeatherFn, /renderEffect\(/);
});

test("P5 weather engine includes global mouse illumination glow", () => {
  const p5Section = runtime.slice(runtime.indexOf("function createP5Weather"), runtime.indexOf("function renderWeather"));
  assert.match(p5Section, /pointerX/);
  assert.match(p5Section, /pointerY/);
  assert.match(p5Section, /createRadialGradient\(mx, my/);
  assert.match(p5Section, /globalCompositeOperation = "screen"/);
});

test("guide home keeps its primary action inside the desktop viewport", () => {
  assert.match(css, /\[data-vr-mode="home"\] \[data-vr-guide-text\]/);
  assert.match(css, /display:\s*none/);
});

test("fireflies have flocking neighbor search", () => {
  const firefliesIdx = runtime.indexOf("fireflies:");
  const afterFireflies = runtime.slice(firefliesIdx, firefliesIdx + 2500);
  assert.match(afterFireflies, /nearestDist/);
  assert.match(afterFireflies, /nearest/);
  assert.match(afterFireflies, /particle\.vx \+=/);
});

test("leaves have depth field for parallax", () => {
  const leavesSection = runtime.slice(runtime.indexOf("leaves:"), runtime.indexOf("fireflies:"));
  assert.match(leavesSection, /depth/);
  assert.match(leavesSection, /particle\.depth/);
});

test("window guide uses noise-based organic curves, not straight lines", () => {
  const guideSection = runtime.slice(runtime.indexOf("createGuideArt"), runtime.indexOf("showGuideStep"));
  // Should use p.noise for organic fog clearing
  assert.match(guideSection, /p\.noise\(/);
  // Should NOT have the old straight-line pattern
  assert.doesNotMatch(guideSection, /p\.line\(x \+ offset, 0, x - offset/);
});
