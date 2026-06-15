import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const dirs = process.argv.slice(2);
if (!dirs.length) {
  console.error("Usage: node references/tests/evaluate-vibereading-output.mjs output/<dir> [...]");
  process.exit(2);
}

const requiredFiles = [
  "index.html",
  "style.css",
  "app.js",
  "space-spec.json",
  "bgm-meta.json",
  "concept-image.png"
];

function parseJson(file, failures) {
  try {
    JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    failures.push(`invalid JSON ${path.basename(file)}: ${error.message}`);
  }
}

function checkLocalAssets(abs, code, failures) {
  const references = code.matchAll(/(?:src|href)=["'](\.\/[^"'?#]+)["']/g);
  for (const [, reference] of references) {
    if (!fs.existsSync(path.resolve(abs, reference))) {
      failures.push(`missing local asset ${reference}`);
    }
  }
}

function checkDir(dir) {
  const abs = path.resolve(dir);
  const failures = [];

  for (const rel of requiredFiles) {
    if (!fs.existsSync(path.join(abs, rel))) failures.push(`missing ${rel}`);
  }

  for (const rel of ["space-spec.json", "bgm-meta.json"]) {
    const file = path.join(abs, rel);
    if (fs.existsSync(file)) parseJson(file, failures);
  }

  const htmlFile = path.join(abs, "index.html");
  const jsFile = path.join(abs, "app.js");
  const html = fs.existsSync(htmlFile) ? fs.readFileSync(htmlFile, "utf8") : "";
  const js = fs.existsSync(jsFile) ? fs.readFileSync(jsFile, "utf8") : "";

  if (html) {
    if (!/^<!doctype html>/i.test(html)) failures.push("index.html must start with doctype");
    if (!/href=["'](?:\.\/)?style\.css["']/.test(html)) failures.push("index.html does not load style.css");
    if (!/src=["'](?:\.\/)?app\.js["']/.test(html)) failures.push("index.html does not load app.js");
    checkLocalAssets(abs, html, failures);
  }

  if (jsFile && fs.existsSync(jsFile)) {
    const syntax = spawnSync(process.execPath, ["--check", jsFile], { encoding: "utf8" });
    if (syntax.status !== 0) failures.push(`app.js syntax error: ${syntax.stderr.trim()}`);
  }

  return { dir: abs, failures };
}

const results = dirs.map(checkDir);
console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.failures.length)) process.exit(1);
