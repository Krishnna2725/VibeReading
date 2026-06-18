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
    label: `Stage ${index + 1}`,
    sourceRange: `Chapter group ${index + 1}`,
    chapters: [`Chapter ${index + 1}`],
    weather: "drizzle"
  }));
  const spec = {
    template: { primary: "route" },
    entryGuide: {
      soundRequiredAfterStart: true,
      steps: [{ text: "Begin slowly." }]
    },
    audio: { ambienceFiles: ["./assets/audio/fallback.mp3"] },
    stages,
    firstScreen: { aspectRatio: "16:9" }
  };
  fs.writeFileSync(path.join(dir, "app.js"), `window.VIBE_READING_SPEC = ${JSON.stringify(spec)};\n/* Template stage controls */\nvar sc=document.querySelector(".vr-scene");\n${stages.map((_, i) => `var b${i}=document.createElement("button");b${i}.setAttribute("data-vr-stage","${i}");b${i}.textContent="Stage ${i+1}";sc.appendChild(b${i});`).join("\n")}`);
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

test("code validation accepts standard scaffold with 3 to 6 stages", (t) => {
  const dirs = [makeFixture(3), makeFixture(6)];
  t.after(() => dirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));
  for (const dir of dirs) {
    const result = evaluate(dir);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
});

test("code validation rejects out-of-range stages or duplicate inline runtime", (t) => {
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

test("code validation rejects the old symbols template name", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const specPath = path.join(dir, "space-spec.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  spec.template.primary = "symbols";
  fs.writeFileSync(specPath, JSON.stringify(spec));
  fs.writeFileSync(path.join(dir, "app.js"), `window.VIBE_READING_SPEC = ${JSON.stringify(spec)};\n/* stage controls */\n[0,1,2].forEach(function(i){var b=document.createElement("button");b.setAttribute("data-vr-stage",i);b.textContent="Stage "+(i+1);document.querySelector(".vr-scene").appendChild(b);});`);

  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /symbols.*oracle/);
});

test("code validation accepts reused BGM status with source field", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "bgm-meta.json"), JSON.stringify({
    status: "reused",
    reused_from: "output/2026-01-01-PriorBook-purpose"
  }));
  fs.writeFileSync(path.join(dir, "prompts/bgm.txt"), "[PLACEHOLDER — replace with book-specific prompt]\nStrictly instrumental, no vocals.");

  const result = evaluate(dir);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("code validation rejects reused BGM status without source field", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "bgm-meta.json"), JSON.stringify({
    status: "reused"
  }));

  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /reused_from|sourceOutput/);
});

test("code validation fails when data-vr-stage exists only in copied runtime", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  // Remove data-vr-stage from authored files (index.html and app.js)
  // but it still exists in runtime/v2-runtime.js (copied by scaffold)
  const htmlFile = path.join(dir, "index.html");
  let html = fs.readFileSync(htmlFile, "utf8");
  // The page-shell.html doesn't contain data-vr-stage directly,
  // but app.js may be the source. Clear any stage references in app.js.
  const appFile = path.join(dir, "app.js");
  let app = fs.readFileSync(appFile, "utf8");
  app = app.replace(/data-vr-stage/gi, "");
  fs.writeFileSync(appFile, app);
  // Ensure html has no data-vr-stage either
  html = html.replace(/data-vr-stage/gi, "");
  fs.writeFileSync(htmlFile, html);

  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /stage controls.*authored output/);
});

test("code validation does not false-positive on Three.js or Three-Body book titles", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const specPath = path.join(dir, "space-spec.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  spec.template.primary = "instrument";
  spec.book = { title: "Three-Body Problem", author: "Liu Cixin" };
  fs.writeFileSync(specPath, JSON.stringify(spec));
  fs.writeFileSync(path.join(dir, "app.js"), `window.VIBE_READING_SPEC = ${JSON.stringify(spec)};\n/* stage controls */\n[0,1,2].forEach(function(i){var b=document.createElement("button");b.setAttribute("data-vr-stage",i);b.textContent="Stage "+(i+1);document.querySelector(".vr-scene").appendChild(b);});`);

  const result = evaluate(dir);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("code validation fails when data-vr-stage exists only in CSS selector", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  // Remove data-vr-stage from app.js (keep only the spec, no stage controls)
  const spec = JSON.parse(fs.readFileSync(path.join(dir, "space-spec.json"), "utf8"));
  fs.writeFileSync(path.join(dir, "app.js"), `window.VIBE_READING_SPEC = ${JSON.stringify(spec)};`);
  // Remove data-vr-stage from index.html
  const htmlFile = path.join(dir, "index.html");
  let html = fs.readFileSync(htmlFile, "utf8");
  html = html.replace(/data-vr-stage/gi, "");
  fs.writeFileSync(htmlFile, html);
  // Add data-vr-stage only as a CSS selector in style.css
  const cssFile = path.join(dir, "style.css");
  let css = fs.readFileSync(cssFile, "utf8");
  css += "\n[data-vr-stage] { opacity: 0.8; }\n";
  fs.writeFileSync(cssFile, css);

  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /stage controls.*authored output/);
});
