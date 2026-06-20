const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("zlib");

const skillRoot = path.join(__dirname, "../..");
const evaluator = path.join(__dirname, "evaluate-vibereading-output.mjs");
const scaffold = path.join(skillRoot, "scripts/scaffold-output.py");

// Create a minimal valid 1x1 PNG
function makeMinimalPNG() {
  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const tbd = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(tbd));
    return Buffer.concat([len, tbd, crc]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const compressed = zlib.deflateSync(Buffer.from([0, 100, 140, 180]));
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

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
      steps: [{ text: "Begin slowly." }, { text: "Tune in." }, { text: "Start." }],
      motion: "route-path-light"
    },
    audio: { ambienceFiles: ["./assets/audio/fallback.mp3"] },
    stages,
    assets: { images: [{ role: "base", path: "./concept-image.png" }] }
  };
  fs.writeFileSync(path.join(dir, "app.js"), `window.VIBE_READING_SPEC = ${JSON.stringify(spec)};\n[0,1,2].forEach(function(i){var b=document.createElement("button");b.setAttribute("data-vr-stage",i);b.textContent="Stage "+(i+1);document.querySelector(".vr-scene").appendChild(b);});`);
  fs.writeFileSync(path.join(dir, "space-spec.json"), JSON.stringify(spec));
  fs.writeFileSync(path.join(dir, "bgm-meta.json"), JSON.stringify({ status: "failed" }));
  fs.writeFileSync(path.join(dir, "concept-image.png"), makeMinimalPNG());
  fs.writeFileSync(path.join(dir, "assets/audio/fallback.mp3"), Buffer.alloc(44));
  return dir;
}

function evaluate(dir) {
  return spawnSync(process.execPath, [evaluator, dir], { encoding: "utf8" });
}

test("evaluator accepts scaffold with 3 to 6 stages", (t) => {
  const dirs = [makeFixture(3), makeFixture(6)];
  t.after(() => dirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));
  for (const dir of dirs) {
    const result = evaluate(dir);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
});

test("evaluator rejects out-of-range stages", (t) => {
  const dir = makeFixture(2);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /stages must contain 3-6 items/);
});

test("evaluator rejects inline JavaScript", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.appendFileSync(path.join(dir, "index.html"), "<script>console.log('inline')</script>");
  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /must not inline JavaScript/);
});

test("evaluator rejects old symbols template", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const specPath = path.join(dir, "space-spec.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  spec.template.primary = "symbols";
  fs.writeFileSync(specPath, JSON.stringify(spec));
  fs.writeFileSync(path.join(dir, "app.js"), `window.VIBE_READING_SPEC = ${JSON.stringify(spec)};\n[0,1,2].forEach(function(i){var b=document.createElement("button");b.setAttribute("data-vr-stage",i);b.textContent="Stage "+(i+1);document.querySelector(".vr-scene").appendChild(b);});`);
  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /symbols.*oracle/);
});

test("evaluator accepts reused BGM with source", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "bgm-meta.json"), JSON.stringify({ status: "reused", reused_from: "output/2026-01-01-Prior" }));
  const result = evaluate(dir);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("evaluator rejects reused BGM without source", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "bgm-meta.json"), JSON.stringify({ status: "reused" }));
  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /reused_from|sourceOutput/);
});

test("evaluator rejects weather.kind not in allowlist", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const spec = JSON.parse(fs.readFileSync(path.join(dir, "space-spec.json"), "utf8"));
  spec.weather = { kind: "invalid-weather", defaultLevel: "low" };
  fs.writeFileSync(path.join(dir, "space-spec.json"), JSON.stringify(spec));
  fs.writeFileSync(path.join(dir, "app.js"), `window.VIBE_READING_SPEC = ${JSON.stringify(spec)};\n[0,1,2].forEach(function(i){var b=document.createElement("button");b.setAttribute("data-vr-stage",i);b.textContent="Stage "+(i+1);document.querySelector(".vr-scene").appendChild(b);});`);
  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /not in the runtime allowlist/);
});

test("evaluator checks note area and volume controls via DOM attributes", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  let html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  html = html.replace(/data-vr-note-textarea/g, "");
  html = html.replace(/data-vr-note-save/g, "");
  html = html.replace(/data-vr-bgm-volume/g, "");
  html = html.replace(/data-vr-ambience-volume/g, "");
  fs.writeFileSync(path.join(dir, "index.html"), html);
  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /note area/);
  assert.match(result.stdout, /BGM volume/);
  assert.match(result.stdout, /ambience volume/);
});

test("evaluator validates minimal-no-image fixture (Instrument)", () => {
  const fixture = path.join(__dirname, "fixtures/minimal-no-image");
  const result = evaluate(fixture);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("evaluator validates window-multi-image fixture", () => {
  const fixture = path.join(__dirname, "fixtures/window-multi-image");
  const result = evaluate(fixture);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("evaluator rejects Three.js in template name", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const spec = JSON.parse(fs.readFileSync(path.join(dir, "space-spec.json"), "utf8"));
  spec.template.primary = "instrument";
  spec.book = { title: "Three-Body Problem" };
  fs.writeFileSync(path.join(dir, "space-spec.json"), JSON.stringify(spec));
  fs.writeFileSync(path.join(dir, "app.js"), `window.VIBE_READING_SPEC = ${JSON.stringify(spec)};\n[0,1,2].forEach(function(i){var b=document.createElement("button");b.setAttribute("data-vr-stage",i);b.textContent="Stage "+(i+1);document.querySelector(".vr-scene").appendChild(b);});`);
  const result = evaluate(dir);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("evaluator checks weather level buttons (off/low/medium)", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  let html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  html = html.replace(/data-vr-weather-level="off"/g, "");
  html = html.replace(/data-vr-weather-level="low"/g, "");
  html = html.replace(/data-vr-weather-level="medium"/g, "");
  fs.writeFileSync(path.join(dir, "index.html"), html);
  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /weather level button/);
});

test("evaluator rejects data attributes hidden in HTML comments", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  let html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  // Remove all real data-vr-note-save attributes
  html = html.replace(/ data-vr-note-save/g, " data-vr-REMOVED-note-save");
  // But add one inside a comment — should NOT satisfy the check
  html = html.replace("</body>", "<!-- <button data-vr-note-save>Fake</button> -->\n</body>");
  fs.writeFileSync(path.join(dir, "index.html"), html);
  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /note save/);
});

test("evaluator requires an exact data attribute name", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  let html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  html = html.replace(/data-vr-note-save/g, "data-vr-note-save-fake");
  fs.writeFileSync(path.join(dir, "index.html"), html);
  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /note save/);
});

test("evaluator rejects scaffold prompt remnants", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  // Simulate old scaffold creating prompt files
  fs.mkdirSync(path.join(dir, "prompts"), { recursive: true });
  fs.writeFileSync(path.join(dir, "prompts", "bgm.txt"), "old prompt");
  fs.writeFileSync(path.join(dir, "prompts", "image.txt"), "old prompt");
  // The evaluator should NOT fail because of extra files — it just checks required files exist
  const result = evaluate(dir);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
