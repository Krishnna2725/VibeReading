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

function makeMinimalPNG() {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
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
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const compressed = zlib.deflateSync(Buffer.from([0, 100, 140, 180]));
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", Buffer.alloc(0))]);
}

function controlMarkup() {
  return `
    <button type="button" data-vr-guide-start>开始</button>
    <button type="button" data-vr-guide-next hidden>继续</button>
    <button type="button" data-vr-guide-skip hidden>跳过引导</button>
    <button type="button" data-vr-guide-replay>重新引导</button>
    <button type="button" data-vr-sound-toggle>静音</button>
    <button type="button" data-vr-stage="0">阶段一</button>
    <button type="button" data-vr-stage="1">阶段二</button>
    <button type="button" data-vr-stage="2">阶段三</button>
    <div data-vr-current-stage></div>
    <div data-vr-current-range></div>
    <div data-vr-current-hint></div>
    <button type="button" data-vr-weather-level="off">关闭</button>
    <button type="button" data-vr-weather-level="medium">中档</button>
    <button type="button" data-vr-weather-level="high">高档</button>
    <button type="button" data-vr-timer-toggle>暂停</button>
    <button type="button" data-vr-timer-reset>重置</button>
    <select data-vr-timer-mode><option value="elapsed">阅读计时</option><option value="pomodoro">番茄钟</option></select>
    <input type="range" data-vr-bgm-volume min="0" max="1" step="0.05" value="0.45">
    <input type="range" data-vr-ambience-volume min="0" max="1" step="0.05" value="0.32">
  `;
}

function makeFixture(stageCount) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vibereading-evaluator-"));
  const scaffoldResult = spawnSync("python", [scaffold, "--output-dir", dir], { encoding: "utf8" });
  assert.equal(scaffoldResult.status, 0, scaffoldResult.stdout + scaffoldResult.stderr);

  const ambienceFile = "./assets/audio/rain-window.mp3";
  const stages = Array.from({ length: stageCount }, (_, index) => ({
    id: `stage-${index + 1}`,
    label: `Stage ${index + 1}`,
    sourceRange: `Chapter group ${index + 1}`,
    chapters: [`Chapter ${index + 1}`],
    readingHint: `Hint ${index + 1}`,
    weather: { kind: "rain", defaultLevel: "medium" },
    ambience: "rain-window",
  }));

  const spec = {
    book: { title: "Fixture Book", author: "Fixture Author" },
    template: { primary: "route", reason: "fixture" },
    entryGuide: {
      soundRequiredAfterStart: true,
      steps: [{ text: "慢慢开始。" }, { text: "听见此刻。" }, { text: "进入阅读。" }],
      motion: "route-path-light",
    },
    audio: {
      bgmFile: "./assets/audio/bgm.mp3",
      ambienceFiles: {
        "rain-window": ambienceFile,
      },
    },
    stages,
    assets: {
      images: [{ role: "base", path: "./assets/images/base.png" }],
    },
  };

  const appJs = `
window.VIBE_READING_SPEC = ${JSON.stringify(spec, null, 2)};
document.addEventListener("DOMContentLoaded", function () {
  var root = document.querySelector("[data-vr-companion-root]");
  if (!root) return;
  root.innerHTML = ${JSON.stringify(controlMarkup())};
  ["off", "medium", "high"].forEach(function (level) {
    var button = root.querySelector('[data-vr-weather-level="' + level + '"]');
    if (button) button.setAttribute("data-vr-weather-level", level);
  });
});
`;

  fs.writeFileSync(path.join(dir, "app.js"), appJs);
  fs.writeFileSync(path.join(dir, "space-spec.json"), JSON.stringify(spec, null, 2));
  fs.writeFileSync(path.join(dir, "bgm-meta.json"), JSON.stringify({ status: "failed", is_instrumental: true, file: "./assets/audio/bgm.mp3", reason: "fixture" }, null, 2));
  fs.writeFileSync(path.join(dir, "assets", "images", "base.png"), makeMinimalPNG());
  fs.writeFileSync(path.join(dir, "assets", "audio", "rain-window.mp3"), Buffer.alloc(44, 1));
  return dir;
}

function evaluate(dir) {
  return spawnSync(process.execPath, [evaluator, dir], { encoding: "utf8" });
}

test("evaluator accepts fixture with 3 to 6 stages", (t) => {
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

test("evaluator rejects fetch dependency", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.appendFileSync(path.join(dir, "app.js"), "\nfetch('./space-spec.json');\n");
  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /must not depend on fetch/);
});

test("evaluator rejects missing core hooks", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const appPath = path.join(dir, "app.js");
  const appJs = fs.readFileSync(appPath, "utf8").replace(/data-vr-timer-mode/g, "data-vr-missing-timer-mode");
  fs.writeFileSync(appPath, appJs);
  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /data-vr-timer-mode/);
});

test("evaluator rejects stage ambience keys missing from audio map", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const specPath = path.join(dir, "space-spec.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  spec.stages[0].ambience = "missing-key";
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
  fs.writeFileSync(path.join(dir, "app.js"), `window.VIBE_READING_SPEC = ${JSON.stringify(spec)};\ndocument.addEventListener("DOMContentLoaded", function(){document.querySelector("[data-vr-companion-root]").innerHTML=${JSON.stringify(controlMarkup())};});`);
  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /must reference a key in audio\.ambienceFiles/);
});

test("evaluator accepts reused BGM with source and local file", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "assets", "audio", "bgm.mp3"), Buffer.alloc(1200, 1));
  fs.writeFileSync(path.join(dir, "bgm-meta.json"), JSON.stringify({
    status: "reused",
    is_instrumental: true,
    file: "./assets/audio/bgm.mp3",
    reused_from: "output/2026-01-01-Prior",
  }, null, 2));
  const result = evaluate(dir);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("evaluator ignores optional raw prompt metadata", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "bgm-meta.json"), JSON.stringify({
    status: "failed",
    is_instrumental: true,
    file: "./assets/audio/bgm.mp3",
    prompt: "do not keep this",
  }, null, 2));
  const result = evaluate(dir);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("evaluator warns but does not fail on ambience-weather mismatch", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const specPath = path.join(dir, "space-spec.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  spec.audio.ambienceFiles.drizzle = "./assets/audio/drizzle.mp3";
  spec.stages[0].ambience = "drizzle";
  spec.stages[0].weather = { kind: "snow", defaultLevel: "medium" };
  fs.writeFileSync(path.join(dir, "assets", "audio", "drizzle.mp3"), Buffer.alloc(1200, 1));
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
  fs.writeFileSync(path.join(dir, "app.js"), `window.VIBE_READING_SPEC = ${JSON.stringify(spec)};\ndocument.addEventListener("DOMContentLoaded", function(){document.querySelector("[data-vr-companion-root]").innerHTML=${JSON.stringify(controlMarkup())};});`);
  const result = evaluate(dir);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /usually pairs with rain or storm-rain/);
});

test("evaluator rejects failed BGM without ambience fallback", (t) => {
  const dir = makeFixture(3);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const specPath = path.join(dir, "space-spec.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  spec.audio.ambienceFiles = {};
  spec.stages.forEach((stage) => { stage.ambience = ""; });
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
  fs.writeFileSync(path.join(dir, "app.js"), `window.VIBE_READING_SPEC = ${JSON.stringify(spec)};\ndocument.addEventListener("DOMContentLoaded", function(){document.querySelector("[data-vr-companion-root]").innerHTML=${JSON.stringify(controlMarkup())};});`);
  const result = evaluate(dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /failed BGM requires at least one stage ambience fallback/);
});
