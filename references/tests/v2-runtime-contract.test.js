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

test("runtime consumes stage ambience through the shared audio contract", () => {
  assert.match(runtime, /audio\?\.ambienceFiles/);
  assert.match(runtime, /stage\?\.ambience/);
  assert.match(runtime, /function switchStageAmbience/);
  assert.match(runtime, /function syncStageAmbience/);
  assert.match(runtime, /const fadeDurationMs = 2000/);
  assert.match(runtime, /Promise\.all\(\[/);
  assert.match(runtime, /fadeTo\(nextAudio, ambienceVolume/);
  assert.match(runtime, /bgm\+ambience/);
  assert.doesNotMatch(runtime, /for \(const audio of ambienceTracks\)/);
});

test("runtime exposes stage, weather, timer, and pomodoro contracts", () => {
  assert.match(runtime, /initializeStageControls/);
  assert.match(runtime, /document\.addEventListener\("click"/);
  assert.match(runtime, /renderWeather/);
  assert.match(runtime, /data-vr-stage/);
  assert.match(runtime, /data-vr-weather-level/);
  assert.match(runtime, /25 \* 60/);
  assert.match(runtime, /vibereading:pomodoro-complete/);
});

test("weather uses off, medium, and high with medium as the default", () => {
  assert.match(runtime, /function normalizeWeatherLevel/);
  assert.match(runtime, /level === "high"/);
  assert.match(runtime, /return "medium"/);
  assert.match(runtime, /lvl === "high" \? 1\.55 : 1/);
  assert.doesNotMatch(runtime, /vrWeatherLevel \|\| "low"|defaultLevel \|\| "low"/);
});

test("runtime defaults reader-facing fallback controls to Chinese", () => {
  assert.match(runtime, /\|\| "zh-CN"/);
  assert.match(runtime, /\^\(zh\|chinese\|中文\)/);
  assert.match(runtime, /"进入阅读"/);
  assert.match(runtime, /"静音"/);
});

test("page shell is neutral and keeps only runtime mount points", () => {
  assert.match(shell, /data-vr-scene/);
  assert.match(shell, /data-vr-weather/);
  assert.match(shell, /data-vr-scene-slot/);
  assert.match(shell, /data-vr-companion-root/);
  assert.match(shell, /data-vr-guide-root/);
  assert.doesNotMatch(shell, /data-vr-companion-panel/);
  assert.doesNotMatch(shell, /data-vr-panel-toggle/);
  assert.doesNotMatch(shell, /data-vr-note-textarea/);
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

test("runtime keeps separate BGM and ambience volume controls", () => {
  assert.match(runtime, /setBgmVolume/);
  assert.match(runtime, /setAmbienceVolume/);
  assert.match(runtime, /bgmVolume/);
  assert.match(runtime, /ambienceVolume/);
  assert.match(runtime, /data-vr-bgm-volume/);
  assert.match(runtime, /data-vr-ambience-volume/);
});

test("runtime includes WEATHER_ALLOWLIST and guide motion presets", () => {
  assert.match(runtime, /WEATHER_ALLOWLIST/);
  assert.match(runtime, /GUIDE_MOTION_PRESETS/);
  assert.match(runtime, /window-fog-clear/);
  assert.match(runtime, /vinyl-groove-orbit/);
  assert.match(runtime, /instrument-scan-lock/);
  assert.match(runtime, /route-path-light/);
  assert.match(runtime, /oracle-card-reveal/);
});

test("shared CSS keeps neutral roots without a fixed visual skin", () => {
  assert.match(css, /\.vr-companion-root/);
  assert.doesNotMatch(css, /data-vr-companion-panel/);
  assert.doesNotMatch(css, /min\(74vw,\s*640px\)/);
  assert.doesNotMatch(css, /#050708|rgba\s*\(\s*4\s*,\s*8\s*,\s*10/);
  assert.doesNotMatch(css, /backdrop-filter|radial-gradient|linear-gradient/);
});

test("runtime keeps optional note export support without requiring it in shell", () => {
  assert.match(runtime, /saveNote/);
  assert.match(runtime, /VibeReadingNoteShare/);
  assert.doesNotMatch(shell, /data-vr-note-save/);
});
