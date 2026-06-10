import fs from "node:fs";
import path from "node:path";

const dirs = process.argv.slice(2);

if (dirs.length === 0) {
  console.error("Usage: node evaluate-vibereading-output.mjs vibereading-skill/output/<dir> [vibereading-skill/output/<dir> ...]");
  process.exit(2);
}

const requiredFiles = [
  "index.html",
  "style.css",
  "app.js",
  "space-spec.json",
  "concept-image.png",
  "bgm-meta.json"
];

const validTemplates = new Set([
  "window",
  "archive",
  "oracle",
  "instrument",
  "rehearsal",
  "vinyl",
  "labyrinth",
  "route"
]);
const validRenderingModes = new Set(["dom", "canvas-enhanced", "three-diegetic"]);
const validTopologies = new Set([
  "continuum",
  "sequence",
  "network",
  "combination",
  "spatial-composition",
  "branching-path",
  "cyclical"
]);
const templateTopologies = {
  window: new Set(["continuum", "cyclical"]),
  archive: new Set(["network"]),
  oracle: new Set(["combination"]),
  instrument: new Set(["continuum"]),
  rehearsal: new Set(["spatial-composition", "sequence"]),
  vinyl: new Set(["cyclical", "sequence"]),
  labyrinth: new Set(["branching-path", "cyclical"]),
  route: new Set(["sequence", "branching-path"])
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function classNames(html) {
  return new Set(
    [...html.matchAll(/class=["']([^"']+)["']/g)]
      .flatMap((m) => m[1].split(/\s+/))
      .filter(Boolean)
  );
}

function checkDir(dir) {
  const abs = path.resolve(dir);
  const result = { dir: abs, failures: [], warnings: [], metrics: {} };
  let generatedCode = "";
  let hasNoteExportAsset = false;

  for (const rel of requiredFiles) {
    if (!fs.existsSync(path.join(abs, rel))) result.failures.push(`missing ${rel}`);
  }

  const conceptPrompt = path.join(abs, "concept-prompt.md");
  if (fs.existsSync(conceptPrompt)) {
    result.failures.push("concept-prompt.md exists beside required concept-image.png; fallback should only be used when image generation is unavailable");
  }

  const htmlFile = path.join(abs, "index.html");
  const cssFile = path.join(abs, "style.css");
  const jsFile = path.join(abs, "app.js");
  const bgmMetaFile = path.join(abs, "bgm-meta.json");
  const bgmFile = path.join(abs, "assets/audio/bgm.mp3");
  let bgmMeta = null;
  if (fs.existsSync(bgmMetaFile)) {
    bgmMeta = readJson(bgmMetaFile);
    result.metrics.bgmStatus = bgmMeta.status || "";
    if (!["generated", "skipped", "failed"].includes(bgmMeta.status)) {
      result.failures.push("bgm-meta.json status must be generated, skipped, or failed");
    }
    if (bgmMeta.is_instrumental !== true) {
      result.failures.push("bgm-meta.json must declare is_instrumental: true");
    }
  }

  if (fs.existsSync(htmlFile)) {
    const html = fs.readFileSync(htmlFile, "utf8");
    const css = fs.existsSync(cssFile) ? fs.readFileSync(cssFile, "utf8") : "";
    const js = fs.existsSync(jsFile) ? fs.readFileSync(jsFile, "utf8") : "";
    const code = `${html}\n${css}\n${js}`;
    generatedCode = code;
    result.metrics.htmlBytes = Buffer.byteLength(html);
    result.metrics.cssBytes = Buffer.byteLength(css);
    result.metrics.jsBytes = Buffer.byteLength(js);
    result.metrics.classCount = classNames(html).size;

    const hasSuspiciousDiagonalStripe = /repeating-linear-gradient\(\s*9[0-9]deg/i.test(code);
    const hasRain = /\brain\b|rain-|rain_/i.test(code);
    const hasParticleRain = /rain-drop|data-particles=["']rain|class=["'][^"']*rain-drop/i.test(code);
    hasNoteExportAsset = fs.existsSync(path.join(abs, "assets/note-share-export.js"));
    const hasBgmFile = fs.existsSync(bgmFile);
    const hasBgmReference = /\.\/assets\/audio\/bgm\.mp3/.test(code);
    const hasBgmPlayCall =
      /playAudio\(\s*["']bgm["']/.test(code) ||
      /bgmAudio[\s\S]{0,160}\.play\(/i.test(code) ||
      /audioRegistry\[[\"']bgm[\"']\][\s\S]{0,160}\.play\(/i.test(code);
    const hasBgmAutoplayOnLoad =
      /BGM autoplay on page load/i.test(code) ||
      /={3,}\s*Init\s*={3,}[\s\S]{0,1200}(?:bgmAudio|audioFiles\.bgm|["']bgm["'])[\s\S]{0,320}\.play\(/i.test(code);
    const hasBgmToggle =
      /data-[^=]*bgm/i.test(code) ||
      /id=["'][^"']*bgm[^"']*["']/i.test(code) ||
      /class=["'][^"']*bgm[^"']*["']/i.test(code) ||
      /BGM|配乐|音乐/.test(code);
    const checks = {
      doctype: html.startsWith("<!DOCTYPE html>"),
      splitCss: /href=["']style\.css["']/.test(html) && !/<style\b/i.test(html),
      splitJs: /src=["']app\.js["']/.test(html) && !/<script(?![^>]*\bsrc=)/i.test(html),
      entry: /entry/.test(code),
      exploration: /exploration/.test(code),
      companion: /companion/.test(code),
      noStripeRain: !(hasRain && hasSuspiciousDiagonalStripe && !hasParticleRain)
    };

    for (const [name, ok] of Object.entries(checks)) {
      if (!ok) result.failures.push(`html check failed: ${name}`);
    }

    if (/companion-shell|stage-row|timer-card|notes-panel/.test(code)) {
      result.warnings.push("contains generic shell-like class names; visually inspect for reusable panel skeleton");
    }
    if (!hasRain && hasSuspiciousDiagonalStripe) {
      result.warnings.push("contains regular diagonal/near-vertical repeating line texture; visually inspect that it reads as material/depth, not fake rain");
    }

    if (bgmMeta?.status === "generated") {
      if (!hasBgmFile) result.failures.push("bgm-meta status generated but assets/audio/bgm.mp3 is missing");
      if (!hasBgmReference) result.failures.push("bgm-meta status generated but html does not reference ./assets/audio/bgm.mp3");
      if (!hasBgmPlayCall) result.failures.push("bgm-meta status generated but html has no detectable BGM playback call");
      if (!hasBgmToggle) result.failures.push("bgm-meta status generated but html has no detectable BGM toggle/control");
      if (hasBgmAutoplayOnLoad) result.failures.push("bgm-meta status generated but html appears to autoplay BGM before a user gesture");
    }
    if (bgmMeta && bgmMeta.status !== "generated" && hasBgmReference) {
      result.failures.push(`bgm-meta status ${bgmMeta.status} but html references ./assets/audio/bgm.mp3`);
    }
    if (!bgmMeta && hasBgmFile) {
      result.failures.push("assets/audio/bgm.mp3 exists but bgm-meta.json is missing");
    }

    for (const match of code.matchAll(/\.\/assets\/audio\/([^'")]+)/g)) {
      const audioFile = path.join(abs, "assets/audio", match[1]);
      if (!fs.existsSync(audioFile)) result.failures.push(`missing copied audio asset ${match[1]}`);
    }
  }

  const specFile = path.join(abs, "space-spec.json");
  if (fs.existsSync(specFile)) {
    const spec = readJson(specFile);
    result.metrics.template = spec.template?.primary;
    if (!validTemplates.has(result.metrics.template)) {
      result.failures.push(`space-spec template.primary must be one of ${[...validTemplates].join(", ")}`);
    }
    const implementation = spec.implementation || {};
    result.metrics.renderingMode = implementation.renderingMode || "";
    const usesThree = /\bTHREE\.|three\.module|from\s+["']three["']|imports\s*:\s*\{[^}]*["']three["']/i.test(generatedCode);
    if (!validRenderingModes.has(implementation.renderingMode)) {
      result.failures.push(`space-spec implementation.renderingMode must be one of ${[...validRenderingModes].join(", ")}`);
    }
    if (implementation.renderingMode === "three-diegetic") {
      for (const field of ["threeWorldAction", "fallback", "mobileAdaptation", "accessibility"]) {
        if (!implementation[field]) result.failures.push(`space-spec implementation.${field} is required for three-diegetic mode`);
      }
      if (!usesThree) result.failures.push("space-spec selects three-diegetic but generated code has no detectable Three.js usage");
      if (!/<button\b/i.test(generatedCode)) {
        result.warnings.push("three-diegetic output has no detectable semantic button for equivalent core actions");
      }
      if (!/prefers-reduced-motion/i.test(generatedCode)) {
        result.warnings.push("three-diegetic output has no detectable prefers-reduced-motion handling");
      }
      if (!/setPixelRatio\s*\(\s*Math\.min/i.test(generatedCode)) {
        result.warnings.push("three-diegetic output has no detectable bounded device pixel ratio");
      }
    } else if (usesThree) {
      result.failures.push(`generated code uses Three.js but space-spec implementation.renderingMode is ${implementation.renderingMode || "missing"}`);
    }
    const weatherEffect = spec.world?.weather || {};
    for (const field of ["kind", "visualBehavior", "stateResponse"]) {
      if (!weatherEffect[field]) result.failures.push(`space-spec world.weather.${field} is required`);
    }
    const weatherTerms = [
      weatherEffect.kind,
      "weather", "rain", "snow", "fog", "mist", "wind", "dust", "ash",
      "pollen", "dew", "haze", "storm", "drizzle", "天气", "雨", "雪", "雾", "风", "尘"
    ].filter(Boolean).map((term) => String(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (!new RegExp(weatherTerms.join("|"), "i").test(generatedCode)) {
      result.failures.push("generated code has no detectable visible weather implementation");
    }
    const signature = spec.experience?.signatureMechanic || {};
    const relations = spec.interaction?.relations || [];
    result.metrics.signatureTopology = signature.topology || "";
    result.metrics.relations = relations.length;
    for (const field of ["name", "topology", "playerAction", "stateMutation", "completionCondition", "companionTransformation", "antiRepetitionRule"]) {
      if (!signature[field]) result.failures.push(`space-spec experience.signatureMechanic.${field} is required`);
    }
    if (signature.topology && !validTopologies.has(signature.topology)) {
      result.failures.push(`space-spec signature topology must be one of ${[...validTopologies].join(", ")}`);
    }
    if (signature.topology && !templateTopologies[result.metrics.template]?.has(signature.topology)) {
      result.failures.push(`space-spec signature topology ${signature.topology} does not fit template ${result.metrics.template}`);
    }
    if (relations.length < 1) {
      result.failures.push("space-spec interaction.relations must include at least one cross-anchor relationship");
    }
    if (result.metrics.template === "archive" && relations.length < 2) {
      result.failures.push("archive template requires at least two evidence relationships");
    }
    if (result.metrics.template === "archive" && !/contradict|corroborat|compare|sequence|timeline|infer|矛盾|印证|对照|排序|时间线|推断/i.test(JSON.stringify({ signature, relations }))) {
      result.failures.push("archive signature mechanic must express evidence comparison, contradiction, sequencing, or inference");
    }
    result.metrics.sceneStates = spec.interaction?.states?.length || 0;
    result.metrics.stages = spec.reading?.stages?.length || 0;
    const interactionAnchors = spec.interaction?.anchors || [];
    result.metrics.interactionAnchors = interactionAnchors.length;
    const stateIds = new Set((spec.interaction?.states || []).map((state) => state.id));
    if (!["entry", "exploration", "companion"].every((id) => stateIds.has(id))) {
      result.failures.push("space-spec interaction.states must include entry, exploration, and companion");
    }
    if (result.metrics.stages < 2 || result.metrics.stages > 6) {
      result.failures.push("space-spec reading.stages must be 2-6");
    }
    if (result.metrics.interactionAnchors < 2 || result.metrics.interactionAnchors > 5) {
      result.failures.push("space-spec interaction.anchors must be 2-5");
    }
    if (!spec.world?.conceptImageRole || !spec.world?.conceptImageUse) {
      result.failures.push("space-spec world must include conceptImageRole and conceptImageUse");
    }
    const readingTools = spec.reading?.tools || [];
    result.metrics.readingTools = readingTools.length;
    if (readingTools.length < 2 || readingTools.length > 4) {
      result.failures.push("space-spec reading.tools must select 2-4 tools");
    }
    if (readingTools.includes("notes")) {
      if (!/VibeReadingNoteShare\.saveMarkdown/.test(generatedCode)) result.failures.push("notes tool selected but Markdown export call is missing");
      if (!hasNoteExportAsset && !/VibeReadingNoteShare\s*=/.test(generatedCode)) result.failures.push("notes tool selected but note export script is missing");
    }
    if (readingTools.includes("timer")) {
      if (!/pause|暂停|继续|resume|data-timer-toggle/i.test(generatedCode)) result.failures.push("timer tool selected but pause/resume control is missing");
      if (!/reset|重置|data-timer-reset/i.test(generatedCode)) result.failures.push("timer tool selected but reset control is missing");
    }
  }

  return result;
}

const results = dirs.map(checkDir);

if (results.length >= 2) {
  const [a, b] = results;
  const htmlA = fs.existsSync(path.join(a.dir, "index.html"))
    ? fs.readFileSync(path.join(a.dir, "index.html"), "utf8")
    : "";
  const htmlB = fs.existsSync(path.join(b.dir, "index.html"))
    ? fs.readFileSync(path.join(b.dir, "index.html"), "utf8")
    : "";
  const classesA = classNames(htmlA);
  const classesB = classNames(htmlB);
  const shared = [...classesA].filter((name) => classesB.has(name));
  const union = new Set([...classesA, ...classesB]);
  const classOverlap = union.size ? shared.length / union.size : 0;
  const sameTemplate = a.metrics.template && a.metrics.template === b.metrics.template;
  a.metrics.classOverlapWithNext = Number(classOverlap.toFixed(3));
  b.metrics.classOverlapWithPrev = Number(classOverlap.toFixed(3));
  if (sameTemplate) {
    a.failures.push(`same template as ${b.dir}: ${a.metrics.template}`);
    b.failures.push(`same template as ${a.dir}: ${b.metrics.template}`);
  }
  if (classOverlap > 0.42) {
    a.warnings.push(`high CSS class overlap with ${b.dir}: ${classOverlap.toFixed(3)}`);
    b.warnings.push(`high CSS class overlap with ${a.dir}: ${classOverlap.toFixed(3)}`);
  }
}

console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.failures.length)) process.exit(1);
