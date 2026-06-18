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
  fs.writeFileSync(path.join(dir, "bgm-meta.json"), JSON.stringify({ status: "generated" }));

  const ready = spawnSync("python", [script, "status", "--output-dir", dir], { encoding: "utf8" });
  assert.equal(ready.status, 0, ready.stdout + ready.stderr);

  fs.writeFileSync(path.join(dir, "bgm-meta.json"), JSON.stringify({ status: "pending" }));
  const pending = spawnSync("python", [script, "status", "--output-dir", dir], { encoding: "utf8" });
  assert.equal(pending.status, 2);
});

test("BGM status accepts reused with source field", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vibereading-bgm-reused-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, "assets/audio"), { recursive: true });
  fs.writeFileSync(path.join(dir, "assets/audio/bgm.mp3"), Buffer.alloc(1200));
  fs.writeFileSync(path.join(dir, "bgm-meta.json"), JSON.stringify({
    status: "reused",
    reused_from: "output/2026-01-01-PriorBook-purpose"
  }));

  const result = spawnSync("python", [script, "status", "--output-dir", dir], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
