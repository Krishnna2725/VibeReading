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
];

const templateAllowlist = new Set(["window", "vinyl", "instrument", "route", "oracle"]);
const weatherAllowlist = new Set([
  "rain", "storm-rain", "fog", "snow", "wind",
  "ripple", "water", "dust", "embers", "fire",
  "signal", "paper", "stars", "leaves", "fireflies",
]);

const ambienceWeatherGuidance = new Map([
  ["drizzle", ["rain", "storm-rain"]],
  ["moderate-rain", ["rain", "storm-rain"]],
  ["rain-on-the-window", ["rain", "storm-rain"]],
  ["thunder-freight", ["rain", "storm-rain"]],
  ["fireplace-crackling", ["fire", "embers"]],
  ["soft-wind", ["wind"]],
  ["distant-breeze", ["wind"]],
  ["forest-wind-with-birds", ["wind"]],
  ["windstorm", ["wind"]],
  ["lake-wavelet", ["ripple", "water"]],
  ["sea-and-seagull-wave", ["ripple", "water"]],
  ["mountain-stream", ["ripple", "water"]],
]);

function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

function countOccurrences(str, sub) {
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(sub, pos)) !== -1) {
    count += 1;
    pos += sub.length;
  }
  return count;
}

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

function assertLocalFile(absPath, label, failures) {
  if (!fs.existsSync(absPath)) {
    failures.push(`missing ${label}: ${path.basename(absPath)}`);
    return false;
  }
  if (fs.statSync(absPath).size <= 0) {
    failures.push(`empty ${label}: ${path.basename(absPath)}`);
    return false;
  }
  return true;
}

function collectLinkedLocalFiles(absDir, html, failures) {
  const files = [];
  const refs = html.matchAll(/(?:src|href)=["']((?:\.\/)?[^"'?#:]+)["']/g);
  for (const [, ref] of refs) {
    const resolved = path.resolve(absDir, ref);
    if (assertLocalFile(resolved, `local asset ${ref}`, failures)) files.push(resolved);
  }
  return files;
}

function checkHookPresence(code, failures) {
  if (!code.includes("data-vr-guide-start")) failures.push("missing core hook: data-vr-guide-start");
  if (!code.includes("data-vr-stage")) failures.push("missing core hook: data-vr-stage");
  if (!code.includes("data-vr-sound-toggle")) failures.push("missing core hook: data-vr-sound-toggle");
  if (!code.includes("data-vr-timer-toggle")) failures.push("missing core hook: data-vr-timer-toggle");
  if (!code.includes("data-vr-timer-mode")) failures.push("missing core hook: data-vr-timer-mode");
}

function collectAmbienceWeatherWarnings(spec, warnings) {
  for (const [index, stage] of (spec?.stages || []).entries()) {
    const ambienceId = String(stage.ambience || "").trim().toLowerCase();
    const allowedWeather = ambienceWeatherGuidance.get(ambienceId);
    if (!allowedWeather || !stage.weather?.kind) continue;
    if (allowedWeather.includes(String(stage.weather.kind).toLowerCase())) continue;
    warnings.push(
      `stages[${index}] ambience "${stage.ambience}" usually pairs with ${allowedWeather.join(" or ")}, not "${stage.weather.kind}"`
    );
  }
}

