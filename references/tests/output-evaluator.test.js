const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const assert = require("node:assert/strict");

const evaluator = path.join(__dirname, "evaluate-vibereading-output.mjs");

function makeFixture(stageCount) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vibereading-evaluator-"));
  const stages = Array.from({ length: stageCount }, (_, index) => ({
    id: `stage-${index + 1}`,
    sourceRange: `第 ${index + 1} 组章节`,
    chapters: [`章节 ${index + 1}`]
  }));

  fs.writeFileSync(path.join(dir, "index.html"), `<!doctype html>
<link rel="stylesheet" href="./style.css">
<button data-vr-guide-start>开始</button>
<button data-vr-sound-toggle>声音</button>
<button data-vr-stage="0">阶段</button>
<button data-vr-timer-toggle>计时</button>
<span>pomodoro</span>
<script src="./app.js"></script>`);
  fs.writeFileSync(path.join(dir, "style.css"), ".scene { aspect-ratio: 16 / 9; }");
  fs.writeFileSync(path.join(dir, "app.js"), "const audio = new Audio(); function startSound() { return audio.play(); }");
  fs.writeFileSync(path.join(dir, "space-spec.json"), JSON.stringify({
    entryGuide: { soundRequiredAfterStart: true, steps: [{ text: "慢慢开始。" }] },
    stages,
    firstScreen: { aspectRatio: "16:9" }
  }));
  fs.writeFileSync(path.join(dir, "bgm-meta.json"), "{}");
  fs.writeFileSync(path.join(dir, "concept-image.png"), "");
  return dir;
}

function evaluate(dir) {
  return spawnSync(process.execPath, [evaluator, dir], { encoding: "utf8" });
}

test("纯代码校验接受具备核心功能的 3–6 阶段页面", (t) => {
  const dirs = [makeFixture(3), makeFixture(6)];
  t.after(() => dirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));
  for (const dir of dirs) {
    const result = evaluate(dir);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
});

test("纯代码校验拒绝超出 3–6 范围的页面", (t) => {
  const dirs = [makeFixture(2), makeFixture(7)];
  t.after(() => dirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));
  for (const dir of dirs) {
    const result = evaluate(dir);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /stages must contain 3-6 items/);
  }
});
