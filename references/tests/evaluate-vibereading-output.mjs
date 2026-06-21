import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

// --- Audio-Weather Coupling helpers ---

const MANDATORY_COUPLING = new Map([
  ["drizzle", "rain"],
  ["moderate-rain", "rain"],
  ["rain-on-the-window", "rain"],
  ["thunder-freight", "rain"],
  ["fireplace-crackling", "fire"],
  ["soft-wind", "wind"],
  ["distant-breeze", "wind"],
  ["forest-wind-with-birds", "wind"],
  ["windstorm", "wind"],
  ["lake-wavelet", "ripple"],
  ["sea-and-seagull-wave", "water"],
  ["mountain-stream", "water"],
]);

const STRING_FALLBACKS = new Map([
  ["rain", "rain"],
  ["drizzle", "rain"],
  ["fireplace", "fire"],
  ["wind", "wind"],
  ["wave", "water"],
  ["stream", "water"],
  ["lake", "ripple"],
  ["sea", "water"],
]);

function resolveRequiredWeather(ambienceStr) {
  if (!ambienceStr || typeof ambienceStr !== "string") return null;
  const key = ambienceStr.trim().toLowerCase();
  if (MANDATORY_COUPLING.has(key)) return MANDATORY_COUPLING.get(key);
  if (STRING_FALLBACKS.has(key)) return STRING_FALLBACKS.get(key);
  for (const [kw, weather] of MANDATORY_COUPLING) {
    if (key.includes(kw)) return weather;
  }
  for (const [kw, weather] of STRING_FALLBACKS) {
    if (key.includes(kw)) return weather;
  }
  return null;
}

function checkAudioWeatherCoupling(spec, failures) {
  if (!spec || !Array.isArray(spec.stages) || !spec.stages.length) return;
  for (const [index, stage] of spec.stages.entries()) {
    const ambience = stage.ambience;
    const weatherKind = stage.weather?.kind;
    if (!ambience || !weatherKind) continue;
    const requiredWeather = resolveRequiredWeather(ambience);
    if (!requiredWeather) continue;
    const actual = weatherKind.toLowerCase();
    if (actual === requiredWeather) continue;
    if ((requiredWeather === "water" || requiredWeather === "ripple") &&
        (actual === "water" || actual === "ripple")) continue;
    failures.push(
      `audio-weather mismatch stages[${index}]: ambience "${ambience}" requires ${requiredWeather} visual, but weather.kind is "${weatherKind}"`
    );
  }
}

// --- Runtime weather kind allowlist ---
const WEATHER_ALLOWLIST = new Set([
  "rain", "storm-rain", "fog", "snow", "wind",
  "ripple", "water", "dust", "embers", "fire",
  "signal", "paper", "stars", "leaves", "fireflies"
]);

// --- HTML comment stripper ---
// Removes <!-- ... --> comments so attribute checks can't be bypassed by hiding in comments
function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

// --- DOM-aware attribute check ---
// Parses actual HTML tags and checks for data-* attributes on real elements (not in comments)
function htmlHasDataAttributeOnElement(html, attr) {
  const stripped = stripHtmlComments(html);
  // Check if attribute exists as an actual HTML attribute (in a tag, not in text content)
  // Match opening tags that contain the attribute
  const tagRegex = /<([a-z][a-z0-9]*)\b[^>]*>/gi;
  let match;
  while ((match = tagRegex.exec(stripped)) !== null) {
    const tag = match[0];
    if (tag.includes(attr)) return true;
  }
  return false;
}

function countOccurrences(str, sub) {
  let count = 0, pos = 0;
  while ((pos = str.indexOf(sub, pos)) !== -1) { count++; pos += sub.length; }
  return count;
}

