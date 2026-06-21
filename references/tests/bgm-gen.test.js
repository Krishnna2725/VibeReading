const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const assert = require("node:assert/strict");

const script = path.join(__dirname, "../../scripts/bgm-gen.py");

test("BGM status returns different exit codes for generated and pending", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vibereading-bgm-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, "assets/audio"), { recursive: true });
  fs.writeFileSync(path.join(dir, "assets/audio/bgm.mp3"), Buffer.alloc(1200));
  fs.writeFileSync(path.join(dir, "bgm-meta.json"), JSON.stringify({ status: "generated", is_instrumental: true, file: "./assets/audio/bgm.mp3" }));

  const ready = spawnSync("python", [script, "status", "--output-dir", dir], { encoding: "utf8" });
  assert.equal(ready.status, 0, ready.stdout + ready.stderr);

  fs.writeFileSync(path.join(dir, "bgm-meta.json"), JSON.stringify({ status: "pending", is_instrumental: true, file: "./assets/audio/bgm.mp3" }));
  const pending = spawnSync("python", [script, "status", "--output-dir", dir], { encoding: "utf8" });
  assert.equal(pending.status, 2);
});

test("start uses --prompt and does not persist raw prompt", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vibereading-bgm-start-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, "assets/audio"), { recursive: true });
  fs.writeFileSync(path.join(dir, "assets/audio/bgm.mp3"), Buffer.alloc(1200));

  const result = spawnSync("python", [script, "start", "--prompt", "instrumental reading room", "--output-dir", dir], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);

  const meta = JSON.parse(fs.readFileSync(path.join(dir, "bgm-meta.json"), "utf8"));
  const job = JSON.parse(fs.readFileSync(path.join(dir, "bgm-job.json"), "utf8"));
  assert.equal(meta.status, "generated");
  assert.ok(!("prompt" in meta));
  assert.equal(job.status, "generated");
  assert.ok(!("prompt" in job));
  assert.ok(job.startedAt);
  assert.ok(job.finishedAt);
});

test("worker failure retains startedAt and finishedAt without saving prompt", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vibereading-bgm-worker-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, "assets/audio"), { recursive: true });

  const result = spawnSync("python", [script, "_worker", "--prompt", "instrumental storm", "--output-dir", dir, "--started-at", "123"], {
    encoding: "utf8",
    env: { ...process.env, MINIMAX_API_KEY: "" },
  });
  assert.equal(result.status, 1);

  const meta = JSON.parse(fs.readFileSync(path.join(dir, "bgm-meta.json"), "utf8"));
  const job = JSON.parse(fs.readFileSync(path.join(dir, "bgm-job.json"), "utf8"));
  assert.equal(meta.status, "failed");
  assert.ok(!("prompt" in meta));
  assert.equal(job.status, "failed");
  assert.equal(job.startedAt, 123);
  assert.ok(job.finishedAt);
  assert.ok(!("prompt" in job));
});

test("BGM status accepts reused with source field", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vibereading-bgm-reused-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, "assets/audio"), { recursive: true });
  fs.writeFileSync(path.join(dir, "assets/audio/bgm.mp3"), Buffer.alloc(1200));
  fs.writeFileSync(path.join(dir, "bgm-meta.json"), JSON.stringify({
    status: "reused",
    is_instrumental: true,
    file: "./assets/audio/bgm.mp3",
    reused_from: "output/2026-01-01-PriorBook-purpose",
  }));

  const result = spawnSync("python", [script, "status", "--output-dir", dir], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
