const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const runtime = fs.readFileSync(path.join(__dirname, "../../runtime/v2-runtime.js"), "utf8");
const shell = fs.readFileSync(path.join(__dirname, "../../runtime/page-shell.html"), "utf8");

test("runtime returns to the guide home on every refresh", () => {
  assert.match(runtime, /root\.dataset\.vrMode = "home"/);
  assert.doesNotMatch(runtime, /localStorage|sessionStorage/);
});

test("runtime prioritizes sound and keeps guide sound-enabled", () => {
  assert.match(runtime, /const candidates = \[/);
  assert.match(runtime, /Promise\.all\(attempts\)/);
  assert.match(runtime, /source: "bgm"/);
  assert.match(runtime, /source: "ambience"/);
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
  assert.doesNotMatch(shell, /data-vr-companion-toggle/);
  assert.doesNotMatch(shell, /data-vr-companion-close/);
  assert.doesNotMatch(shell, /vr-companion/);
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