// --- Main evaluator ---

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

  // Required files (no more prompts/)
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
  const authoredCode = `${html}\n${js}`;

  // Build stripped version for attribute checks (comments removed)
  const strippedHtml = stripHtmlComments(html);

  if (html) {
    // HTML structure checks
    if (!/^<!doctype html>/i.test(html)) failures.push("index.html must start with doctype");

    // Check linked resources — count on stripped HTML (comments removed)
    if (countOccurrences(strippedHtml, 'href="./runtime/v2-runtime.css"') !== 1)
      failures.push("index.html must load ./runtime/v2-runtime.css exactly once");
    if (countOccurrences(strippedHtml, 'src="./runtime/v2-runtime.js"') !== 1)
      failures.push("index.html must load ./runtime/v2-runtime.js exactly once");
    if (countOccurrences(strippedHtml, 'src="./runtime/libs/p5.min.js"') !== 1)
      failures.push("index.html must load ./runtime/libs/p5.min.js exactly once");
    if (countOccurrences(strippedHtml, 'src="./app.js"') !== 1)
      failures.push("index.html must load ./app.js exactly once");

    code += readLocalAssets(abs, html, failures);

    // Check load order
    const appPos = strippedHtml.indexOf('src="./app.js"');
    const runtimePos = strippedHtml.indexOf('src="./runtime/v2-runtime.js"');
    const p5Pos = strippedHtml.indexOf('src="./runtime/libs/p5.min.js"');
    if (appPos > runtimePos && appPos !== -1 && runtimePos !== -1)
      failures.push("app.js must load before runtime/v2-runtime.js");
    if (p5Pos > runtimePos && p5Pos !== -1 && runtimePos !== -1)
      failures.push("p5.min.js must load before runtime/v2-runtime.js");

    // No inline styles or scripts (check stripped HTML)
    if (/<style\b/i.test(strippedHtml)) failures.push("index.html must not inline shared or book CSS");
    if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(strippedHtml)) failures.push("index.html must not inline JavaScript");
    if (/<script[^>]+type=["']module["']/i.test(strippedHtml)) failures.push("index.html must not use module scripts");
  }

  // Feature checks — use htmlHasDataAttributeOnElement (strips comments first)
  const requiredDataAttrs = [
    { attr: "data-vr-guide-start", label: "guided entry" },
    { attr: "data-vr-guide-next", label: "click-stepped guide" },
    { attr: "data-vr-sound-toggle", label: "sound control" },
    { attr: "data-vr-stage", label: "stage switching" },
    { attr: "data-vr-current-stage", label: "current stage label" },
    { attr: "data-vr-current-hint", label: "current stage hint" },
    { attr: "data-vr-weather", label: "weather layer" },
    { attr: "data-vr-timer-toggle", label: "reading timer" },
    { attr: "data-vr-timer-mode", label: "pomodoro" },
    { attr: "data-vr-note-textarea", label: "note area" },
    { attr: "data-vr-note-save", label: "note save" },
    { attr: "data-vr-guide-replay", label: "guide replay" },
    { attr: "data-vr-bgm-volume", label: "BGM volume control" },
    { attr: "data-vr-ambience-volume", label: "ambience volume control" },
  ];
  for (const { attr, label } of requiredDataAttrs) {
    if (!htmlHasDataAttributeOnElement(html, attr))
      failures.push(`missing required control: ${label} (${attr})`);
  }

  // Required weather level controls
  for (const level of ["off", "low", "medium"]) {
    if (!htmlHasDataAttributeOnElement(html, `data-vr-weather-level="${level}"`))
      failures.push(`missing weather level button: ${level}`);
  }

  // Companion panel
  if (!htmlHasDataAttributeOnElement(html, "data-vr-companion-panel") &&
      !htmlHasDataAttributeOnElement(html, "data-vr-companion")) {
    failures.push("missing companion panel structure");
  }

  // No old companion card (check stripped HTML)
  if (/data-vr-companion-toggle|vr-companion-toggle|阅读陪伴/i.test(strippedHtml)) {
    failures.push("templates must not include the old generic companion card");
  }

  // Stage controls must exist in authored output
  const strippedAuthored = stripHtmlComments(authoredCode);
  if (spec && Array.isArray(spec.stages) && spec.stages.length > 0 &&
      !htmlHasDataAttributeOnElement(authoredCode, "data-vr-stage")) {
    failures.push("stage controls (data-vr-stage) must exist in authored output (index.html or app.js)");
  }

  // No fetch()
  if (/\bfetch\s*\(/i.test(code)) failures.push("file:// output must not depend on fetch()");

  // No exposed internal labels (check stripped HTML)
  const visibleInternalLabels = [
    /Deck Palette/i, /Symbol System/i, /Style Strategy/i, /\bStyle:\s*[A-Z]/,
    /deckPalette/, /cardMaterial/, /backPattern/, /edgeTreatment/, /motionStyle/,
    /visualMotif/, /musicDirection/, /uiLanguage/, /提示词/, /风格策略/, /设计说明/
  ];
  for (const pattern of visibleInternalLabels) {
    if (pattern.test(strippedHtml)) {
      failures.push("index.html must not expose internal design-system labels to readers");
      break;
    }
  }

  // No remote assets (check stripped HTML)
  if (/(?:src|href)=["']https?:\/\//i.test(strippedHtml)) {
    failures.push("file:// output must not depend on remote assets");
  }

  // 16:9 display handling
  if (!/aspect-ratio\s*:\s*16\s*\/\s*9|@media[^{]*\((?:min-|max-)?aspect-ratio\s*:\s*16\s*\/\s*9\)/i.test(css)) {
    failures.push("missing detectable 16:9 display handling");
  }

  // Scrim check
  if (!/rgba\s*\(\s*4\s*,\s*8\s*,\s*10/.test(code) && !/scrim/.test(code)) {
    failures.push("missing fixed light scrim (rgba(4,8,10,...) in CSS or runtime CSS)");
  }

  // Weather kind allowlist
  if (spec?.weather?.kind && !WEATHER_ALLOWLIST.has(spec.weather.kind)) {
    failures.push(`weather.kind "${spec.weather.kind}" is not in the runtime allowlist`);
  }
  for (const [index, stage] of (spec?.stages || []).entries()) {
    const kind = stage.weather?.kind;
    if (kind && !WEATHER_ALLOWLIST.has(kind)) {
      failures.push(`stages[${index}].weather.kind "${kind}" is not in the runtime allowlist`);
    }
  }

  // Spec checks
  if (spec) {
    if (spec.template?.primary === "symbols") {
      failures.push("template 'symbols' has been replaced by 'oracle'");
    }

    // Image assets: check declared images exist AND have size > 0
    const imageTemplates = new Set(["window", "vinyl", "route"]);
    const declaredImages = spec.assets?.images || [];
    if (imageTemplates.has(spec.template?.primary)) {
      if (declaredImages.length === 0) {
        failures.push(`${spec.template.primary} template should declare at least one image in assets.images[]`);
      }
      for (const img of declaredImages) {
        if (img.path) {
          const imgAbs = path.resolve(abs, img.path);
          if (!fs.existsSync(imgAbs)) {
            failures.push(`declared image not found: ${img.path}`);
          } else if (fs.statSync(imgAbs).size === 0) {
            failures.push(`declared image is empty (0 bytes): ${img.path}`);
          }
        }
      }
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

    // Audio-Weather Coupling
    checkAudioWeatherCoupling(spec, failures);
  }

  return { dir: abs, failures };
}

const results = dirs.map(checkDir);
console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.failures.length)) process.exit(1);
