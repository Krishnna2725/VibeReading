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
  "prompts/bgm.txt"
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
      if (/\.js$/i.test(file)) checkJavaScript(file, failures);
      if (path.basename(file) !== "p5.min.js") {
        loadedCode += `\n${fs.readFileSync(file, "utf8")}`;
      }
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
  const imagePromptFile = path.join(abs, "prompts", "image.txt");
  const bgmPromptFile = path.join(abs, "prompts", "bgm.txt");
  const spec = fs.existsSync(specFile) ? parseJson(specFile, failures) : null;
  if (fs.existsSync(metaFile)) parseJson(metaFile, failures);

  const htmlFile = path.join(abs, "index.html");
  const cssFile = path.join(abs, "style.css");
  const jsFile = path.join(abs, "app.js");
  const html = fs.existsSync(htmlFile) ? fs.readFileSync(htmlFile, "utf8") : "";
  const css = fs.existsSync(cssFile) ? fs.readFileSync(cssFile, "utf8") : "";
  const js = fs.existsSync(jsFile) ? fs.readFileSync(jsFile, "utf8") : "";
  const imagePrompt = fs.existsSync(imagePromptFile) ? fs.readFileSync(imagePromptFile, "utf8") : "";
  const bgmPrompt = fs.existsSync(bgmPromptFile) ? fs.readFileSync(bgmPromptFile, "utf8") : "";
  let code = `${html}\n${css}\n${js}`;
  const authoredCode = `${html}\n${js}`;

  if (html) {
    if (!/^<!doctype html>/i.test(html)) failures.push("index.html must start with doctype");
    if (!/href=["'](?:\.\/)?style\.css["']/.test(html)) failures.push("index.html does not load style.css");
    if (!/src=["'](?:\.\/)?app\.js["']/.test(html)) failures.push("index.html does not load app.js");
    code += readLocalAssets(abs, html, failures);
    const runtimeCssCount = (html.match(/href=["']\.\/runtime\/v2-runtime\.css["']/g) || []).length;
    const runtimeJsCount = (html.match(/src=["']\.\/runtime\/v2-runtime\.js["']/g) || []).length;
    const p5JsCount = (html.match(/src=["']\.\/runtime\/libs\/p5\.min\.js["']/g) || []).length;
    const appJsCount = (html.match(/src=["']\.\/app\.js["']/g) || []).length;
    if (runtimeCssCount !== 1) failures.push("index.html must load ./runtime/v2-runtime.css exactly once");
    if (runtimeJsCount !== 1) failures.push("index.html must load ./runtime/v2-runtime.js exactly once");
    if (p5JsCount !== 1) failures.push("index.html must load ./runtime/libs/p5.min.js exactly once");
    if (appJsCount !== 1) failures.push("index.html must load ./app.js exactly once");
    if (/<style\b/i.test(html)) failures.push("index.html must not inline shared or book CSS");
    if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) failures.push("index.html must not inline JavaScript");
    if (html.indexOf('src="./app.js"') > html.indexOf('src="./runtime/v2-runtime.js"')) {
      failures.push("app.js must load before runtime/v2-runtime.js");
    }
    if (html.indexOf('src="./runtime/libs/p5.min.js"') > html.indexOf('src="./runtime/v2-runtime.js"')) {
      failures.push("p5.min.js must load before runtime/v2-runtime.js");
    }
    if (/<script[^>]+type=["']module["']/i.test(html)) failures.push("index.html must not use module scripts");
  }

  const featureChecks = {
    "guided entry": /data-vr-guide-start/i,
    "click-stepped guide": /data-vr-guide-next/i,
    "sound playback": /\.play\s*\(/i,
    "sound control": /data-vr-sound-toggle/i,
    "stage switching": /data-vr-stage/i,
    "current stage label": /data-vr-current-stage|vibereading:stage/i,
    "current stage hint": /data-vr-current-hint|readingHint/i,
    "weather layer": /data-vr-weather/i,
    "weather engine marker": /vrWeatherEngine\s*=\s*["'](?:p5|canvas)["']/i,
    "reading timer": /data-vr-timer-toggle/i,
    "pomodoro": /data-vr-timer-mode/i
  };
  for (const [label, pattern] of Object.entries(featureChecks)) {
    if (!pattern.test(code)) failures.push(`missing code feature: ${label}`);
  }

  // Required control data attributes — every generated page must include these
  const requiredControls = [
    { attr: "data-vr-stage", label: "stage control" },
    { attr: "data-vr-weather-level", label: "weather level control" },
    { attr: "data-vr-sound-toggle", label: "sound toggle" },
    { attr: "data-vr-timer-toggle", label: "timer toggle" },
    { attr: "data-vr-timer-mode", label: "timer mode (pomodoro)" }
  ];
  for (const { attr, label } of requiredControls) {
    if (!html.includes(attr)) failures.push(`missing required control: ${label} (${attr})`);
  }

  if (spec && Array.isArray(spec.stages) && spec.stages.length > 0 && !/data-vr-stage/i.test(authoredCode)) {
    failures.push("stage controls (data-vr-stage) must exist in authored output (index.html or app.js), not only in copied runtime");
  }

  if (/\bfetch\s*\(/i.test(code)) failures.push("file:// output must not depend on fetch()");
  const visibleInternalLabels = [
    /Deck Palette/i,
    /Symbol System/i,
    /Style Strategy/i,
    /\bStyle:\s*[A-Z]/,
    /deckPalette/,
    /cardMaterial/,
    /backPattern/,
    /edgeTreatment/,
    /motionStyle/,
    /visualMotif/,
    /musicDirection/,
    /uiLanguage/,
    /\bprompt\b/i,
    /提示词/,
    /风格策略/,
    /设计说明/
  ];
  for (const pattern of visibleInternalLabels) {
    if (pattern.test(html)) {
      failures.push("index.html must not expose internal prompt, style or design-system labels to readers");
      break;
    }
  }
  if (/data-vr-companion-toggle|vr-companion-toggle|阅读陪伴/i.test(html)) {
    failures.push("templates must not include the old generic companion card; embed controls inside the selected template");
  }
  if (/(?:src|href)=["']https?:\/\//i.test(html)) {
    failures.push("file:// output must not depend on remote assets");
  }
  if (!/aspect-ratio\s*:\s*16\s*\/\s*9|@media[^{]*\((?:min-|max-)?aspect-ratio\s*:\s*16\s*\/\s*9\)/i.test(css)) {
    failures.push("missing detectable 16:9 display handling");
  }

  if (spec) {
    if (spec.template?.primary === "symbols") {
      failures.push("template 'symbols' has been replaced by 'oracle'");
    }
    const imageRequiredTemplates = new Set(["window", "vinyl", "route"]);
    const requiresGeneratedImage = imageRequiredTemplates.has(spec.template?.primary);
    if (requiresGeneratedImage) {
      if (!fs.existsSync(path.join(abs, "concept-image.png"))) failures.push("missing concept-image.png");
      if (!fs.existsSync(imagePromptFile)) failures.push("missing prompts/image.txt");
    }
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
      if (Array.isArray(stage.floatingTexts) && stage.floatingTexts.length) {
        failures.push(`space-spec stages[${index}].floatingTexts is not allowed; use the preset readingHint`);
      }
      // TOC consistency: check that sourceRange description matches chapters count
      if (Array.isArray(stage.chapters) && stage.chapters.length > 0 && typeof stage.sourceRange === "string") {
        const rangeMatch = stage.sourceRange.match(/(\d+)\s*[-–—]\s*(\d+)/);
        if (rangeMatch) {
          const lo = parseInt(rangeMatch[1], 10);
          const hi = parseInt(rangeMatch[2], 10);
          const expectedCount = hi - lo + 1;
          if (expectedCount > 0 && stage.chapters.length !== expectedCount) {
            failures.push(`space-spec stages[${index}].chapters has ${stage.chapters.length} items but sourceRange "${stage.sourceRange}" implies ${expectedCount}`);
          }
        }
      }
    }
    if (!Array.isArray(spec.entryGuide?.steps) || !spec.entryGuide.steps.length) {
      failures.push("space-spec entryGuide.steps must not be empty");
    } else {
      spec.entryGuide.steps.forEach((step, index) => {
        if (typeof step.text !== "string" || !step.text.trim()) {
          failures.push(`space-spec entryGuide.steps[${index}].text must not be empty`);
        }
      });
    }
    if (spec.entryGuide?.soundRequiredAfterStart !== true) {
      failures.push("space-spec entryGuide.soundRequiredAfterStart must be true");
    }
    const meta = fs.existsSync(metaFile) ? parseJson(metaFile, failures) : null;
    if (meta && !["generated", "reused", "failed"].includes(meta.status)) {
      failures.push("final bgm-meta status must be generated, reused, or failed; pending/skipped is not deliverable");
    }
    if (meta?.status === "reused") {
      const source = meta.reused_from || meta.sourceOutput || meta.source;
      if (typeof source !== "string" || !source.trim()) {
        failures.push("bgm-meta status reused requires a non-empty reused_from or sourceOutput field");
      }
    }
    for (const file of spec.audio?.ambienceFiles || []) {
      if (!fs.existsSync(path.resolve(abs, file))) failures.push(`missing ambience fallback ${file}`);
    }
    if (meta?.status === "failed" && !(spec.audio?.ambienceFiles || []).length) {
      failures.push("failed BGM requires at least one copied ambience fallback");
    }
    if (meta?.status === "generated" && !fs.existsSync(path.join(abs, "assets", "audio", "bgm.mp3"))) {
      failures.push("bgm-meta is generated but assets/audio/bgm.mp3 is missing");
    }
    if (spec.template?.primary === "window") {
      const composition = spec.visual?.windowComposition;
      if (composition?.windowAndExteriorMinPercent !== 70 || composition?.exteriorMinPercent !== 55 || composition?.interiorMaxPercent !== 30) {
        failures.push("window space-spec must declare the 70/55/30 composition contract");
      }
      if (!/70\b/.test(imagePrompt) || !/55\b/.test(imagePrompt)) {
        failures.push("window image prompt must reference the 70% and 55% composition constraints");
      }
    }
    if (requiresGeneratedImage && fs.existsSync(imagePromptFile) && !/no\s+text/i.test(imagePrompt)) {
      failures.push("image prompt must include a no-text instruction");
    }
    if (meta?.status !== "reused" && fs.existsSync(bgmPromptFile) && (!/instrumental/i.test(bgmPrompt) || !/\bno\b.*\b(?:vocal|singing|spoken|lyric)/i.test(bgmPrompt))) {
      failures.push("BGM prompt must require instrumental with an explicit no-vocals constraint");
    }
  }

  return { dir: abs, failures };
}

const results = dirs.map(checkDir);
console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.failures.length)) process.exit(1);