function checkDir(dir) {
  const abs = path.resolve(dir);
  const failures = [];
  const warnings = [];

  for (const rel of requiredFiles) {
    if (!fs.existsSync(path.join(abs, rel))) failures.push(`missing ${rel}`);
  }

  const htmlFile = path.join(abs, "index.html");
  const cssFile = path.join(abs, "style.css");
  const jsFile = path.join(abs, "app.js");
  const specFile = path.join(abs, "space-spec.json");
  const metaFile = path.join(abs, "bgm-meta.json");

  const html = fs.existsSync(htmlFile) ? fs.readFileSync(htmlFile, "utf8") : "";
  const css = fs.existsSync(cssFile) ? fs.readFileSync(cssFile, "utf8") : "";
  const js = fs.existsSync(jsFile) ? fs.readFileSync(jsFile, "utf8") : "";
  const strippedHtml = stripHtmlComments(html);
  const authoredCode = `${strippedHtml}\n${js}`;
  const fullCode = `${strippedHtml}\n${css}\n${js}`;

  const spec = fs.existsSync(specFile) ? parseJson(specFile, failures) : null;
  const meta = fs.existsSync(metaFile) ? parseJson(metaFile, failures) : null;

  if (html) {
    if (!/^<!doctype html>/i.test(html)) failures.push("index.html must start with doctype");
    if (countOccurrences(strippedHtml, 'href="./runtime/v2-runtime.css"') !== 1) failures.push("index.html must load ./runtime/v2-runtime.css exactly once");
    if (countOccurrences(strippedHtml, 'src="./runtime/libs/p5.min.js"') !== 1) failures.push("index.html must load ./runtime/libs/p5.min.js exactly once");
    if (countOccurrences(strippedHtml, 'src="./app.js"') !== 1) failures.push("index.html must load ./app.js exactly once");
    if (countOccurrences(strippedHtml, 'src="./runtime/v2-runtime.js"') !== 1) failures.push("index.html must load ./runtime/v2-runtime.js exactly once");
    if (!strippedHtml.includes("data-vr-guide")) failures.push("index.html must keep a guide root");
    if (!strippedHtml.includes("data-vr-weather")) failures.push("index.html must keep a weather layer");
    if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(strippedHtml)) failures.push("index.html must not inline JavaScript");
    if (/<script[^>]+type=["']module["']/i.test(strippedHtml)) failures.push("index.html must not use module scripts");
    if (/(?:src|href)=["']https?:\/\//i.test(strippedHtml)) failures.push("file:// output must not depend on remote assets");

    const p5Pos = strippedHtml.indexOf('src="./runtime/libs/p5.min.js"');
    const appPos = strippedHtml.indexOf('src="./app.js"');
    const runtimePos = strippedHtml.indexOf('src="./runtime/v2-runtime.js"');
    if (!(p5Pos !== -1 && appPos !== -1 && runtimePos !== -1 && p5Pos < appPos && appPos < runtimePos)) {
      failures.push("scripts must load in p5.min.js -> app.js -> runtime order");
    }

    const linked = collectLinkedLocalFiles(abs, strippedHtml, failures);
    for (const file of linked) {
      if (file.endsWith(".js") && !file.endsWith("p5.min.js")) checkJavaScript(file, failures);
    }
  }

  checkJavaScript(jsFile, failures);

  if (/\bfetch\s*\(/i.test(fullCode)) failures.push("file:// output must not depend on fetch()");
  if (!/aspect-ratio\s*:\s*16\s*\/\s*9/i.test(css)) failures.push("missing detectable 16:9 display handling");

  checkHookPresence(authoredCode, failures);

  if (spec) {
    if (!templateAllowlist.has(spec.template?.primary)) failures.push("template.primary must be one of window/vinyl/instrument/route/oracle");

    const stages = spec.stages;
    if (!Array.isArray(stages) || stages.length < 3 || stages.length > 6) {
      failures.push("space-spec stages must contain 3-6 items");
    }

    if (!Array.isArray(spec.entryGuide?.steps) || !spec.entryGuide.steps.length) {
      failures.push("space-spec entryGuide.steps must not be empty");
    }
    if (spec.entryGuide?.soundRequiredAfterStart !== true) {
      failures.push("space-spec entryGuide.soundRequiredAfterStart must be true");
    }

    for (const [index, stage] of (stages || []).entries()) {
      if (typeof stage.sourceRange !== "string" || !stage.sourceRange.trim()) {
        failures.push(`space-spec stages[${index}].sourceRange must be non-empty`);
      }
      if (!Array.isArray(stage.chapters) || !stage.chapters.length) {
        failures.push(`space-spec stages[${index}].chapters must be non-empty`);
      }
      if (typeof stage.readingHint !== "string" || !stage.readingHint.trim()) {
        failures.push(`space-spec stages[${index}].readingHint must be non-empty`);
      }
      const weatherKind = stage.weather?.kind;
      if (weatherKind && !weatherAllowlist.has(weatherKind)) {
        failures.push(`stages[${index}].weather.kind "${weatherKind}" is not in the runtime allowlist`);
      }
    }

    for (const image of spec.assets?.images || []) {
      if (!image.path) continue;
      assertLocalFile(path.resolve(abs, image.path), `declared image ${image.path}`, failures);
    }

    const ambienceFiles = spec.audio?.ambienceFiles;
    if (ambienceFiles !== undefined && (typeof ambienceFiles !== "object" || Array.isArray(ambienceFiles))) {
      failures.push("audio.ambienceFiles must be an object map of ambience ids to local files");
    }

    for (const [key, relPath] of Object.entries(ambienceFiles || {})) {
      if (typeof relPath !== "string" || !relPath.trim()) {
        failures.push(`audio.ambienceFiles.${key} must be a non-empty local path`);
        continue;
      }
      assertLocalFile(path.resolve(abs, relPath), `ambience file ${key}`, failures);
    }

    for (const [index, stage] of (stages || []).entries()) {
      if (!stage.ambience) continue;
      if (!ambienceFiles || !ambienceFiles[stage.ambience]) {
        failures.push(`stages[${index}].ambience must reference a key in audio.ambienceFiles`);
      }
    }

    collectAmbienceWeatherWarnings(spec, warnings);
  }

  if (meta) {
    if (!["generated", "reused", "failed"].includes(meta.status)) {
      failures.push("bgm-meta status must be generated, reused, or failed");
    }
    const bgmPath = path.join(abs, "assets", "audio", "bgm.mp3");
    if (meta.status === "generated" || meta.status === "reused") {
      assertLocalFile(bgmPath, "BGM file", failures);
    }
    if (meta.status === "reused" && (typeof meta.reused_from !== "string" || !meta.reused_from.trim())) {
      failures.push("bgm-meta status reused requires a non-empty reused_from");
    }
    if (meta.status === "failed" && spec) {
      const fallbackStages = (spec.stages || []).filter((stage) => stage.ambience && spec.audio?.ambienceFiles?.[stage.ambience]);
      if (!fallbackStages.length) failures.push("failed BGM requires at least one stage ambience fallback");
    }
  }

  const jobFile = path.join(abs, "bgm-job.json");
  if (fs.existsSync(jobFile)) {
    const job = parseJson(jobFile, failures);
    if (job && ["generated", "failed"].includes(job.status)) {
      if (!job.startedAt || !job.finishedAt) failures.push("completed bgm-job.json must retain startedAt and finishedAt");
    }
  }

  return { dir: abs, failures, warnings };
}

const results = dirs.map(checkDir);
console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.failures.length)) process.exit(1);
