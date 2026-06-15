const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const runtime = fs.readFileSync(path.join(__dirname, "../../runtime/v2-runtime.js"), "utf8");

test("运行时不会跳过每次刷新后的首页入静", () => {
  assert.match(runtime, /root\.dataset\.vrMode = "home"/);
  assert.doesNotMatch(runtime, /localStorage|sessionStorage/);
});

test("运行时具备声音优先级与入静声音保证", () => {
  assert.match(runtime, /await tryPlay\(bgm/);
  assert.match(runtime, /for \(const audio of ambience\)/);
  assert.match(runtime, /await beginSound\(\);\s+runGuide\(\)/);
});

test("运行时具备四阶段接口、天气、计时与番茄钟", () => {
  assert.match(runtime, /data-vr-stage/);
  assert.match(runtime, /data-vr-weather-level/);
  assert.match(runtime, /25 \* 60/);
  assert.match(runtime, /vibereading:pomodoro-complete/);
});
