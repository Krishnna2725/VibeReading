const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const assert = require("node:assert/strict");

const skillRoot = path.join(__dirname, "../..");
const evaluator = path.join(__dirname, "evaluate-vibereading-output.mjs");
const scaffold = path.join(skillRoot, "scripts/scaffold-output.py");

function makeFixture(stageCount) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vibereading-evaluator-"));
  const scaffoldResult = spawnSync("python", [scaffold, "--output-dir", dir], { encoding: "utf8" });
  assert.equal(scaffoldResult.status, 0, scaffoldResult.stdout + scaffoldResult.stderr);
  const stages = Array.from({ length: stageCount }, (_, index) => ({
    id: `stage-${index + 1}`,
    label: `阶段 ${index + 1}`,
    sourceRange: `第 ${index + 1} 组章节`,
    chapters: [`章节 ${index + 1}`],
    weather: "细雨"
  }));
  const spec = {
    template: { primary: "route" },
    entryGuide: { soundRequiredAfterStart: true, steps: [{ text: "慢慢开始。" }] },
    audio: { ambienceFiles: ["./assets/audio/fallback.mp3"] },
    stages,
    firstScreen: { aspectRatio: "16:9" }
  };
  fs.writeFileSync(path.join(dir, "app.js"), `window.VIBE_READING_SPEC = ${JSON.stringify(spec)};`);
  fs.writeFileSync(path.join(dir, "space-spec.json"), JSON.stringify(spec));
  fs.writeFileSync(path.join(dir, "bgm-meta.json"), JSON.stringify({ status: "failed", reason: "test" }));
  fs.writeFileSync(path.join(dir, "concept-image.png"), "");
  fs.writeFileSync(path.join(dir, "assets/audio/fallback.mp3"), "");
  fs.writeFileSync(path.join(dir, "prompts/image.txt"), "No text anywhere in the image. No letters, words, numbers, captions, signs, labels, logos, watermarks, book-cover typography, interface, panels, buttons or UI.");
  fs.writeFileSync(path.join(dir, "prompts/bgm.txt"), "Quiet reading music. Strictly instrumental, no vocals, no singing, no spoken words, no lyrics.");
  return dir;
}

function evaluate(dir) {
  return spawnSync(process.execPath, [evaluator, dir], { encoding: "utf8" });
}

test("纯代码校验接受标准骨架和 3–6 个阶段", (t) => {
  const dirs = [makeFixture(3), makeFixture(6)];
  t.after(() => dirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));
  for (const dir of dirs) {
    const result = evaluate(dir);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
});

test("纯代码校验拒绝超出阶段范围或重复内联运行时", (t) => {
  const outOfRange = makeFixture(2);
  const inlineRuntime = makeFixture(3);
  fs.appendFileSync(path.join(inlineRuntime, "index.html"), "<script>console.log('duplicate')</script>");
  t.after(() => [outOfRange, inlineRuntime].forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));

  const rangeResult = evaluate(outOfRange);
  assert.equal(rangeResult.status, 1);
  assert.match(rangeResult.stdout, /stages must contain 3-6 items/);

  const inlineResult = evaluate(inlineRuntime);
  assert.equal(inlineResult.status, 1);
  assert.match(inlineResult.stdout, /must not inline JavaScript/);
});
