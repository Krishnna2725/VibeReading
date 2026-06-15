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
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    failures.push(`invalid JSON ${path.basename(file)}: ${error.message}`);
    return null;
  }
}

function checkJavaScript(file, failures) {
  const syntax = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (syntax.status !== 0) failures.push(`${path.basename(file)} syntax error: ${syntax.stderr.trim()}`);
}

function readLocalAssets(abs, html, failures) {
  let loadedCode = "";
  const references = html.matchAll(/(?:src|href)=["']((?:\.\/)?[^"'?#:]+)["']/g);
  for (const [, reference] of references) {
    const file = path.resolve(abs, reference);
    if (!fs.existsSync(file)) {
      failures.push(`missing local asset ${reference}`);
    } else if (/\.(?:js|css)$/i.test(file)) {
      loadedCode += `\n${fs.readFileSync(file, "utf8")}`;
      if (/\.js$/i.test(file)) checkJavaScript(file, failures);
    }
  }
  return loadedCode;
}

function checkDir(dir) {
  const abs = path.resolve(dir);
  const failures = [];

  for (const rel of requiredFiles) {
    if (!fs.existsSync(path.join(abs, rel))) failures.push(`missing ${rel}`);
  }

  const specFile = path.join(abs, "space-spec.json");
  const metaFile = path.join(abs, "bgm-meta.json");
  const spec = fs.existsSync(specFile) ? parseJson(specFile, failures) : null;
  if (fs.existsSync(metaFile)) parseJson(metaFile, failures);

  const htmlFile = path.join(abs, "index.html");
  const cssFile = path.join(abs, "style.css");
  const jsFile = path.join(abs, "app.js");
  const html = fs.existsSync(htmlFile) ? fs.readFileSync(htmlFile, "utf8") : "";
  const css = fs.existsSync(cssFile) ? fs.readFileSync(cssFile, "utf8") : "";
  const js = fs.existsSync(jsFile) ? fs.readFileSync(jsFile, "utf8") : "";
  let code = `${html}\n${css}\n${js}`;

  if (html) {
    if (!/^<!doctype html>/i.test(html)) failures.push("index.html must start with doctype");
    if (!/href=["'](?:\.\/)?style\.css["']/.test(html)) failures.push("index.html does not load style.css");
    if (!/src=["'](?:\.\/)?app\.js["']/.test(html)) failures.push("index.html does not load app.js");
    code += readLocalAssets(abs, html, failures);
  }

  const featureChecks = {
    "guided entry": /data-vr-guide-start/i,
    "sound playback": /\.play\s*\(/i,
    "sound control": /data-vr-sound-toggle/i,
    "stage switching": /data-vr-stage/i,
    "reading timer": /data-vr-timer-toggle/i,
    "pomodoro": /pomodoro/i
  };
  for (const [label, pattern] of Object.entries(featureChecks)) {
    if (!pattern.test(code)) failures.push(`missing code feature: ${label}`);
  }

  if (/\bfetch\s*\(/i.test(code)) failures.push("file:// output must not depend on fetch()");
  if (/(?:src|href)=["']https?:\/\//i.test(html)) {
    failures.push("file:// output must not depend on remote assets");
  }
  if (!/aspect-ratio\s*:\s*16\s*\/\s*9|@media[^{]*\((?:min-|max-)?aspect-ratio\s*:\s*16\s*\/\s*9\)/i.test(css)) {
    failures.push("missing detectable 16:9 display handling");
  }

  if (spec) {
    const stages = spec.stages;
    if (!Array.isArray(stages) || stages.length < 3 || stages.length > 6) {
      failures.push("space-spec stages must contain 3-6 items");
    }
    for (const [index, stage] of (stages || []).entries()) {
      if (typeof stage.sourceRange !== "string" || !stage.sourceRange.trim()) {
        failures.push(`space-spec stages[${index}].sourceRange must identify its chapter range`);
      }
      if (!Array.isArray(stage.chapters) || !stage.chapters.length) {
        failures.push(`space-spec stages[${index}].chapters must list grouped chapters`);
      }
    }
    if (!Array.isArray(spec.entryGuide?.steps) || !spec.entryGuide.steps.length) {
      failures.push("space-spec entryGuide.steps must not be empty");
    }
    if (spec.entryGuide?.soundRequiredAfterStart !== true) {
      failures.push("space-spec entryGuide.soundRequiredAfterStart must be true");
    }
  }

  return { dir: abs, failures };
}

const results = dirs.map(checkDir);
console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.failures.length)) process.exit(1);
