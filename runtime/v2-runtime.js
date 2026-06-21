(function () {
  "use strict";

  /* ── Allowed weather kinds (effects-recipes contract) ── */
  const WEATHER_ALLOWLIST = [
    "rain", "storm-rain", "fog", "snow", "wind",
    "ripple", "water", "dust", "embers", "fire",
    "signal", "paper", "stars", "leaves", "fireflies"
  ];

  /* ── Guide motion presets (one per template) ── */
  const GUIDE_MOTION_PRESETS = [
    "window-fog-clear",
    "window-rain-reveal",
    "window-light-shaft",
    "vinyl-needle-descent",
    "vinyl-groove-resonance",
    "vinyl-dust-orbit",
    "instrument-signal-lock",
    "instrument-dial-seek",
    "instrument-device-wake",
    "route-path-draw",
    "route-distant-lights",
    "route-map-wind",
    "oracle-table-reveal",
    "oracle-card-turn",
    "oracle-symbol-bloom"
  ];

  function normalizeWeatherLevel(level) {
    if (level === "off") return "off";
    if (level === "high") return "high";
    return "medium";
  }

  function createAudioController(options) {
    const bgmAudio = options.bgmAudio || null;
    const ambienceFiles = options.ambienceFiles && typeof options.ambienceFiles === "object"
      ? options.ambienceFiles
      : {};
    const createAudio = options.createAudio || ((file) => new Audio(file));
    const wait = options.wait || ((ms) => new Promise((resolve) => window.setTimeout(resolve, ms)));
    const ambienceAudios = new Map();
    let currentAmbienceKey = "";
    let currentAmbienceAudio = null;
    let bgmStarted = false;
    let bgmVolume = options.initialBgmVolume ?? 0.45;
    let ambienceVolume = options.initialAmbienceVolume ?? 0.32;
    let soundEnabled = options.initialSoundEnabled ?? true;
    let transitionId = 0;

    function getAmbienceAudio(key) {
      const ambienceKey = String(key || "").trim();
      if (!ambienceKey) return null;
      const file = ambienceFiles[ambienceKey];
      if (!file) return null;
      if (!ambienceAudios.has(ambienceKey)) {
        const audio = createAudio(file);
        audio.loop = true;
        audio.preload = "auto";
        ambienceAudios.set(ambienceKey, audio);
      }
      return ambienceAudios.get(ambienceKey);
    }

    function markSoundSource(source) {
      options.onSoundSourceChange?.(source);
    }

    function cleanupNonTarget(targetAudio) {
      ambienceAudios.forEach((audio) => {
        if (audio === targetAudio) return;
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0;
      });
    }

    async function safePlay(audio) {
      try {
        await audio.play();
        return true;
      } catch (_) {
        return false;
      }
    }

    async function fadeTo(audio, toVolume, durationMs, token) {
      if (!audio) return false;
      const fromVolume = Number.isFinite(audio.volume) ? audio.volume : 0;
      const steps = Math.max(1, Math.round(durationMs / 50));
      for (let step = 1; step <= steps; step += 1) {
        if (token !== transitionId) return false;
        const progress = step / steps;
        audio.volume = fromVolume + ((toVolume - fromVolume) * progress);
        await wait(durationMs / steps);
      }
      if (token === transitionId) audio.volume = toVolume;
      return token === transitionId;
    }

    async function playBgm() {
      if (!bgmAudio) return false;
      bgmAudio.loop = true;
      bgmAudio.volume = bgmVolume;
      if (!bgmAudio.paused && bgmStarted) return true;
      const played = await safePlay(bgmAudio);
      if (played) bgmStarted = true;
      return played;
    }

    async function switchStageAmbience(nextKey) {
      const targetKey = String(nextKey || "").trim();
      const token = ++transitionId;
      const fadeDurationMs = 2000;
      const nextAudio = targetKey ? getAmbienceAudio(targetKey) : null;
      const previousAudio = currentAmbienceAudio;
      currentAmbienceKey = targetKey;
      currentAmbienceAudio = nextAudio;

      if (!soundEnabled) {
        cleanupNonTarget(nextAudio);
        if (nextAudio && nextAudio !== previousAudio) {
          nextAudio.pause();
          nextAudio.currentTime = 0;
          nextAudio.volume = 0;
        }
        return false;
      }

      if (nextAudio) {
        nextAudio.loop = true;
        if (nextAudio !== previousAudio) {
          nextAudio.currentTime = 0;
          nextAudio.volume = 0;
        }
        if (nextAudio.paused) {
          const played = await safePlay(nextAudio);
          if (!played) {
            cleanupNonTarget(null);
            currentAmbienceAudio = null;
            if (bgmAudio && !bgmAudio.paused) {
              markSoundSource("bgm");
              return true;
            }
            markSoundSource("unavailable");
            options.onSoundUnavailable?.();
            return false;
          }
        }
      }

      const fadingAudios = Array.from(ambienceAudios.values()).filter((audio) => audio !== nextAudio && (!audio.paused || audio.volume > 0));
      if (!nextAudio) {
        await Promise.all(fadingAudios.map((audio) => fadeTo(audio, 0, fadeDurationMs, token)));
        if (token !== transitionId) return false;
        cleanupNonTarget(null);
        currentAmbienceAudio = null;
        if (bgmAudio && !bgmAudio.paused) {
          markSoundSource("bgm");
          return true;
        }
        markSoundSource("unavailable");
        options.onSoundUnavailable?.();
        return false;
      }

      const fadeInDuration = nextAudio === previousAudio ? 400 : fadeDurationMs;
      const fadeResults = await Promise.all([
        ...fadingAudios.map((audio) => fadeTo(audio, 0, fadeDurationMs, token)),
        fadeTo(nextAudio, ambienceVolume, fadeInDuration, token),
      ]);
      if (token !== transitionId || fadeResults.some((completed) => !completed)) return false;

      cleanupNonTarget(nextAudio);
      markSoundSource(bgmAudio && !bgmAudio.paused ? "bgm+ambience" : "ambience");
      return true;
    }

    async function beginSound(getCurrentStageAmbience) {
      if (!soundEnabled) return false;
      const bgmReady = await playBgm();
      const ambienceReady = await switchStageAmbience(getCurrentStageAmbience?.() || currentAmbienceKey);
      if (bgmReady || ambienceReady) {
        if (bgmReady && !currentAmbienceAudio) markSoundSource("bgm");
        return true;
      }
      markSoundSource("unavailable");
      options.onSoundUnavailable?.();
      return false;
    }

    function pauseSound() {
      transitionId += 1;
      if (bgmAudio) bgmAudio.pause();
      if (currentAmbienceAudio) currentAmbienceAudio.pause();
      cleanupNonTarget(currentAmbienceAudio);
    }

    async function setSoundEnabled(enabled, getCurrentStageAmbience) {
      soundEnabled = enabled;
      if (enabled) return beginSound(getCurrentStageAmbience);
      pauseSound();
      return false;
    }

    function setBgmVolume(volume) {
      bgmVolume = volume;
      if (bgmAudio && !bgmAudio.paused) bgmAudio.volume = volume;
      options.onBgmVolumeChange?.(volume);
    }

    function setAmbienceVolume(volume) {
      ambienceVolume = volume;
      if (currentAmbienceAudio && !currentAmbienceAudio.paused) currentAmbienceAudio.volume = volume;
      options.onAmbienceVolumeChange?.(volume);
    }

    function stopAll() {
      transitionId += 1;
      if (bgmAudio) bgmAudio.pause();
      ambienceAudios.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0;
      });
    }

    return {
      get currentAmbienceKey() { return currentAmbienceKey; },
      get currentAmbienceAudio() { return currentAmbienceAudio; },
      get bgmStarted() { return bgmStarted; },
      get soundEnabled() { return soundEnabled; },
      get ambienceAudios() { return ambienceAudios; },
      setBgmVolume,
      setAmbienceVolume,
      playBgm,
      switchStageAmbience,
      beginSound,
      pauseSound,
      setSoundEnabled,
      stopAll,
    };
  }

  /* ──────────────────────────────────────────────────────────
     FRAME CLOCK — unified dt source, second-precision
     ────────────────────────────────────────────────────────── */
  function createFrameClock() {
    let lastTime = 0, _dt = 0, paused = false;
    return {
      get dt() { return _dt; },
      update(now) {
        if (paused) { _dt = 0; return; }
        const raw = lastTime > 0 ? (now - lastTime) / 1000 : 0;
        _dt = Math.min(0.05, Math.max(0, raw));
        lastTime = now;
      },
      reset() { lastTime = 0; _dt = 0; },
      pause() { paused = true; _dt = 0; },
      resume() { paused = false; lastTime = 0; }
    };
  }

  /* ──────────────────────────────────────────────────────────
     POINTER TRACKER — smooth coordinates, velocity, idle
     ────────────────────────────────────────────────────────── */
  function createPointerTracker() {
    const s = {
      rawX: null, rawY: null, x: null, y: null,
      vx: 0, vy: 0, speed: 0,
      active: false, idleTime: 999,
      bounds: { left: 0, top: 0 }
    };
    let bound = false, unbindFn = null;
    function bind(target) {
      if (bound) return;
      bound = true;
      const on = (e) => { s.rawX = e.clientX; s.rawY = e.clientY; s.active = true; s.idleTime = 0; };
      const off = () => { s.active = false; };
      target.addEventListener("mousemove", on, { passive: true });
      target.addEventListener("pointerleave", off, { passive: true });
      target.addEventListener("blur", off, { passive: true });
      unbindFn = () => {
        target.removeEventListener("mousemove", on);
        target.removeEventListener("pointerleave", off);
        target.removeEventListener("blur", off);
        bound = false;
      };
    }
    function update(dt) {
      s.idleTime += dt;
      if (s.rawX == null || s.rawY == null) {
        s.vx *= 0.9; s.vy *= 0.9; s.speed *= 0.9; return;
      }
      const nx = s.rawX - s.bounds.left;
      const ny = s.rawY - s.bounds.top;
      if (s.x == null) { s.x = nx; s.y = ny; return; }
      const dx = nx - s.x, dy = ny - s.y;
      const d = Math.hypot(dx, dy);
      if (d > 160) { const r = 160 / d; s.x += dx * r; s.y += dy * r; }
      else { s.x += dx * 0.18; s.y += dy * 0.18; }
      const tvx = dt > 1e-6 ? dx / dt : 0;
      const tvy = dt > 1e-6 ? dy / dt : 0;
      s.vx = s.vx * 0.8 + tvx * 0.2;
      s.vy = s.vy * 0.8 + tvy * 0.2;
      s.speed = Math.hypot(s.vx, s.vy);
    }
    function updateBounds(b) { s.bounds = b; }
    function destroy() { if (unbindFn) unbindFn(); }
    return { state: s, bind, updateBounds, update, destroy };
  }

  /* ──────────────────────────────────────────────────────────
     POINTER FIELD — force application for weather effects
     ────────────────────────────────────────────────────────── */
  function smoothFalloff(dist, radius) {
    const t = Math.max(0, Math.min(1, 1 - dist / radius));
    return t * t * (3 - 2 * t);
  }
  function applyPointerField(particle, tracker, cfg) {
    const ps = tracker.state;
    if (!ps.active || ps.x == null || ps.idleTime > (cfg.idleCutoff || 0.1)) return null;
    const dx = ps.x - particle.x, dy = ps.y - particle.y;
    const dist = Math.hypot(dx, dy) || 1e-4;
    const radius = cfg.radius || 120;
    if (dist >= radius) return null;
    const k = smoothFalloff(dist, radius) * (cfg.strength || 1);
    const nx = dx / dist, ny = dy / dist;
    switch (cfg.mode) {
      case "attract": particle.vx += nx * k; particle.vy += ny * k; break;
      case "repel": particle.vx -= nx * k; particle.vy -= ny * k; break;
      case "orbit": particle.vx += -ny * k * 0.8; particle.vy += nx * k * 0.8; break;
      case "bend": particle.vx += ps.vx * 0.0005 * k; particle.vy += ps.vy * 0.0005 * k; break;
      case "scatter":
        particle.vx -= nx * k * (1 + Math.min(ps.speed / 1200, 1));
        particle.vy -= ny * k * (1 + Math.min(ps.speed / 1200, 1));
        break;
      case "illuminate": particle.pointerGlow = Math.max(particle.pointerGlow || 0, k); break;
      case "dissolve": particle.pointerErase = Math.max(particle.pointerErase || 0, k); break;
      case "spawn-ripple": return { type: "ripple", x: ps.x, y: ps.y, power: k };
    }
    return null;
  }

  /* ──────────────────────────────────────────────────────────
     PARTICLE POOL — fixed-capacity pre-allocated pool
     ────────────────────────────────────────────────────────── */
  function createParticlePool(maxSize) {
    const items = [], free = [];
    for (let i = 0; i < maxSize; i++) { items.push({ active: false }); free.push(i); }
    return {
      spawn(init) {
        if (!free.length) return null;
        const i = free.pop(), p = items[i];
        p.active = true; p._i = i; init(p); return p;
      },
      deactivate(p) { if (p && p.active) { p.active = false; free.push(p._i); } },
      forEach(fn) { for (let i = 0; i < items.length; i++) { if (items[i].active) fn(items[i], i); } },
      count() { return items.length - free.length; },
      clear() {
        for (const p of items) p.active = false;
        free.length = 0;
        for (let i = 0; i < maxSize; i++) free.push(i);
      }
    };
  }

  /* ──────────────────────────────────────────────────────────
     GRADIENT SPRITE CACHE — cached radial gradients
     ────────────────────────────────────────────────────────── */
  function createGradientSpriteCache(p) {
    const cache = new Map();
    const MAX = 64;
    function makeKey(o) {
      return [
        Math.round(o.radius), (o.color || [255, 255, 255]).join(","),
        o.shape || "r", o.innerStop || 0, o.midStop || 0.45, o.outerStop || 1
      ].join(":");
    }
    function radial(o) {
      const k = makeKey(o);
      if (cache.has(k)) return cache.get(k);
      if (cache.size >= MAX) {
        const fk = cache.keys().next().value;
        const old = cache.get(fk);
        if (old && old.remove) old.remove();
        cache.delete(fk);
      }
      const {
        radius = 64, color = [255, 255, 255], alpha = 1,
        innerStop = 0, midStop = 0.45, outerStop = 1,
        innerAlpha = 1, midAlpha = 0.18, outerAlpha = 0,
        blur = 0, shape = "r"
      } = o;
      const pad = blur * 2;
      const size = Math.ceil(radius * 2 + pad * 2);
      const pg = p.createGraphics(size, size);
      const ctx = pg.drawingContext;
      pg.clear();
      if (blur > 0) try { ctx.filter = "blur(" + blur + "px)"; } catch (e) { /* ignore */ }
      const cx = size / 2, cy = size / 2;
      const g = ctx.createRadialGradient(cx, cy, radius * innerStop, cx, cy, radius * outerStop);
      const cr = color[0], cg = color[1], cb = color[2];
      g.addColorStop(0, "rgba(" + cr + "," + cg + "," + cb + "," + (innerAlpha * alpha) + ")");
      g.addColorStop(Math.min(0.999, midStop), "rgba(" + cr + "," + cg + "," + cb + "," + (midAlpha * alpha) + ")");
      g.addColorStop(1, "rgba(" + cr + "," + cg + "," + cb + "," + (outerAlpha * alpha) + ")");
      ctx.fillStyle = g;
      ctx.beginPath();
      if (shape === "e") ctx.ellipse(cx, cy, radius, radius * 0.6, 0, 0, Math.PI * 2);
      else ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      try { ctx.filter = "none"; } catch (e) { /* ignore */ }
      cache.set(k, pg);
      return pg;
    }
    function draw(sprite, x, y, w, h, mode, alpha) {
      if (!sprite) return;
      const ctx = p.drawingContext;
      ctx.save();
      ctx.globalCompositeOperation = mode || "source-over";
      ctx.globalAlpha = (alpha != null ? alpha : 255) / 255;
      p.image(sprite, x - w / 2, y - h / 2, w, h != null ? h : w);
      ctx.restore();
    }
    function destroy() {
      cache.forEach(function (pg) { if (pg && pg.remove) pg.remove(); });
      cache.clear();
    }
    return { radial, draw, destroy, get size() { return cache.size; } };
  }

  /* ── Mouse glow using gradient sprite ── */
  function drawMouseGlow(p, tracker, cache) {
    if (!tracker || !cache) return;
    const s = tracker.state;
    if (!s.active || s.x == null || s.y == null) return;
    const idleFade = Math.max(0, 1 - s.idleTime * 0.6);
    if (idleFade <= 0) return;
    const sz = Math.min(p.width, p.height) * 0.18;
    const sprite = cache.radial({
      radius: 64, color: [255, 240, 200], alpha: 0.09 * idleFade,
      midAlpha: 0.025, midStop: 0.5, outerAlpha: 0
    });
    cache.draw(sprite, s.x, s.y, sz, sz, "screen", 255);
  }

  /* ──────────────────────────────────────────────────────────
     INTENSITY PROFILES — per-weather medium/high semantics
     ────────────────────────────────────────────────────────── */
  const INTENSITY_PROFILES = {
    rain: {
      off: { spawnScale: 0, gust: 0, impacts: 0, nearWeight: 0, glare: 0, turbulence: 0, pointerStrength: 0 },
      medium: { spawnScale: 1, gust: 0.8, impacts: 0.6, nearWeight: 0.8, glare: 0.25, turbulence: 0.5, pointerStrength: 0.6 },
      high: { spawnScale: 1.2, gust: 1.4, impacts: 1.0, nearWeight: 1.3, glare: 0.6, turbulence: 0.8, pointerStrength: 0.8 }
    },
    "storm-rain": {
      off: { spawnScale: 0, gust: 0, impacts: 0, nearWeight: 0, glare: 0, turbulence: 0, pointerStrength: 0 },
      medium: { spawnScale: 1.3, gust: 1.5, impacts: 0.8, nearWeight: 1.0, glare: 0.35, turbulence: 0.7, pointerStrength: 0.5 },
      high: { spawnScale: 1.6, gust: 2.2, impacts: 1.2, nearWeight: 1.5, glare: 0.7, turbulence: 1.0, pointerStrength: 0.6 }
    },
    fog: {
      off: { coverage: 0, speed: 0, parallax: 0, erase: 0, turbulence: 0, pointerStrength: 0 },
      medium: { coverage: 0.55, speed: 0.8, parallax: 1.0, erase: 0.35, turbulence: 0.3, pointerStrength: 0.4 },
      high: { coverage: 0.78, speed: 1.0, parallax: 1.25, erase: 0.55, turbulence: 0.5, pointerStrength: 0.55 }
    },
    snow: {
      off: { spawnScale: 0, flowAmp: 0, pointer: 0, nearWeight: 0, swirl: 0, turbulence: 0 },
      medium: { spawnScale: 1, flowAmp: 0.8, pointer: 0.55, nearWeight: 0.8, swirl: 0.25, turbulence: 0.3 },
      high: { spawnScale: 1.15, flowAmp: 1.2, pointer: 0.8, nearWeight: 1.1, swirl: 0.55, turbulence: 0.5 }
    },
    wind: {
      off: { spawnScale: 0, gustAmp: 0, pointerStrength: 0, turbulence: 0 },
      medium: { spawnScale: 1, gustAmp: 0.8, pointerStrength: 0.6, turbulence: 0.4 },
      high: { spawnScale: 1.2, gustAmp: 1.3, pointerStrength: 0.8, turbulence: 0.7 }
    },
    ripple: {
      off: { spawnScale: 0, pointerStrength: 0, eventRate: 0 },
      medium: { spawnScale: 1, pointerStrength: 0.5, eventRate: 0.6 },
      high: { spawnScale: 1.1, pointerStrength: 0.7, eventRate: 1.0 }
    },
    water: {
      off: { spawnScale: 0, pointerStrength: 0, turbulence: 0 },
      medium: { spawnScale: 1, pointerStrength: 0.4, turbulence: 0.3 },
      high: { spawnScale: 1.1, pointerStrength: 0.6, turbulence: 0.5 }
    },
    dust: {
      off: { spawnScale: 0, pointerStrength: 0, visibility: 0, turbulence: 0 },
      medium: { spawnScale: 1, pointerStrength: 0.3, visibility: 0.6, turbulence: 0.3 },
      high: { spawnScale: 1.15, pointerStrength: 0.5, visibility: 0.8, turbulence: 0.5 }
    },
    embers: {
      off: { spawnScale: 0, pointerStrength: 0, reignite: 0, turbulence: 0 },
      medium: { spawnScale: 1, pointerStrength: 0.3, reignite: 0.15, turbulence: 0.4 },
      high: { spawnScale: 1.2, pointerStrength: 0.4, reignite: 0.3, turbulence: 0.6 }
    },
    fire: {
      off: { spawnScale: 0, pointerStrength: 0, height: 0, turbulence: 0, emberBurst: 0 },
      medium: { spawnScale: 1, pointerStrength: 0.3, height: 1, turbulence: 0.5, emberBurst: 0.2 },
      high: { spawnScale: 1.15, pointerStrength: 0.4, height: 1.3, turbulence: 0.8, emberBurst: 0.5 }
    },
    signal: {
      off: { spawnScale: 0, noiseBurst: 0, stability: 0 },
      medium: { spawnScale: 1, noiseBurst: 0.3, stability: 0.7 },
      high: { spawnScale: 1.1, noiseBurst: 0.6, stability: 0.4 }
    },
    paper: {
      off: { spawnScale: 0, pointerStrength: 0, tumble: 0, turbulence: 0 },
      medium: { spawnScale: 1, pointerStrength: 0.5, tumble: 0.6, turbulence: 0.3 },
      high: { spawnScale: 1.15, pointerStrength: 0.7, tumble: 0.9, turbulence: 0.5 }
    },
    stars: {
      off: { spawnScale: 0, twinkle: 0, flareChance: 0, pointerStrength: 0 },
      medium: { spawnScale: 1, twinkle: 0.6, flareChance: 0.08, pointerStrength: 0.2 },
      high: { spawnScale: 1.1, twinkle: 0.8, flareChance: 0.15, pointerStrength: 0.3 }
    },
    leaves: {
      off: { spawnScale: 0, pointerStrength: 0, gustAmp: 0, tumble: 0 },
      medium: { spawnScale: 1, pointerStrength: 0.5, gustAmp: 0.7, tumble: 0.6 },
      high: { spawnScale: 1.15, pointerStrength: 0.7, gustAmp: 1.1, tumble: 0.9 }
    },
    fireflies: {
      off: { spawnScale: 0, pointerStrength: 0, flockWeight: 0, breathe: 0 },
      medium: { spawnScale: 1, pointerStrength: 0.4, flockWeight: 0.3, breathe: 0.6 },
      high: { spawnScale: 1.1, pointerStrength: 0.55, flockWeight: 0.5, breathe: 0.8 }
    }
  };
  function getIntensityProfile(kind, level) {
    const p = INTENSITY_PROFILES[kind] || INTENSITY_PROFILES.dust;
    return p[level] || p.medium;
  }

  function init() {
    const spec = window.VIBE_READING_SPEC;
    if (!spec) {
      console.error("VIBE_READING_SPEC must be defined by app.js before v2-runtime.js");
      return;
    }

    const root = document.documentElement;
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));
    const templateId = String(spec.template?.primary || "window").toLowerCase();

    /* ── Audio state (separate BGM and ambience volumes) ── */
    const bgmAudio = spec.audio?.bgmFile ? new Audio(spec.audio.bgmFile) : null;
    const audioController = createAudioController({
      bgmAudio,
      ambienceFiles: spec.audio?.ambienceFiles,
      initialBgmVolume: 0.45,
      initialAmbienceVolume: 0.32,
      initialSoundEnabled: true,
      onSoundSourceChange(source) {
        root.dataset.vrSoundSource = source;
      },
      onBgmVolumeChange(volume) {
        root.dataset.vrBgmVolume = String(volume);
        window.dispatchEvent(new CustomEvent("vibereading:bgm-volume", { detail: { volume } }));
      },
      onAmbienceVolumeChange(volume) {
        root.dataset.vrAmbienceVolume = String(volume);
        window.dispatchEvent(new CustomEvent("vibereading:ambience-volume", { detail: { volume } }));
      },
      onSoundUnavailable() {
        window.dispatchEvent(new CustomEvent("vibereading:sound-unavailable"));
      }
    });
    let weatherLevel = normalizeWeatherLevel(spec.weather?.defaultLevel);

    /* ── Guide ── */
    const fallbackGuideSteps = [
      { id: "settle", text: "先别急着翻页，让声音和天气慢慢抵达。", emphasis: "缓缓吸气，停留片刻。" },
      { id: "orient", text: "这里不提供答案，只陪你进入这本书。", emphasis: "暂时放下判断。" },
      { id: "begin", text: "当眼前安静下来，就从此刻开始阅读。", emphasis: "需要时，再打开陪伴控件。" }
    ];
    const guideSteps = spec.entryGuide?.steps?.length ? spec.entryGuide.steps : fallbackGuideSteps;
    const stages = spec.stages || [];
    const uiLanguage = spec.bookDirection?.uiLanguage || spec.book?.uiLanguage || "zh-CN";
    const isChinese = /^(zh|chinese|中文)/i.test(uiLanguage);
    const bookTitle = $("[data-vr-book-title]");
    if (bookTitle) bookTitle.textContent = spec.book?.title || (isChinese ? "开始阅读" : "Start Reading");
    root.dataset.vrTemplate = templateId;

    /* Resolve guide motion preset — map old names to new ones */
    const OLD_PRESET_MAP = {
      "vinyl-groove-orbit": "vinyl-groove-resonance",
      "instrument-scan-lock": "instrument-signal-lock",
      "route-path-light": "route-path-draw",
      "oracle-card-reveal": "oracle-table-reveal"
    };
    const rawMotion = String(spec.entryGuide?.motion || spec.entryGuide?.layout || templateId).toLowerCase();
    let guideMotion = GUIDE_MOTION_PRESETS.find((p) => rawMotion.includes(p.split("-")[0])) || rawMotion;
    if (OLD_PRESET_MAP[guideMotion]) guideMotion = OLD_PRESET_MAP[guideMotion];
    root.dataset.vrGuideMotion = guideMotion;

    let guideTimers = [];
    let guideIndex = 0;
    let timerRunning = false;
    let timerSeconds = 0;
    let timerInterval = null;
    let timerKind = "elapsed";
    let weatherEngine = null;
    let guideArtEngine = null;
    let activeStageIndex = 0;
    const stageWeatherLevels = new Map();

    /* ── Helpers ── */
    function escapeHtml(value) {
      return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function splitGuideLines(value) {
      const text = String(value || "").trim();
      const lines = text.split(/(?<=[。！？；.!?;])\s*/).map((l) => l.trim()).filter(Boolean);
      if (lines.length > 1) return lines.slice(0, 3);
      if (text.length <= 18) return [text];
      const mid = Math.ceil(text.length / 2);
      const splitAt = text.lastIndexOf("，", mid) > 4 ? text.lastIndexOf("，", mid) + 1 : mid;
      return [text.slice(0, splitAt).trim(), text.slice(splitAt).trim()].filter(Boolean);
    }

    function formatTime(seconds) {
      const s = Math.max(0, seconds);
      return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    }

    /* ── Weather kind normalization ── */
    function normalizeWeatherKind(description) {
      const v = String(description).toLowerCase();
      if (/storm|暴/.test(v)) return "storm-rain";
      if (/雨|rain|drizzle/.test(v)) return "rain";
      if (/雪|snow/.test(v)) return "snow";
      if (/雾|mist|fog|haze/.test(v)) return "fog";
      if (/风|wind/.test(v)) return "wind";
      if (/ripple|涟漪|波纹/.test(v)) return "ripple";
      if (/water|水面|水/.test(v)) return "water";
      if (/ember|余烬|火星/.test(v)) return "embers";
      if (/fire|火|壁炉/.test(v)) return "fire";
      if (/signal|信号|扫描|scan/.test(v)) return "signal";
      if (/paper|纸|纤维/.test(v)) return "paper";
      if (/star|星|星空/.test(v)) return "stars";
      if (/leaf|落叶|叶/.test(v)) return "leaves";
      if (/firefly|萤火|萤/.test(v)) return "fireflies";
      if (/dust|尘/.test(v)) return "dust";
      // Fallback: try to match allowlist
      for (const kind of WEATHER_ALLOWLIST) {
        if (v.includes(kind)) return kind;
      }
      return "dust";
    }

    function stageWeatherDescription(stage) {
      const w = stage?.weather;
      if (w && typeof w === "object") return w.kind || w.label || w.type || w.texture || "";
      return w || "";
    }

    function stageDefaultWeatherLevel(stage) {
      const w = stage?.weather;
      if (w && typeof w === "object" && w.defaultLevel) return w.defaultLevel;
      return normalizeWeatherLevel(stage?.weatherLevel || spec.weather?.defaultLevel);
    }

    function ensureGuideLayer(attributeName, className) {
      let node = $(`[${attributeName}]`);
      if (node) return node;
      const guide = $("[data-vr-guide]");
      if (!guide) return null;
      node = document.createElement("div");
      node.setAttribute(attributeName, "");
      node.className = className;
      node.setAttribute("aria-hidden", "true");
      guide.insertBefore(node, guide.firstChild);
      return node;
    }

    /* ──────────────────────────────────────────────────────────
       P5 EFFECT PRESETS — one per weather kind
       ────────────────────────────────────────────────────────── */
    const VIBE_EFFECTS = {
      rain: {
        count: 160, color: [210, 225, 235], gravity: 7.5,
        setup(p) {
          p._rainSplashes = createParticlePool(80);
          p._rainRipples = createParticlePool(40);
          p._rainGustPhase = Math.random() * 1000;
        },
        initParticle(w, h) {
          const r = Math.random();
          const depth = r < 0.4 ? 0.45 : r < 0.85 ? 1.0 : 1.4;
          return {
            x: Math.random() * w, y: Math.random() * h,
            vx: (-0.35 - Math.random() * 0.45) * depth,
            vy: (8 + Math.random() * 8) * depth,
            size: depth, depth, life: Math.random() * 100,
            len: 0, active: true
          };
        },
        drawAll(p, particles, effect, reduceMotion, dt) {
          const [cr, cg, cb] = effect.color;
          const lvl = normalizeWeatherLevel(root.dataset.vrWeatherLevel);
          const profile = getIntensityProfile("rain", lvl);
          /* Update splash physics */
          const splash = p._rainSplashes;
          if (splash) splash.forEach(function (s) {
            s.vy += 0.12; s.x += s.vx; s.y += s.vy;
            s.life -= dt;
            if (s.life <= 0) splash.deactivate(s);
          });
          /* Update ripple lifecycle */
          const ripples = p._rainRipples;
          if (ripples) ripples.forEach(function (r) {
            r.life += dt;
            if (r.life > r.maxLife) ripples.deactivate(r);
          });
          /* Update drop physics */
          if (!reduceMotion) {
            p._rainGustPhase = (p._rainGustPhase || 0) + 0.006;
            const gustX = Math.sin(p._rainGustPhase) * 0.4 * profile.gust;
            for (let i = 0; i < particles.length; i++) {
              const d = particles[i];
              if (!d.active) continue;
              applyPointerField(d, p._pointer, { mode: "bend", radius: 140, strength: 0.6 * profile.pointerStrength, idleCutoff: 0.1 });
              d.vx += gustX * 0.02;
              d.vy += 0.10;
              d.x += d.vx;
              d.y += d.vy;
              d.len = d.vy * (0.9 + d.depth * 0.55);
              if (d.y >= p.height - 10) {
                const x = d.x;
                if (splash && Math.random() < profile.impacts) {
                  for (let b = 0; b < 2 + (Math.random() < 0.5 ? 1 : 0); b++) {
                    splash.spawn(function (s) {
                      s.x = x; s.y = p.height - 10;
                      s.vx = (Math.random() - 0.5) * 1.8;
                      s.vy = -(1.2 + Math.random() * 1.5);
                      s.life = 0.25 + Math.random() * 0.28;
                      s.maxLife = s.life;
                      s.size = 1 + Math.random() * 1.3;
                    });
                  }
                  if (ripples) ripples.spawn(function (r) {
                    r.x = x; r.y = p.height - 10;
                    r.life = 0; r.maxLife = 0.9 + Math.random() * 0.6;
                    r.rx = 6 + Math.random() * 8;
                    r.ry = r.rx * 0.28;
                  });
                }
                d.x = Math.random() * p.width;
                d.y = -20 - Math.random() * p.height * 0.25;
                d.vx = (-0.35 - Math.random() * 0.45) * d.depth;
                d.vy = (8 + Math.random() * 8) * d.depth;
              }
              if (d.y > p.height + 20 || d.x < -40 || d.x > p.width + 40) {
                d.x = Math.random() * p.width;
                d.y = -20 - Math.random() * p.height * 0.25;
              }
            }
          }
          /* Draw drops by depth layer */
          for (let i = 0; i < particles.length; i++) {
            const d = particles[i];
            if (!d.active) continue;
            const a = d.depth > 1.2 ? 110 : d.depth < 0.7 ? 42 : 72;
            const w = d.depth > 1.2 ? 1.5 : 0.8;
            p.stroke(cr, cg, cb, a);
            p.strokeWeight(w);
            p.line(d.x, d.y, d.x + d.vx * 1.6, d.y + d.len);
          }
          /* Draw splash beads */
          p.noStroke();
          if (splash) splash.forEach(function (s) {
            const a = Math.min(1, s.life * 3) * 180;
            const sz = s.size * (0.6 + (1 - s.life / s.maxLife) * 0.4) * 10;
            p.fill(cr, cg, cb, a * 0.5);
            p.circle(s.x, s.y, sz);
          });
          /* Draw elliptical ripples */
          p.noFill();
          p.strokeWeight(0.9);
          if (ripples) ripples.forEach(function (r) {
            const t = r.life / r.maxLife;
            const e = 1 - (1 - t) * (1 - t); /* easeOut */
            const rx = r.rx + e * 16;
            const ry = r.ry + e * 5;
            p.stroke(cr, cg, cb, (1 - t) * 90);
            p.ellipse(r.x, r.y, rx * 2, ry * 2);
          });
          /* Surface glare for high */
          if (profile.glare > 0 && !reduceMotion) {
            const ctx = p.drawingContext;
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            p.noStroke();
            p.fill(220, 230, 240, 12 * profile.glare);
            p.rect(0, p.height - 26, p.width, 26);
            ctx.restore();
          }
        },
        tick(particle, p, reduceMotion) {
          if (reduceMotion) return;
          const lvl = normalizeWeatherLevel(root.dataset.vrWeatherLevel);
          const profile = getIntensityProfile("rain", lvl);
          /* Gust field — low-frequency wind */
          p._rainGustPhase = (p._rainGustPhase || 0) + 0.006;
          const gustX = Math.sin(p._rainGustPhase) * 0.4 * profile.gust;
          const gustY = Math.cos(p._rainGustPhase * 0.7) * 0.1;
          /* Pointer bend */
          applyPointerField(particle, p._pointer, {
            mode: "bend", radius: 140, strength: 0.6 * profile.pointerStrength, idleCutoff: 0.1
          });
          /* Physics */
          particle.vx += gustX * 0.02;
          particle.vy += 0.10 + gustY;
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.len = particle.vy * (0.9 + particle.depth * 0.55);
          /* Ground impact */
          if (particle.y >= p.height - 10) {
            const x = particle.x;
            const y = p.height - 10;
            if (Math.random() < profile.impacts) {
              /* Spawn splash beads */
              const splash = p._rainSplashes;
              if (splash) {
                const beadCount = 2 + (Math.random() < 0.5 ? 1 : 0);
                for (let b = 0; b < beadCount; b++) {
                  splash.spawn(function (s) {
                    s.x = x; s.y = y;
                    s.vx = (Math.random() - 0.5) * 1.8;
                    s.vy = -(1.2 + Math.random() * 1.5);
                    s.life = 0.25 + Math.random() * 0.28;
                    s.maxLife = s.life;
                    s.size = 1 + Math.random() * 1.3;
                  });
                }
              }
              /* Spawn elliptical ripple */
              const ripples = p._rainRipples;
              if (ripples) ripples.spawn(function (r) {
                r.x = x; r.y = y;
                r.life = 0; r.maxLife = 0.9 + Math.random() * 0.6;
                r.rx = 6 + Math.random() * 8;
                r.ry = r.rx * 0.28;
              });
            }
            /* Respawn drop at top */
            particle.x = Math.random() * p.width;
            particle.y = -20 - Math.random() * p.height * 0.25;
            particle.vx = (-0.35 - Math.random() * 0.45) * particle.depth;
            particle.vy = (8 + Math.random() * 8) * particle.depth;
          }
          /* Off-screen respawn */
          if (particle.y > p.height + 20 || particle.x < -40 || particle.x > p.width + 40) {
            particle.x = Math.random() * p.width;
            particle.y = -20 - Math.random() * p.height * 0.25;
          }
        },
        draw(p, particle, profile) { /* drawAll handles rendering */ },
      },

      "storm-rain": {
        count: 200, color: [180, 195, 210], gravity: 9.5, windX: -2.5,
        setup(p) {
          p._rainSplashes = createParticlePool(100);
          p._rainRipples = createParticlePool(50);
          p._rainGustPhase = Math.random() * 1000;
          p._stormPulseTime = 0;
          p._stormPulseActive = false;
        },
        initParticle(w, h) {
          const r = Math.random();
          const depth = r < 0.35 ? 0.45 : r < 0.8 ? 1.0 : 1.5;
          return {
            x: Math.random() * w, y: Math.random() * h,
            vx: (-2.5 - Math.random() * 1.2) * depth,
            vy: (9 + Math.random() * 7) * depth,
            size: depth, depth, life: Math.random() * 100,
            len: 0, active: true
          };
        },
        drawAll(p, particles, effect, reduceMotion, dt) {
          const [cr, cg, cb] = effect.color;
          const lvl = normalizeWeatherLevel(root.dataset.vrWeatherLevel);
          const profile = getIntensityProfile("storm-rain", lvl);
          /* Update splash physics */
          const splash = p._rainSplashes;
          if (splash) splash.forEach(function (s) {
            s.vy += 0.14; s.x += s.vx; s.y += s.vy;
            s.life -= dt;
            if (s.life <= 0) splash.deactivate(s);
          });
          /* Update ripple lifecycle */
          const ripples = p._rainRipples;
          if (ripples) ripples.forEach(function (r) {
            r.life += dt;
            if (r.life > r.maxLife) ripples.deactivate(r);
          });
          /* Update drop physics */
          if (!reduceMotion) {
            p._rainGustPhase = (p._rainGustPhase || 0) + 0.008;
            const gustX = Math.sin(p._rainGustPhase) * 0.7 * profile.gust;
            for (let i = 0; i < particles.length; i++) {
              const d = particles[i];
              if (!d.active) continue;
              applyPointerField(d, p._pointer, { mode: "bend", radius: 140, strength: 0.5 * profile.pointerStrength, idleCutoff: 0.1 });
              d.vx += gustX * 0.03;
              d.vy += 0.14;
              d.x += d.vx;
              d.y += d.vy;
              d.len = d.vy * (0.9 + d.depth * 0.6);
              if (d.y >= p.height - 10) {
                const x = d.x;
                if (splash && Math.random() < profile.impacts) {
                  for (let b = 0; b < 2 + (Math.random() < 0.6 ? 1 : 0); b++) {
                    splash.spawn(function (s) {
                      s.x = x; s.y = p.height - 10;
                      s.vx = (Math.random() - 0.5) * 2.2;
                      s.vy = -(1.5 + Math.random() * 1.8);
                      s.life = 0.2 + Math.random() * 0.25;
                      s.maxLife = s.life;
                      s.size = 1 + Math.random() * 1.5;
                    });
                  }
                  if (ripples) ripples.spawn(function (r) {
                    r.x = x; r.y = p.height - 10;
                    r.life = 0; r.maxLife = 0.8 + Math.random() * 0.5;
                    r.rx = 8 + Math.random() * 10;
                    r.ry = r.rx * 0.25;
                  });
                }
                d.x = Math.random() * p.width;
                d.y = -20 - Math.random() * p.height * 0.3;
                d.vx = (-2.5 - Math.random() * 1.2) * d.depth;
                d.vy = (9 + Math.random() * 7) * d.depth;
              }
              if (d.y > p.height + 20 || d.x < -60) {
                d.x = Math.random() * p.width;
                d.y = -20 - Math.random() * p.height * 0.3;
              }
            }
          }
          /* Draw drops */
          for (let i = 0; i < particles.length; i++) {
            const d = particles[i];
            if (!d.active) continue;
            const a = d.depth > 1.2 ? 100 : d.depth < 0.7 ? 38 : 68;
            const w = d.depth > 1.2 ? 1.8 : 0.9;
            p.stroke(cr, cg, cb, a);
            p.strokeWeight(w);
            p.line(d.x, d.y, d.x + d.vx * 2.2, d.y + d.len * 1.2);
          }
          /* Draw splashes */
          p.noStroke();
          if (splash) splash.forEach(function (s) {
            const a = Math.min(1, s.life * 3) * 160;
            const sz = s.size * (0.6 + (1 - s.life / s.maxLife) * 0.4) * 12;
            p.fill(cr, cg, cb, a * 0.5);
            p.circle(s.x, s.y, sz);
          });
          /* Draw ripples */
          p.noFill();
          p.strokeWeight(1.0);
          if (ripples) ripples.forEach(function (r) {
            const t = r.life / r.maxLife;
            const e = 1 - (1 - t) * (1 - t);
            const rx = r.rx + e * 18;
            const ry = r.ry + e * 6;
            p.stroke(cr, cg, cb, (1 - t) * 80);
            p.ellipse(r.x, r.y, rx * 2, ry * 2);
          });
          /* Ambient brightness pulse (every 8-20s, 1-3 frames) */
          if (!reduceMotion && profile.glare > 0.3) {
            p._stormPulseTime = (p._stormPulseTime || 0) + dt;
            if (p._stormPulseTime > 8 + Math.random() * 12) {
              p._stormPulseActive = true;
              p._stormPulseTime = 0;
              p._stormPulseFrames = 0;
            }
            if (p._stormPulseActive) {
              p._stormPulseFrames = (p._stormPulseFrames || 0) + 1;
              const pulseA = Math.max(0, 1 - p._stormPulseFrames / 3) * 15 * profile.glare;
              const ctx = p.drawingContext;
              ctx.save();
              ctx.globalCompositeOperation = "screen";
              p.noStroke();
              p.fill(200, 210, 230, pulseA);
              p.rect(0, 0, p.width, p.height);
              ctx.restore();
              if (p._stormPulseFrames > 3) p._stormPulseActive = false;
            }
          }
          /* Surface glare */
          if (profile.glare > 0) {
            const ctx = p.drawingContext;
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            p.noStroke();
            p.fill(200, 215, 235, 15 * profile.glare);
            p.rect(0, p.height - 30, p.width, 30);
            ctx.restore();
          }
        },
        tick(particle, p, reduceMotion) {
          if (reduceMotion) return;
          const lvl = normalizeWeatherLevel(root.dataset.vrWeatherLevel);
          const profile = getIntensityProfile("storm-rain", lvl);
          /* Stronger gust */
          p._rainGustPhase = (p._rainGustPhase || 0) + 0.008;
          const gustX = Math.sin(p._rainGustPhase) * 0.7 * profile.gust;
          /* Pointer bend */
          applyPointerField(particle, p._pointer, {
            mode: "bend", radius: 140, strength: 0.5 * profile.pointerStrength, idleCutoff: 0.1
          });
          /* Physics */
          particle.vx += gustX * 0.03;
          particle.vy += 0.14;
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.len = particle.vy * (0.9 + particle.depth * 0.6);
          /* Ground impact */
          if (particle.y >= p.height - 10) {
            const x = particle.x;
            const splash = p._rainSplashes;
            const ripples = p._rainRipples;
            if (Math.random() < profile.impacts) {
              if (splash) {
                const beadCount = 2 + (Math.random() < 0.6 ? 1 : 0);
                for (let b = 0; b < beadCount; b++) {
                  splash.spawn(function (s) {
                    s.x = x; s.y = p.height - 10;
                    s.vx = (Math.random() - 0.5) * 2.2;
                    s.vy = -(1.5 + Math.random() * 1.8);
                    s.life = 0.2 + Math.random() * 0.25;
                    s.maxLife = s.life;
                    s.size = 1 + Math.random() * 1.5;
                  });
                }
              }
              if (ripples) ripples.spawn(function (r) {
                r.x = x; r.y = p.height - 10;
                r.life = 0; r.maxLife = 0.8 + Math.random() * 0.5;
                r.rx = 8 + Math.random() * 10;
                r.ry = r.rx * 0.25;
              });
            }
            /* Respawn */
            particle.x = Math.random() * p.width;
            particle.y = -20 - Math.random() * p.height * 0.3;
            particle.vx = (-2.5 - Math.random() * 1.2) * particle.depth;
            particle.vy = (9 + Math.random() * 7) * particle.depth;
          }
          if (particle.y > p.height + 20 || particle.x < -60) {
            particle.x = Math.random() * p.width;
            particle.y = -20 - Math.random() * p.height * 0.3;
          }
        },
        draw(p, particle, profile) { /* drawAll handles rendering */ },
      },

      fog: {
        count: 8, color: [210, 222, 222], gravity: 0.18, drift: 0.55, mist: true,
        setup(p) {
          /* Create low-res fog buffer */
          const bw = Math.round(p.width * 0.3);
          const bh = Math.round(p.height * 0.3);
          p._fogBuffer = p.createGraphics(bw, bh);
          p._fogClumps = [];
          const numClumps = 8;
          for (let i = 0; i < numClumps; i++) {
            p._fogClumps.push({
              x: Math.random(), y: Math.random(),
              vx: (Math.random() - 0.5) * 0.0015,
              vy: (Math.random() - 0.5) * 0.0008,
              rx: 0.22 + Math.random() * 0.18,
              ry: 0.12 + Math.random() * 0.14,
              phase: Math.random() * Math.PI * 2,
              layer: i < numClumps / 2 ? 0 : 1 /* 0=far, 1=near */
            });
          }
          p._fogRecovery = 0;
        },
        initParticle(w, h) {
          /* Particles not used for fog — drawAll manages clumps */
          return { x: 0, y: 0, vx: 0, vy: 0, size: 1, life: 0, active: false };
        },
        drawAll(p, particles, effect, reduceMotion, dt) {
          const [cr, cg, cb] = effect.color;
          const lvl = normalizeWeatherLevel(root.dataset.vrWeatherLevel);
          const profile = getIntensityProfile("fog", lvl);
          const pg = p._fogBuffer;
          if (!pg) return;
          const ctx = pg.drawingContext;
          const clumps = p._fogClumps;
          if (!clumps) return;
          /* Update clumps */
          const speed = profile.speed;
          const parallax = profile.parallax;
          for (let i = 0; i < clumps.length; i++) {
            const c = clumps[i];
            c.x += c.vx * speed;
            c.y += c.vy * speed;
            c.phase += dt * 0.12;
            if (c.x < -0.25) c.x = 1.25;
            if (c.x > 1.25) c.x = -0.25;
            if (c.y < -0.25) c.y = 1.25;
            if (c.y > 1.25) c.y = -0.25;
          }
          /* Draw to low-res buffer */
          pg.clear();
          for (let i = 0; i < clumps.length; i++) {
            const c = clumps[i];
            const depthScale = c.layer === 0 ? 0.7 * parallax : 1.0;
            const x = c.x * pg.width;
            const y = c.y * pg.height;
            const w = pg.width * c.rx * depthScale * (1 + Math.sin(c.phase) * 0.08);
            const h = pg.height * c.ry * depthScale * (1 + Math.cos(c.phase * 0.8) * 0.08);
            const alpha = (0.25 + c.layer * 0.1) * profile.coverage;
            /* Draw elliptical gradient clump using cached sprite */
            const cache = p._cache;
            if (cache) {
              const sprite = cache.radial({
                radius: 80, color: [cr, cg, cb], alpha: alpha,
                midAlpha: 0.08, midStop: 0.4, outerAlpha: 0, shape: "e"
              });
              ctx.save();
              ctx.globalCompositeOperation = "source-over";
              pg.image(sprite, x - w * 0.5, y - h * 0.5, w, h);
              ctx.restore();
            } else {
              pg.noStroke();
              pg.fill(cr, cg, cb, alpha * 255);
              pg.ellipse(x, y, w, h);
            }
          }
          /* Pointer dissolution */
          const pointer = p._pointer;
          const ps = pointer && pointer.state;
          if (ps && ps.active && ps.x != null && ps.y != null && profile.erase > 0) {
            const px = ps.x / p.width * pg.width;
            const py = ps.y / p.height * pg.height;
            const eraseRadius = 40 + Math.min(ps.speed * 0.02, 30);
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            const g = ctx.createRadialGradient(px, py, 0, px, py, eraseRadius);
            g.addColorStop(0, "rgba(0,0,0," + (0.08 * profile.erase) + ")");
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(px, py, eraseRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            p._fogRecovery = 1;
          } else if (p._fogRecovery > 0) {
            /* Smooth recovery: slowly redraw clumps */
            p._fogRecovery = Math.max(0, p._fogRecovery - dt * 0.4);
          }
          /* Upsample to main canvas with image smoothing */
          const mainCtx = p.drawingContext;
          mainCtx.save();
          mainCtx.imageSmoothingEnabled = true;
          mainCtx.globalCompositeOperation = "source-over";
          p.image(pg, 0, 0, p.width, p.height);
          mainCtx.restore();
        },
        tick(particle, p, reduceMotion) { /* drawAll handles all updates */ },
        draw(p, particle, profile) { /* drawAll handles rendering */ },
      },

      snow: {
        count: 180, color: [245, 246, 238], gravity: 1.2, drift: 0.9,
        initParticle(w, h) {
          const r = Math.random();
          const depth = r < 0.45 ? 0.55 : r < 0.85 ? 1.0 : 1.45;
          return {
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.3 * depth,
            vy: (0.5 + Math.random() * 0.9) * depth,
            ax: 0, ay: 0,
            size: (depth < 0.7 ? 1.2 : depth > 1.2 ? 4.0 : 2.2) * (0.7 + Math.random() * 0.6),
            depth, life: Math.random() * 100,
            seed: Math.random() * 9999
          };
        },
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const alpha = particle.depth > 1.2 ? 190 : particle.depth < 0.7 ? 55 : 110;
          const cache = p._cache;
          if (cache) {
            const sprite = cache.radial({
              radius: 18, color: [r, g, b], alpha: 1,
              midAlpha: 0.18, midStop: 0.45, outerAlpha: 0
            });
            const sz = particle.size * 6;
            cache.draw(sprite, particle.x, particle.y, sz, sz, "source-over", alpha);
          } else {
            p.noStroke();
            p.fill(r, g, b, alpha * 0.3);
            p.circle(particle.x, particle.y, particle.size * 4);
            p.fill(r, g, b, alpha);
            p.circle(particle.x, particle.y, particle.size * 2);
          }
        },
        tick(particle, p, reduceMotion) {
          if (reduceMotion) return;
          const lvl = normalizeWeatherLevel(root.dataset.vrWeatherLevel);
          const profile = getIntensityProfile("snow", lvl);
          /* Flow field — noise-based wind */
          const t = performance.now() * 0.0002 + particle.life * 0.01;
          const flowX = Math.sin(t + particle.seed) * 0.03 * profile.flowAmp;
          const flowY = Math.cos(t * 0.8 + particle.seed) * 0.01;
          particle.ax = flowX;
          particle.ay = 0.003 + flowY;
          /* Pointer attract with smooth falloff */
          applyPointerField(particle, p._pointer, {
            mode: "attract", radius: 140,
            strength: 0.03 * profile.pointer, idleCutoff: 0.06
          });
          /* Edge swirl near pointer center */
          applyPointerField(particle, p._pointer, {
            mode: "orbit", radius: 70,
            strength: 0.012 * profile.swirl, idleCutoff: 0.06
          });
          /* Apply acceleration to velocity */
          particle.vx += particle.ax;
          particle.vy += particle.ay;
          /* Damping + speed clamp */
          particle.vx *= 0.992;
          particle.vy *= 0.998;
          const maxSpeed = 0.9 + particle.depth * 1.3;
          const speed = Math.hypot(particle.vx, particle.vy);
          if (speed > maxSpeed) {
            particle.vx = particle.vx / speed * maxSpeed;
            particle.vy = particle.vy / speed * maxSpeed;
          }
          /* Integrate position */
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life += 0.5;
          /* Respawn off-screen */
          if (particle.y > p.height + 20 || particle.x < -40 || particle.x > p.width + 40) {
            particle.x = Math.random() * p.width;
            particle.y = -10 - Math.random() * p.height * 0.3;
            particle.vx = (Math.random() - 0.5) * 0.3 * particle.depth;
            particle.vy = (0.5 + Math.random() * 0.9) * particle.depth;
          }
        },
      },

      wind: {
        count: 48, color: [236, 232, 214], gravity: 0.5, drift: 5.5, streak: true,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const alpha = 40 + Math.sin(particle.life * 0.03 + particle.seed) * 25;
          p.stroke(r, g, b, alpha);
          p.strokeWeight(particle.depth > 1 ? 1.2 : 0.6);
          /* Continuous curved streak using multiple sample points */
          p.noFill();
          p.beginShape();
          for (let i = 0; i < 6; i++) {
            const t = particle.life + i * 2.5;
            const wobble = p.noise(t * 0.015, particle.seed) * 20 - 10;
            const bendX = p.noise(t * 0.008, particle.seed + 100) * 8 - 4;
            p.curveVertex(particle.x + i * particle.size * 0.25 + bendX, particle.y + wobble + i * 2);
          }
          p.endShape();
        },
        tick(particle, p, reduceMotion) {
          if (reduceMotion) return;
          const lvl = normalizeWeatherLevel(root.dataset.vrWeatherLevel);
          const profile = getIntensityProfile("wind", lvl);
          /* Flow field wind */
          const gust = p.noise(particle.life * 0.008, particle.seed) * profile.gustAmp;
          const vertical = p.noise(particle.seed + 300, particle.life * 0.006) * 0.8 - 0.4;
          /* Pointer bend */
          applyPointerField(particle, p._pointer, {
            mode: "bend", radius: 150,
            strength: 0.8 * profile.pointerStrength, idleCutoff: 0.08
          });
          particle.x += particle.vx + gust;
          particle.y += particle.vy + vertical;
          particle.life += 1;
          if (particle.x > p.width + particle.size) {
            particle.x = -p.width * 0.2;
            particle.y = Math.random() * p.height;
            particle.depth = 0.5 + Math.random() * 0.8;
          }
        },
        initParticle(w, h) {
          return { x: -w * 0.2 + Math.random() * w * 1.2, y: Math.random() * h, vx: 3 + Math.random() * 7, vy: (Math.random() - 0.5) * 0.7, size: 30 + Math.random() * 120, life: Math.random() * 100, splash: 0, seed: Math.random() * 1000, depth: 0.5 + Math.random() * 0.8 };
        }
      },

      ripple: {
        count: 12, color: [180, 200, 220], gravity: 0, drift: 0,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const t = particle.life / (particle.maxLife || 100);
          const ease = 1 - (1 - t) * (1 - t);
          p.noFill();
          /* Elliptical perspective compression */
          const rx = particle.size * (1 + ease * 1.5);
          const ry = rx * (0.28 + particle.ecc * 0.12);
          p.stroke(r, g, b, (1 - t) * 60);
          p.strokeWeight(0.8);
          p.ellipse(particle.x, particle.y, rx * 2, ry * 2);
          /* Inner ring with different phase */
          if (rx > 15) {
            const innerRx = rx * 0.55;
            const innerRy = ry * 0.55;
            p.stroke(r, g, b, (1 - t) * 25);
            p.ellipse(particle.x + particle.ox, particle.y + particle.oy, innerRx * 2, innerRy * 2);
          }
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) particle.life += 0.6;
          if (particle.life > (particle.maxLife || 100)) {
            particle.x = Math.random() * p.width;
            particle.y = Math.random() * p.height;
            particle.life = 0;
            particle.size = 10 + Math.random() * 30;
            particle.maxLife = 80 + Math.random() * 40;
            particle.ecc = Math.random() * 0.3;
            particle.ox = (Math.random() - 0.5) * 4;
            particle.oy = (Math.random() - 0.5) * 2;
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, size: 10 + Math.random() * 30, life: Math.random() * 80, splash: 0, maxLife: 80 + Math.random() * 40, ecc: Math.random() * 0.3, ox: (Math.random() - 0.5) * 4, oy: (Math.random() - 0.5) * 2 };
        }
      },

      water: {
        count: 20, color: [160, 195, 215], gravity: 0, drift: 0,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const wave = Math.sin(particle.life * 0.03 + particle.x * 0.01) * 12;
          const highlight = Math.sin(particle.life * 0.05 + particle.x * 0.008) * 0.5 + 0.5;
          /* Main wave line */
          p.noFill();
          p.stroke(r, g, b, 25 + highlight * 18);
          p.strokeWeight(0.6);
          p.beginShape();
          for (let i = 0; i < 7; i++) {
            const wx = particle.x + (i - 3) * 28;
            const wy = particle.y + Math.sin(particle.life * 0.04 + i * 0.8) * 6 + wave;
            p.curveVertex(wx, wy);
          }
          p.endShape();
          /* Thin highlight strip */
          if (highlight > 0.6 && particle.y > p.height * 0.4) {
            const ctx = p.drawingContext;
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            p.stroke(220, 235, 245, (highlight - 0.6) * 40);
            p.strokeWeight(0.4);
            p.line(particle.x - 20, particle.y - 1, particle.x + 40, particle.y - 1);
            ctx.restore();
          }
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) { particle.life += 0.8; particle.x += 0.3; }
          if (particle.x > p.width + 40 || particle.life > 200) {
            particle.x = -40;
            particle.y = Math.random() * p.height;
            particle.life = 0;
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: Math.random() * h, vx: 0.3, vy: 0, size: 20 + Math.random() * 40, life: Math.random() * 150, splash: 0 };
        }
      },

      dust: {
        count: 46, color: [239, 219, 164], gravity: 0.45, drift: 0.9,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          /* Visibility controlled by depth and life */
          const brightness = 0.3 + Math.sin(particle.life * 0.02 + particle.seed) * 0.15;
          const depthAlpha = particle.depth > 1.2 ? 140 : particle.depth < 0.7 ? 60 : 100;
          const cache = p._cache;
          if (cache) {
            const sprite = cache.radial({
              radius: 10, color: [r, g, b], alpha: brightness,
              midAlpha: 0.2, midStop: 0.4, outerAlpha: 0
            });
            const sz = particle.size * (1 + particle.depth) * 3;
            cache.draw(sprite, particle.x, particle.y, sz, sz, "source-over", depthAlpha);
          } else {
            p.noStroke();
            p.fill(r, g, b, depthAlpha * brightness);
            p.circle(particle.x, particle.y, particle.size * 2);
          }
        },
        tick(particle, p, reduceMotion) {
          if (reduceMotion) return;
          /* Pointer scatter — gentle, not explosive */
          applyPointerField(particle, p._pointer, {
            mode: "scatter", radius: 100, strength: 0.3, idleCutoff: 0.15
          });
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life += 1;
          if (particle.y > p.height + particle.size || particle.x > p.width + particle.size || particle.x < -particle.size) {
            particle.x = Math.random() * p.width;
            particle.y = -particle.size;
            particle.vx = (Math.random() - 0.5) * 0.9;
            particle.vy = 0.45 * (0.45 + Math.random() * 0.9);
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.9, vy: 0.45 * (0.45 + Math.random() * 0.9), size: 0.8 + Math.random() * 2.8, life: Math.random() * 100, splash: 0, seed: Math.random() * 1000, depth: 0.5 + Math.random() * 0.8 };
        }
      },

      embers: {
        count: 32, color: [255, 160, 60], gravity: -0.8, drift: 0.6,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const glow = 0.4 + Math.sin(particle.life * 0.1) * 0.3;
          const cache = p._cache;
          if (cache) {
            /* Color core */
            const coreSprite = cache.radial({
              radius: 14, color: [r, g, b], alpha: 1,
              midAlpha: 0.4, midStop: 0.35, outerAlpha: 0
            });
            cache.draw(coreSprite, particle.x, particle.y, particle.size * 4, particle.size * 4, "source-over", glow * 220);
            /* Warm halo */
            const haloSprite = cache.radial({
              radius: 28, color: [255, 200, 100], alpha: 1,
              midAlpha: 0.1, midStop: 0.4, outerAlpha: 0
            });
            cache.draw(haloSprite, particle.x, particle.y, particle.size * 6, particle.size * 6, "screen", glow * 90);
          } else {
            p.noStroke();
            p.fill(r, g, b, glow * 200);
            p.circle(particle.x, particle.y, particle.size * 2);
            p.fill(255, 200, 100, glow * 80);
            p.circle(particle.x, particle.y, particle.size * 5);
          }
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) { particle.x += particle.vx + Math.sin(particle.life * 0.04) * 0.8; particle.y += particle.vy; particle.life += 1; }
          if (particle.y < -particle.size || particle.life > 160) {
            particle.x = Math.random() * p.width;
            particle.y = p.height + Math.random() * 40;
            particle.life = 0;
            particle.vx = (Math.random() - 0.5) * 0.6;
            particle.vy = -0.8 * (0.4 + Math.random() * 0.8);
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: h + Math.random() * 40, vx: (Math.random() - 0.5) * 0.6, vy: -0.8 * (0.4 + Math.random() * 0.8), size: 1 + Math.random() * 2.5, life: Math.random() * 120, splash: 0 };
        }
      },

      fire: {
        count: 40, color: [255, 140, 40], gravity: -1.2, drift: 0.8,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const flicker = 0.4 + p.noise(particle.life * 0.04, particle.seed) * 0.5;
          const cache = p._cache;
          if (cache) {
            /* Outer heat glow — elongated */
            const heatSprite = cache.radial({
              radius: 32, color: [255, 100, 20], alpha: 1,
              midAlpha: 0.06, midStop: 0.4, outerAlpha: 0, shape: "e"
            });
            cache.draw(heatSprite, particle.x, particle.y, particle.size * 8, particle.size * 10, "screen", flicker * 50);
            /* Mid flame — warm continuous volume */
            const flameSprite = cache.radial({
              radius: 20, color: [r, g, b], alpha: 1,
              midAlpha: 0.35, midStop: 0.35, outerAlpha: 0, shape: "e"
            });
            cache.draw(flameSprite, particle.x, particle.y, particle.size * 4, particle.size * 5, "source-over", flicker * 180);
            /* Hot core */
            const coreSprite = cache.radial({
              radius: 10, color: [255, 230, 120], alpha: 1,
              midAlpha: 0.5, midStop: 0.3, outerAlpha: 0
            });
            cache.draw(coreSprite, particle.x, particle.y, particle.size * 1.8, particle.size * 2, "screen", flicker * 200);
          } else {
            p.noStroke();
            p.fill(255, 100, 20, flicker * 40);
            p.circle(particle.x, particle.y, particle.size * 8);
            p.fill(r, g, b, flicker * 160);
            p.circle(particle.x, particle.y, particle.size * 3.5);
            p.fill(255, 230, 120, flicker * 200);
            p.circle(particle.x, particle.y, particle.size * 1.5);
          }
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) {
            const turbulence = p.noise(particle.life * 0.03, particle.seed) * 2 - 1;
            particle.x += particle.vx + turbulence * 1.2;
            particle.y += particle.vy;
            particle.life += 1;
          }
          if (particle.y < -particle.size * 2 || particle.life > 100) {
            particle.x = p.width * 0.3 + Math.random() * p.width * 0.4;
            particle.y = p.height * 0.6 + Math.random() * p.height * 0.3;
            particle.life = 0;
            particle.vx = (Math.random() - 0.5) * 1;
            particle.vy = -1.2 * (0.3 + Math.random() * 0.7);
          }
        },
        initParticle(w, h) {
          return { x: w * 0.3 + Math.random() * w * 0.4, y: h * 0.6 + Math.random() * h * 0.3, vx: (Math.random() - 0.5) * 1, vy: -1.2 * (0.3 + Math.random() * 0.7), size: 1 + Math.random() * 3, life: Math.random() * 80, splash: 0, seed: Math.random() * 1000 };
        }
      },

      signal: {
        count: 24, color: [150, 230, 150], gravity: 0, drift: 0,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          /* Scanline with wobble */
          const y = particle.y;
          const wobble = Math.sin(particle.life * 0.15 + y * 0.03) * (3 + particle.size);
          p.stroke(r, g, b, 20 + Math.sin(particle.life * 0.08) * 12);
          p.strokeWeight(0.6);
          p.line(0, y + wobble, p.width, y - wobble * 0.2);
          /* Bright sweep spot */
          const sweepY = (particle.life * 1.5) % p.height;
          const dist = Math.abs(y - sweepY);
          if (dist < 25) {
            const intensity = (1 - dist / 25);
            p.stroke(r, g, b, 45 * intensity);
            p.strokeWeight(1.5);
            p.line(0, y, p.width, y);
          }
          /* Noise burst — occasional short horizontal glitch */
          if (particle.life % 60 < 2 && particle.depth > 0.8) {
            const burstY = y + (Math.random() - 0.5) * 20;
            p.stroke(r, g, b, 30);
            p.strokeWeight(0.5);
            const bx = Math.random() * p.width;
            p.line(bx, burstY, bx + 30 + Math.random() * 60, burstY);
          }
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) particle.life += 1;
          if (particle.life > 300) particle.life = 0;
        },
        initParticle(w, h) {
          return { x: 0, y: Math.random() * h, vx: 0, vy: 0, size: 1 + Math.random() * 3, life: Math.random() * 250, splash: 0, depth: Math.random() };
        }
      },

      paper: {
        count: 28, color: [220, 200, 170], gravity: 0.3, drift: 0.7,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const alpha = 0.3 + Math.sin(particle.life * 0.04) * 0.2;
          const sz = particle.size;
          /* Flat paper fiber with edge highlight */
          p.push();
          p.translate(particle.x, particle.y);
          p.rotate(particle.rotation || 0);
          p.noStroke();
          p.fill(r, g, b, alpha * 255);
          p.rect(-sz * 2, -sz * 0.35, sz * 4, sz * 0.7, 1);
          /* Edge highlight — one side bright, one side dark */
          p.fill(255, 255, 255, alpha * 60);
          p.rect(-sz * 2, -sz * 0.35, sz * 4, sz * 0.15, 1);
          p.pop();
        },
        tick(particle, p, reduceMotion) {
          if (reduceMotion) return;
          /* Air resistance: horizontal drift slows down */
          particle.vx *= 0.995;
          particle.x += particle.vx + Math.sin(particle.life * 0.03) * 0.5;
          particle.y += particle.vy;
          /* Rotation with tumble */
          particle.rotation = (particle.rotation || 0) + Math.sin(particle.life * 0.02) * 0.015;
          particle.life += 1;
          /* Pointer scatter */
          applyPointerField(particle, p._pointer, {
            mode: "scatter", radius: 100, strength: 0.5, idleCutoff: 0.1
          });
          if (particle.y > p.height + particle.size || particle.life > 200) {
            particle.x = Math.random() * p.width;
            particle.y = -particle.size * 4;
            particle.vx = (Math.random() - 0.5) * 0.7;
            particle.vy = 0.3 + Math.random() * 0.5;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.life = 0;
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: -Math.random() * h * 0.3, vx: (Math.random() - 0.5) * 0.7, vy: 0.3 + Math.random() * 0.5, size: 1 + Math.random() * 2, life: Math.random() * 150, splash: 0, rotation: Math.random() * Math.PI * 2 };
        }
      },

      stars: {
        count: 60, color: [220, 230, 255], gravity: 0, drift: 0.05,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const twinkle = 0.3 + Math.sin(particle.life * 0.05 + particle.seed) * 0.3;
          const cache = p._cache;
          if (cache) {
            const coreAlpha = twinkle * 255;
            const coreSprite = cache.radial({
              radius: 12, color: [r, g, b], alpha: 1,
              midAlpha: 0.3, midStop: 0.5, outerAlpha: 0
            });
            cache.draw(coreSprite, particle.x, particle.y, particle.size * 3, particle.size * 3, "source-over", coreAlpha);
            if (particle.size > 2.5) {
              const flareSprite = cache.radial({
                radius: 24, color: [r, g, b], alpha: 1,
                midAlpha: 0.08, midStop: 0.35, outerAlpha: 0, shape: "r"
              });
              cache.draw(flareSprite, particle.x, particle.y, particle.size * 5, particle.size * 5, "screen", twinkle * 60);
            }
          } else {
            p.noStroke();
            p.fill(r, g, b, twinkle * 255);
            p.circle(particle.x, particle.y, particle.size * 2);
            if (particle.size > 2.5) {
              p.fill(r, g, b, twinkle * 40);
              p.circle(particle.x, particle.y, particle.size * 5);
            }
          }
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) { particle.x += Math.sin(particle.life * 0.008 + particle.seed) * 0.1; particle.y += 0.05; particle.life += 1; }
          if (particle.y > p.height + 5) {
            particle.y = -5;
            particle.x = Math.random() * p.width;
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0.05, size: 0.5 + Math.random() * 3, life: Math.random() * 300, splash: 0, seed: Math.random() * 1000 };
        }
      },

      leaves: {
        count: 28, color: [180, 140, 60], gravity: 0.6, drift: 1.2,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const alpha = (0.4 + Math.sin(particle.life * 0.03) * 0.15) * (particle.depth || 1);
          const sz = particle.size * (0.7 + (particle.depth || 0.5) * 0.6);
          p.noStroke();
          p.push();
          p.translate(particle.x, particle.y);
          /* Flip: show front or back */
          const flip = Math.sin(particle.rotation || 0) > 0 ? 1 : 0.7;
          p.rotate(particle.rotation || 0);
          /* Leaf shape with notch */
          p.fill(r * flip, g * flip, b * flip, alpha * 200);
          p.beginShape();
          p.vertex(0, -sz * 2.5);
          p.bezierVertex(sz * 1.2, -sz * 1.5, sz * 1.5, -sz * 0.3, sz * 0.8, sz * 0.8);
          p.vertex(sz * 0.15, sz * 1.8);
          p.vertex(-sz * 0.15, sz * 1.8);
          p.vertex(-sz * 0.8, sz * 0.8);
          p.bezierVertex(-sz * 1.5, -sz * 0.3, -sz * 1.2, -sz * 1.5, 0, -sz * 2.5);
          p.endShape(p.CLOSE);
          /* Leaf vein */
          p.stroke(r * 0.5, g * 0.5, b * 0.5, alpha * 60);
          p.strokeWeight(0.4);
          p.line(0, -sz * 2.2, 0, sz * 1.5);
          p.pop();
        },
        tick(particle, p, reduceMotion) {
          if (reduceMotion) return;
          const lvl = normalizeWeatherLevel(root.dataset.vrWeatherLevel);
          const profile = getIntensityProfile("leaves", lvl);
          /* Flow field wind */
          const nx = p.noise(particle.life * 0.008, particle.seed) * 2 - 1;
          const ny = p.noise(particle.seed + 100, particle.life * 0.006) * 0.6;
          /* Air resistance */
          particle.vx *= 0.998;
          particle.x += particle.vx + nx * 1.5 * profile.gustAmp;
          particle.y += particle.vy + ny;
          /* Rotation with tumble */
          particle.rotation = (particle.rotation || 0) + nx * 0.04 + Math.sin(particle.life * 0.02) * 0.02;
          particle.life += 1;
          /* Pointer bend or scatter */
          applyPointerField(particle, p._pointer, {
            mode: "bend", radius: 120,
            strength: 0.6 * profile.pointerStrength, idleCutoff: 0.1
          });
          if (particle.y > p.height + 20 || particle.x > p.width + 40 || particle.x < -40) {
            particle.x = Math.random() * p.width;
            particle.y = -20 - Math.random() * 40;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.life = 0;
            particle.depth = 0.3 + Math.random() * 0.7;
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: -Math.random() * h * 0.3, vx: (Math.random() - 0.5) * 1.2, vy: 0.4 + Math.random() * 0.8, size: 2 + Math.random() * 3, life: Math.random() * 200, splash: 0, seed: Math.random() * 1000, rotation: Math.random() * Math.PI * 2, depth: 0.3 + Math.random() * 0.7 };
        }
      },

      fireflies: {
        count: 24, color: [200, 240, 80], gravity: 0, drift: 0.3,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const pulse = 0.3 + Math.sin(particle.life * 0.06 + particle.seed) * 0.35;
          const extraBright = (particle.pointerGlow || 0) * 0.3;
          const cache = p._cache;
          if (cache) {
            /* Outer halo — additive only for inner part */
            const haloSprite = cache.radial({
              radius: 24, color: [r, g, b], alpha: 1,
              midAlpha: 0.06, midStop: 0.35, outerAlpha: 0
            });
            cache.draw(haloSprite, particle.x, particle.y, particle.size * 12, particle.size * 12, "source-over", pulse * 30 + extraBright * 20);
            /* Inner glow */
            const innerSprite = cache.radial({
              radius: 14, color: [r, g, b], alpha: 1,
              midAlpha: 0.25, midStop: 0.4, outerAlpha: 0
            });
            cache.draw(innerSprite, particle.x, particle.y, particle.size * 4, particle.size * 4, "source-over", pulse * 100 + extraBright * 60);
            /* Hot core — additive */
            const coreSprite = cache.radial({
              radius: 8, color: [255, 255, 220], alpha: 1,
              midAlpha: 0.5, midStop: 0.3, outerAlpha: 0
            });
            cache.draw(coreSprite, particle.x, particle.y, particle.size * 1.8, particle.size * 1.8, "screen", pulse * 200 + extraBright * 35);
          } else {
            p.noStroke();
            p.fill(r, g, b, pulse * 30 + extraBright * 20);
            p.circle(particle.x, particle.y, particle.size * 12);
            p.fill(r, g, b, pulse * 100 + extraBright * 60);
            p.circle(particle.x, particle.y, particle.size * 4);
            p.fill(255, 255, 220, pulse * 220 + extraBright * 35);
            p.circle(particle.x, particle.y, particle.size * 1.5);
          }
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) {
            /* Noise drift */
            const nx = p.noise(particle.life * 0.005, particle.seed) * 2 - 1;
            const ny = p.noise(particle.seed + 50, particle.life * 0.004) * 2 - 1;
            particle.vx += nx * 0.04;
            particle.vy += ny * 0.03;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life += 1;
            /* Flocking — use p._particles instead of outer scope variable */
            const allParticles = p._particles;
            if (allParticles && allParticles.length > 1) {
              let nearestDist = Infinity, nearest = null;
              for (let i = 0; i < allParticles.length; i++) {
                const other = allParticles[i];
                if (other === particle || !other.active) continue;
                const dx = other.x - particle.x;
                const dy = other.y - particle.y;
                const d = dx * dx + dy * dy;
                if (d < nearestDist && d < 90000) {
                  nearestDist = d;
                  nearest = other;
                }
              }
              if (nearest) {
                const d = Math.sqrt(nearestDist);
                particle.vx += (nearest.x - particle.x) / d * 0.015;
                particle.vy += (nearest.y - particle.y) / d * 0.015;
              }
            }
            /* Damping */
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            /* Pointer interaction — force-based instead of direct position */
            applyPointerField(particle, p._pointer, {
              mode: "repel", radius: 120, strength: 0.03, idleCutoff: 0.1
            });
            /* Pointer glow feedback */
            const ps = p._pointer && p._pointer.state;
            if (ps && ps.active && ps.x != null) {
              const dx = particle.x - ps.x;
              const dy = particle.y - ps.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              particle.pointerGlow = dist < 120 ? (1 - dist / 120) : 0;
            } else {
              particle.pointerGlow = (particle.pointerGlow || 0) * 0.9;
            }
          }
          if (particle.x < -30 || particle.x > p.width + 30 || particle.y < -30 || particle.y > p.height + 30) {
            particle.x = Math.random() * p.width;
            particle.y = Math.random() * p.height;
            particle.life = 0;
            particle.vx = (Math.random() - 0.5) * 0.3;
            particle.vy = (Math.random() - 0.5) * 0.2;
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.2, size: 0.8 + Math.random() * 1.2, life: Math.random() * 400, splash: 0, seed: Math.random() * 1000, pointerGlow: 0 };
        }
      }
    };

    /* ── Unified effect entry point (matches docs contract) ── */
    function renderEffect({ layer, kind, level, accent, mode, reducedMotion }) {
      if (!layer) return null;
      const effectiveKind = normalizeWeatherKind(kind || "");
      const effectiveLevel = normalizeWeatherLevel(level || root.dataset.vrWeatherLevel);
      const effectiveReducedMotion = typeof reducedMotion === "boolean"
        ? reducedMotion
        : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (mode === "guide") {
        return null; // guide art runs on its own engine
      }
      // Temporarily set level for the engine to read
      const prevLevel = root.dataset.vrWeatherLevel;
      root.dataset.vrWeatherLevel = effectiveLevel;
      const engine = createP5Weather(layer, effectiveKind);
      root.dataset.vrWeatherLevel = prevLevel;
      return engine;
    }

    /* ── Canvas weather engine (fallback when p5 unavailable) ── */
    function createCanvasWeather(layer, kind) {
      layer.dataset.vrWeatherEngine = "canvas";
      const effect = VIBE_EFFECTS[kind] || VIBE_EFFECTS.dust;
      const canvas = document.createElement("canvas");
      canvas.className = "vr-weather-canvas";
      layer.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let width = 1, height = 1, particles = [], raf = 0;

      function resize() {
        width = Math.max(1, layer.clientWidth || window.innerWidth);
        height = Math.max(1, layer.clientHeight || window.innerHeight);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const lvl = normalizeWeatherLevel(root.dataset.vrWeatherLevel);
        const mult = lvl === "off" ? 0 : lvl === "high" ? 1.55 : 1;
        const reducedMult = lvl === "off" ? 0 : lvl === "high" ? 0.25 : 0.18;
        const count = reduceMotion ? Math.ceil(effect.count * reducedMult) : Math.ceil(effect.count * mult);
        particles = Array.from({ length: count }, () => effect.initParticle(width, height));
      }

      function drawCanvasParticle(particle) {
        const [r, g, b] = effect.color;
        if (kind === "rain" || kind === "storm-rain") {
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.46)`;
          ctx.lineWidth = kind === "storm-rain" ? 1.5 : 1;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x + particle.vx * 1.6, particle.y + particle.size);
          ctx.stroke();
          if (particle.splash > 0) {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${particle.splash * 0.28})`;
            ctx.beginPath();
            ctx.ellipse(particle.x, height - 8, particle.splash * 16, particle.splash * 4, 0, 0, Math.PI * 2);
            ctx.stroke();
            particle.splash *= 0.78;
          }
        } else if (kind === "fog") {
          const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size);
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.08)`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (kind === "wind") {
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.28)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x + particle.size, particle.y + particle.vy * 8);
          ctx.stroke();
        } else if (kind === "embers" || kind === "fire") {
          const glow = 0.4 + Math.sin(particle.life * 0.1) * 0.3;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${glow * 0.8})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (kind === "ripple" || kind === "water") {
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * (1 + particle.life * 0.05), 0, Math.PI * 2);
          ctx.stroke();
        } else if (kind === "signal") {
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
          ctx.lineWidth = 0.8;
          const y = particle.y;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        } else if (kind === "paper") {
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.life * 0.02);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
          ctx.fillRect(-particle.size * 2, -particle.size * 0.4, particle.size * 4, particle.size * 0.8);
          ctx.restore();
        } else if (kind === "stars") {
          const twinkle = 0.3 + Math.sin(particle.life * 0.05) * 0.3;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${twinkle})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (kind === "leaves") {
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation || 0);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
          ctx.beginPath();
          ctx.ellipse(0, 0, particle.size * 4, particle.size * 1.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = `rgba(${r * 0.7}, ${g * 0.7}, ${b * 0.7}, 0.4)`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(-particle.size * 1.5, 0);
          ctx.lineTo(particle.size * 1.5, 0);
          ctx.stroke();
          ctx.restore();
        } else if (kind === "fireflies") {
          const pulse = 0.3 + Math.sin(particle.life * 0.06 + (particle.seed || 0)) * 0.35;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${pulse * 0.3})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${pulse})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Default: dust, snow
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.45)`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      function tick() {
        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = (kind === "fog" || kind === "stars") ? "screen" : "source-over";
        for (const particle of particles) {
          drawCanvasParticle(particle);
          if (!reduceMotion) {
            // Use noise for canvas mode effects that need it
            if (kind === "leaves" || kind === "fireflies" || kind === "fog" || kind === "wind" || kind === "snow") {
              effect.tick(particle, { width, height, noise: Math.sin, noStroke(){} }, reduceMotion);
            }
            particle.life += 1;
            particle.x += particle.vx || 0;
            particle.y += particle.vy || 0;
            if (kind === "leaves") particle.rotation = (particle.rotation || 0) + (Math.random() - 0.5) * 0.04;
          }
          // Reset off-screen particles
          if (particle.y > height + 50 || particle.y < -50 || particle.x > width + 50 || particle.x < -50) {
            Object.assign(particle, effect.initParticle(width, height));
          }
        }
        raf = window.requestAnimationFrame(tick);
      }

      resize();
      window.addEventListener("resize", resize);
      tick();
      return {
        updateLevel: resize,
        destroy() {
          window.cancelAnimationFrame(raf);
          window.removeEventListener("resize", resize);
          canvas.remove();
        }
      };
    }

    /* ── P5 weather engine (preferred) ── */
    function createP5Weather(layer, kind) {
      if (!window.p5) return createCanvasWeather(layer, kind);
      layer.dataset.vrWeatherEngine = "p5";
      const effect = VIBE_EFFECTS[kind] || VIBE_EFFECTS.dust;
      let instance = null;
      const clock = createFrameClock();
      const sketch = (p) => {
        let particles = [];
        let reduceMotion = false;
        let localCache = null;

        function rebuild() {
          reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const lvl = normalizeWeatherLevel(root.dataset.vrWeatherLevel);
          const profile = getIntensityProfile(kind, lvl);
          const spawnScale = reduceMotion ? (lvl === "off" ? 0 : 0.18) : profile.spawnScale;
          const count = Math.ceil(effect.count * spawnScale);
          particles = Array.from({ length: count }, () => effect.initParticle(p.width, p.height));
          if (effect.setup) effect.setup(p, kind);
        }

        p.setup = () => {
          const canvas = p.createCanvas(layer.clientWidth || window.innerWidth, layer.clientHeight || window.innerHeight);
          canvas.addClass("vr-weather-canvas");
          canvas.parent(layer);
          p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
          p.frameRate(30);
          localCache = createGradientSpriteCache(p);
          rebuild();
        };

        let resizeTimer = 0;
        p.windowResized = () => {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            p.resizeCanvas(layer.clientWidth || window.innerWidth, layer.clientHeight || window.innerHeight);
            syncPointerBounds();
            if (localCache) { localCache.destroy(); localCache = createGradientSpriteCache(p); }
            rebuild();
          }, 100);
        };

        p.draw = () => {
          clock.update(performance.now());
          p._dt = clock.dt;
          p._cache = localCache;
          p._pointer = pointer;
          p._particles = particles;
          p.clear();
          p.blendMode((kind === "fog" || kind === "stars") ? p.SCREEN : p.BLEND);
          if (effect.drawAll) {
            /* Bulk rendering mode (fog, rain with impacts, etc.) */
            effect.drawAll(p, particles, effect, reduceMotion, clock.dt);
          } else {
            for (const particle of particles) {
              effect.draw(p, particle, effect, reduceMotion);
              if (!reduceMotion) {
                effect.tick(particle, p, reduceMotion);
                particle.life += 1;
              }
            }
          }
          /* Mouse glow using gradient sprite instead of concentric circles */
          if (!reduceMotion) drawMouseGlow(p, pointer, localCache);
        };

        p.vrUpdateLevel = rebuild;
      };
      instance = new window.p5(sketch);
      return {
        _clock: clock,
        updateLevel() { if (instance && instance.vrUpdateLevel) instance.vrUpdateLevel(); },
        destroy() {
          if (instance) instance.remove();
          instance = null;
        }
      };
    }

    /* ── Weather rendering ── */
    function renderWeather(description) {
      const layer = $("[data-vr-weather]");
      if (!layer) return;
      const kind = normalizeWeatherKind(description);
      if (layer.dataset.vrWeatherKind === kind && layer.childElementCount) return;
      layer.dataset.vrWeatherKind = kind;
      destroyWeatherEngine();
      layer.replaceChildren();
      weatherEngine = renderEffect({
        layer,
        kind,
        level: weatherLevel,
        accent: stages[activeStageIndex]?.uiAccent,
        mode: "weather",
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      }) || createP5Weather(layer, kind);
    }

    function destroyWeatherEngine() {
      if (!weatherEngine) return;
      weatherEngine.destroy();
      weatherEngine = null;
    }

    function setWeather(level, options = {}) {
      weatherLevel = normalizeWeatherLevel(level);
      root.dataset.vrWeatherLevel = weatherLevel;
      const stage = stages[activeStageIndex];
      if (options.persist !== false && stage?.id) stageWeatherLevels.set(stage.id, level);
      $$("[data-vr-weather-level]").forEach((btn) => {
        btn.setAttribute("aria-pressed", String(normalizeWeatherLevel(btn.dataset.vrWeatherLevel) === weatherLevel));
      });
      if (weatherEngine?.updateLevel) weatherEngine.updateLevel();
      window.dispatchEvent(new CustomEvent("vibereading:weather", { detail: { level: weatherLevel, stage, index: activeStageIndex } }));
    }

    /* ── Pointer tracker ── */
    const pointer = createPointerTracker();
    pointer.bind(window);
    function syncPointerBounds() {
      const layer = $("[data-vr-weather]");
      if (layer) pointer.updateBounds(layer.getBoundingClientRect());
    }
    syncPointerBounds();

    /* ── Sound system — sequential BGM-first fallback ── */
    function setBgmVolume(vol) {
      audioController.setBgmVolume(vol);
    }

    function setAmbienceVolume(vol) {
      audioController.setAmbienceVolume(vol);
    }

    async function syncStageAmbience() {
      const stage = stages[activeStageIndex];
      root.dataset.vrAmbience = stage?.ambience || "";
      return audioController.switchStageAmbience(stage?.ambience || "");
    }

    async function beginSound() {
      return audioController.beginSound(() => stages[activeStageIndex]?.ambience || "");
    }

    function pauseSound() {
      audioController.pauseSound();
    }

    async function setSoundEnabled(enabled) {
      root.dataset.vrSound = enabled ? "on" : "off";
      const toggle = $("[data-vr-sound-toggle]");
      if (toggle) toggle.textContent = enabled
        ? (isChinese ? "静音" : "Mute")
        : (isChinese ? "取消静音" : "Unmute");
      await audioController.setSoundEnabled(enabled, () => stages[activeStageIndex]?.ambience || "");
    }

    /* ── Timer ── */
    function updateTimerDisplay() {
      const display = $("[data-vr-timer-display]");
      if (display) display.textContent = formatTime(timerSeconds);
    }

    function resetTimerForMode() {
      timerSeconds = timerKind === "pomodoro" ? 25 * 60 : 0;
      updateTimerDisplay();
    }

    function stopTimer() {
      timerRunning = false;
      window.clearInterval(timerInterval);
      timerInterval = null;
      const toggle = $("[data-vr-timer-toggle]");
      if (toggle) toggle.textContent = isChinese ? "继续" : "Resume";
    }

    function tickTimer() {
      if (timerKind === "pomodoro") {
        timerSeconds -= 1;
        if (timerSeconds <= 0) {
          timerSeconds = 0;
          stopTimer();
          root.dataset.vrPomodoroComplete = "true";
          window.dispatchEvent(new CustomEvent("vibereading:pomodoro-complete"));
        }
      } else {
        timerSeconds += 1;
      }
      updateTimerDisplay();
    }

    function startTimer() {
      if (timerRunning) return;
      timerRunning = true;
      timerInterval = window.setInterval(tickTimer, 1000);
      const toggle = $("[data-vr-timer-toggle]");
      if (toggle) toggle.textContent = isChinese ? "暂停" : "Pause";
    }

    function resetTimer() {
      stopTimer();
      resetTimerForMode();
      root.dataset.vrPomodoroComplete = "false";
    }

    /* ── Stage selection ── */
    function selectStage(index) {
      const safeIndex = Math.max(0, Math.min(index, stages.length - 1));
      const stage = stages[safeIndex];
      if (!stage) return;
      const stageChanged = activeStageIndex !== safeIndex;
      activeStageIndex = safeIndex;
      root.dataset.vrStage = stage.id;
      const currentStage = $("[data-vr-current-stage]");
      const currentRange = $("[data-vr-current-range]");
      const currentHint = $("[data-vr-current-hint]");
      if (currentStage) currentStage.textContent = stage.label;
      if (currentRange) currentRange.textContent = stage.sourceRange || (stage.chapters || []).join(" · ");
      if (currentHint) currentHint.textContent = stage.readingHint || "";
      $$("[data-vr-stage]").forEach((btn) => {
        btn.setAttribute("aria-pressed", String(Number(btn.dataset.vrStage) === safeIndex));
      });
      renderWeather(stageWeatherDescription(stage) || spec.weather?.kind || "");
      setWeather(stageWeatherLevels.get(stage.id) || stageDefaultWeatherLevel(stage), { persist: false });
      if (stageChanged || stage?.ambience || audioController.currentAmbienceKey) syncStageAmbience();
      window.dispatchEvent(new CustomEvent("vibereading:stage", { detail: { stage, index: safeIndex } }));
    }

    function initializeStageControls() {
      $$("[data-vr-stage]").forEach((control) => {
        const index = Number(control.dataset.vrStage);
        const stage = stages[index];
        if (!stage) return;
        if (!control.hasAttribute("aria-pressed")) control.setAttribute("aria-pressed", String(index === 0));
        if (!control.title) control.title = stage.sourceRange || (stage.chapters || []).join("、");
        if (!control.textContent.trim()) control.textContent = `${String(index + 1).padStart(2, "0")} ${stage.label}`;
      });
    }

    /* ── Guide ── */
    function renderGuideText(step) {
      const text = $("[data-vr-guide-text]");
      if (!text) return;
      const lines = splitGuideLines(step.text);
      text.innerHTML = lines.map((line, index) => {
        const role = index === 0 ? "vr-guide-line--strong" : (index === lines.length - 1 ? "vr-guide-line--soft" : "");
        return `<span class="vr-guide-line ${role}">${escapeHtml(line)}</span>`;
      }).join("");
    }

    function guideFocusForStep(_step, index) {
      // Simplified: guide uses full-screen atmospheric art, not focus-point targeting
      const presets = [
        { x: "50%", y: "50%", spotlight: false },
        { x: "55%", y: "45%", spotlight: false },
        { x: "50%", y: "55%", spotlight: false },
        { x: "45%", y: "50%", spotlight: false }
      ];
      return presets[index % presets.length];
    }

    function setGuideFocus(step, index) {
      ensureGuideLayer("data-vr-guide-focus", "vr-guide-focus");
      const focus = guideFocusForStep(step, index);
      root.style.setProperty("--vr-guide-focus-x", focus.x);
      root.style.setProperty("--vr-guide-focus-y", focus.y);
      root.dataset.vrGuideSpotlight = String(focus.spotlight);
      if (guideArtEngine?.setFocus) guideArtEngine.setFocus(focus, index);
    }

    function destroyGuideArt() {
      if (!guideArtEngine) return;
      guideArtEngine.destroy();
      guideArtEngine = null;
    }

    /* ── Guide art (full-screen atmospheric preset — no crosshair, no center circle) ── */
    function createGuideArt() {
      const layer = ensureGuideLayer("data-vr-guide-art", "vr-guide-art");
      if (!layer || guideArtEngine) return;
      if (!window.p5) { layer.dataset.vrGuideArtEngine = "css"; return; }
      layer.dataset.vrGuideArtEngine = "p5";
      let instance = null;
      const motion = root.dataset.vrGuideMotion || templateId;
      const sketch = (p) => {
        let particles = [];
        let reduceMotion = false;
        let currentStep = 0;

        function rebuild() {
          reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const count = reduceMotion ? 18 : 70;
          particles = Array.from({ length: count }, function (_, i) {
            return {
              x: Math.random() * p.width, y: Math.random() * p.height,
              seed: Math.random() * 1000, size: 0.8 + Math.random() * 2.5,
              life: Math.random() * 300, delay: i / count
            };
          });
        }

        p.setup = function () {
          var canvas = p.createCanvas(layer.clientWidth || window.innerWidth, layer.clientHeight || window.innerHeight);
          canvas.parent(layer);
          p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
          p.frameRate(24);
          rebuild();
        };

        p.windowResized = function () {
          p.resizeCanvas(layer.clientWidth || window.innerWidth, layer.clientHeight || window.innerHeight);
          rebuild();
        };

        /* Read current guide step from DOM */
        function getStep() {
          return parseInt(root.dataset.vrGuidePhase || "0", 10);
        }

        p.draw = function () {
          p.clear();
          var time = p.frameCount * 0.016;
          currentStep = getStep();
          var stepT = Math.min(1, currentStep / 2); /* 0..1 across 3 steps */

          /* ── Window presets ── */
          if (motion === "window-fog-clear" || motion === "window") {
            /* Fog clearing: mist wisps that thin with each step */
            var fogAlpha = Math.max(3, 14 - stepT * 12);
            for (var i = 0; i < 10; i++) {
              var baseX = p.width * (0.1 + (i / 10) * 0.8);
              var t = time * 0.5 + i * 1.5;
              var y1 = p.noise(t, i * 0.3) * p.height;
              var y2 = p.noise(t + 5, i * 0.3 + 2) * p.height;
              p.stroke(220, 235, 240, reduceMotion ? fogAlpha * 0.5 : fogAlpha);
              p.strokeWeight(1.2 + Math.sin(t * 0.4) * 0.6);
              p.noFill();
              p.beginShape();
              p.curveVertex(baseX + Math.sin(t * 0.3) * 50, y1);
              p.curveVertex(baseX + Math.sin(t * 0.3) * 50, y1);
              p.curveVertex(baseX + Math.cos(t * 0.2) * 35, (y1 + y2) / 2);
              p.curveVertex(baseX - Math.sin(t * 0.4) * 40, y2);
              p.curveVertex(baseX - Math.sin(t * 0.4) * 40, y2);
              p.endShape();
            }
            /* Light shaft grows with step */
            if (currentStep >= 1) {
              var shaftAlpha = (currentStep === 1 ? 8 : 15) * (reduceMotion ? 0.5 : 1);
              var ctx = p.drawingContext;
              ctx.save();
              ctx.globalCompositeOperation = "screen";
              p.noStroke();
              p.fill(240, 245, 255, shaftAlpha);
              var sx = p.width * 0.6;
              p.quad(sx - 20, 0, sx + 60, 0, sx + 120 + stepT * 40, p.height, sx - 40 + stepT * 20, p.height);
              ctx.restore();
            }
          } else if (motion === "window-rain-reveal") {
            /* Rain traces on glass: diagonal streaks that clear */
            var streakAlpha = Math.max(5, 20 - stepT * 18);
            for (var i = 0; i < 12; i++) {
              var sx = p.noise(i * 0.5, time * 0.1) * p.width;
              var sy = (time * 30 + i * 80) % (p.height + 100) - 50;
              p.stroke(200, 220, 235, reduceMotion ? streakAlpha * 0.4 : streakAlpha);
              p.strokeWeight(0.6 + Math.sin(i) * 0.3);
              p.line(sx, sy, sx - 8, sy + 25 + Math.sin(time + i) * 5);
            }
            /* Glass reflection edge */
            if (currentStep >= 2) {
              p.stroke(255, 255, 255, 12);
              p.strokeWeight(1);
              p.line(p.width * 0.3, 0, p.width * 0.3, p.height);
            }
          } else if (motion === "window-light-shaft") {
            /* Diagonal light beam that expands */
            var beamWidth = 30 + stepT * 80;
            var beamAlpha = 6 + stepT * 10;
            var ctx = p.drawingContext;
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            p.noStroke();
            p.fill(245, 240, 220, reduceMotion ? beamAlpha * 0.4 : beamAlpha);
            var bx = p.width * 0.55;
            p.quad(bx - beamWidth * 0.3, 0, bx + beamWidth * 0.7, 0,
              bx + beamWidth + stepT * 60, p.height, bx - beamWidth * 0.5, p.height);
            ctx.restore();
            /* Dust motes in the beam */
            for (var i = 0; i < 15; i++) {
              var mx = bx + p.noise(i, time * 0.05) * beamWidth * 2 - beamWidth;
              var my = p.noise(i + 100, time * 0.03) * p.height;
              p.noStroke();
              p.fill(255, 245, 210, 40 + Math.sin(time * 1.5 + i) * 20);
              p.circle(mx, my, 1.5);
            }
          }

          /* ── Vinyl presets ── */
          else if (motion === "vinyl-needle-descent" || motion === "vinyl-groove-orbit") {
            /* Concentric grooves that activate with step */
            var cx = p.width / 2, cy = p.height / 2;
            p.noFill();
            var activeGrooves = 3 + currentStep * 4;
            for (var i = 0; i < activeGrooves; i++) {
              var r = 40 + i * 45;
              var a = reduceMotion ? 5 : 8 + Math.sin(time * 1.2 + i * 0.8) * 4;
              p.stroke(255, 230, 184, a);
              p.strokeWeight(0.7);
              p.circle(cx, cy, r + Math.sin(time + i * 0.3) * 4);
            }
            /* Needle shadow (step 1+) */
            if (currentStep >= 1) {
              var needleAngle = -0.3 + stepT * 0.5;
              var nx = cx + Math.cos(needleAngle) * 120;
              var ny = cy + Math.sin(needleAngle) * 120;
              p.stroke(200, 180, 140, 15);
              p.strokeWeight(2);
              p.line(cx + 80, cy - 60, nx, ny);
            }
          } else if (motion === "vinyl-groove-resonance") {
            /* Resonance waves emanating from center */
            var cx = p.width / 2, cy = p.height / 2;
            p.noFill();
            var waveCount = 2 + currentStep * 3;
            for (var i = 0; i < waveCount; i++) {
              var r = 30 + i * 60 + Math.sin(time * 0.8 + i) * 10;
              var a = reduceMotion ? 4 : 7 + Math.sin(time + i * 1.2) * 3;
              p.stroke(255, 225, 175, a);
              p.strokeWeight(0.8);
              p.ellipse(cx, cy, r * 2, r * 1.4);
            }
          } else if (motion === "vinyl-dust-orbit") {
            /* Dust particles orbiting a central point */
            var cx = p.width / 2, cy = p.height / 2;
            var orbitCount = 8 + currentStep * 6;
            p.noStroke();
            for (var i = 0; i < orbitCount; i++) {
              var angle = time * 0.3 + (i / orbitCount) * Math.PI * 2;
              var dist = 60 + i * 15 + Math.sin(time * 0.5 + i) * 10;
              var dx = cx + Math.cos(angle) * dist;
              var dy = cy + Math.sin(angle) * dist * 0.6;
              var a = reduceMotion ? 30 : 50 + Math.sin(time * 1.5 + i) * 20;
              p.fill(255, 240, 200, a);
              p.circle(dx, dy, 1.5 + Math.sin(time + i) * 0.5);
            }
          }

          /* ── Instrument presets ── */
          else if (motion === "instrument-signal-lock" || motion === "instrument-scan-lock") {
            /* Scanlines that stabilize with step */
            var stability = stepT;
            p.stroke(150, 230, 150, reduceMotion ? 8 : 14);
            p.strokeWeight(0.5);
            var scanY = (time * 30) % p.height;
            for (var y = 0; y < p.height; y += 6) {
              var wobble = (1 - stability) * Math.sin(y * 0.05 + time * 3) * 8;
              var dist = Math.abs(y - scanY);
              var a = dist < 25 ? (25 - dist) / 25 : 0;
              p.stroke(150, 230, 150, a * (reduceMotion ? 15 : 35));
              p.line(wobble, y, p.width + wobble, y);
            }
            /* Lock indicator (step 2) */
            if (currentStep >= 2) {
              p.fill(150, 230, 150, 30);
              p.noStroke();
              p.rect(p.width * 0.45, p.height * 0.48, p.width * 0.1, 4, 2);
            }
          } else if (motion === "instrument-dial-seek") {
            /* Frequency dial sweeping */
            var dialX = p.width * 0.5;
            var sweepPos = (time * 0.2 + stepT * 0.3) % 1;
            var dialY = p.height * 0.3 + sweepPos * p.height * 0.4;
            p.stroke(150, 230, 150, 12);
            p.strokeWeight(0.4);
            for (var y = p.height * 0.2; y < p.height * 0.8; y += 4) {
              p.line(dialX - 60, y, dialX + 60, y);
            }
            /* Pointer line */
            p.stroke(200, 255, 200, reduceMotion ? 20 : 35);
            p.strokeWeight(1.5);
            p.line(dialX - 50, dialY, dialX + 50, dialY);
          } else if (motion === "instrument-device-wake") {
            /* CRT warm-up glow */
            var glowRadius = 50 + stepT * Math.min(p.width, p.height) * 0.4;
            var ctx = p.drawingContext;
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            var gradient = ctx.createRadialGradient(p.width / 2, p.height / 2, 0, p.width / 2, p.height / 2, glowRadius);
            gradient.addColorStop(0, "rgba(150,230,150," + (0.06 + stepT * 0.04) + ")");
            gradient.addColorStop(1, "rgba(150,230,150,0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, p.width, p.height);
            ctx.restore();
          }

          /* ── Route presets ── */
          else if (motion === "route-path-draw" || motion === "route-path-light") {
            /* Path line drawing forward */
            var progress = 0.3 + stepT * 0.7;
            p.noFill();
            p.stroke(255, 224, 164, reduceMotion ? 14 : 28);
            p.strokeWeight(1.5);
            p.beginShape();
            var pts = 10;
            for (var i = 0; i < pts * progress; i++) {
              var x = p.width * (0.05 + (i / pts) * 0.9);
              var y = p.height * 0.6 + Math.sin(i * 0.6) * 25;
              p.curveVertex(x, y);
            }
            p.endShape();
            /* Station dots */
            for (var i = 0; i < 3 * progress; i++) {
              var x = p.width * (0.15 + i * 0.25);
              var y = p.height * 0.6 + Math.sin(i * 0.6) * 25;
              p.fill(255, 224, 164, reduceMotion ? 25 : 45);
              p.noStroke();
              p.circle(x, y, 5);
            }
          } else if (motion === "route-distant-lights") {
            /* Distant light points appearing */
            var lightCount = 2 + currentStep * 2;
            p.noStroke();
            for (var i = 0; i < lightCount; i++) {
              var lx = p.width * (0.2 + i * 0.2);
              var ly = p.height * (0.3 + Math.sin(i * 1.5) * 0.15);
              var la = reduceMotion ? 15 : 25 + Math.sin(time + i * 2) * 10;
              var cache = p._cache;
              if (cache) {
                var sprite = cache.radial({ radius: 20, color: [255, 224, 164], alpha: 0.3, midAlpha: 0.05 });
                cache.draw(sprite, lx, ly, 40, 40, "screen", la);
              } else {
                p.fill(255, 224, 164, la);
                p.circle(lx, ly, 6);
              }
            }
          } else if (motion === "route-map-wind") {
            /* Wind-swept map texture lines */
            for (var i = 0; i < 8; i++) {
              var baseX = p.width * (0.1 + (i / 8) * 0.8);
              var t = time * 0.4 + i * 1.3;
              var y = p.noise(t, i * 0.4) * p.height;
              var windOffset = Math.sin(time * 0.6 + i) * 20 * (1 + stepT);
              p.stroke(255, 220, 160, reduceMotion ? 5 : 10);
              p.strokeWeight(0.6);
              p.line(baseX + windOffset, y, baseX + windOffset + 40, y + 5);
            }
          }

          /* ── Oracle presets ── */
          else if (motion === "oracle-table-reveal" || motion === "oracle-card-reveal") {
            /* Table cloth texture: subtle horizontal lines */
            p.stroke(255, 220, 170, reduceMotion ? 4 : 7);
            p.strokeWeight(0.3);
            for (var y = 0; y < p.height; y += 12) {
              p.line(0, y, p.width, y);
            }
            /* Candle glow (grows with step) */
            var glowSize = 30 + stepT * 60;
            var ctx = p.drawingContext;
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            var gradient = ctx.createRadialGradient(p.width * 0.5, p.height * 0.35, 0, p.width * 0.5, p.height * 0.35, glowSize);
            gradient.addColorStop(0, "rgba(255,220,170," + (0.08 + stepT * 0.05) + ")");
            gradient.addColorStop(1, "rgba(255,220,170,0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, p.width, p.height);
            ctx.restore();
          } else if (motion === "oracle-card-turn") {
            /* Card silhouettes that rotate */
            for (var i = 0; i < 3; i++) {
              var cx = p.width * (0.3 + i * 0.2);
              var cy = p.height * 0.5;
              var angle = (i === currentStep % 3) ? stepT * 0.3 : 0;
              p.push();
              p.translate(cx, cy);
              p.rotate(angle);
              p.noFill();
              p.stroke(255, 220, 170, reduceMotion ? 10 : 18);
              p.strokeWeight(0.8);
              p.rect(-18, -28, 36, 56, 3);
              p.pop();
            }
          } else if (motion === "oracle-symbol-bloom") {
            /* Ink bloom: expanding circles from center */
            var cx = p.width / 2, cy = p.height / 2;
            var bloomCount = 1 + currentStep;
            p.noStroke();
            for (var i = 0; i < bloomCount; i++) {
              var r = 20 + i * 40 + Math.sin(time * 0.5 + i) * 8;
              var a = reduceMotion ? 4 : 8 - i * 2;
              p.fill(255, 220, 170, Math.max(2, a));
              p.circle(cx, cy, r * 2);
            }
          }

          /* ── Ambient particles (shared across all presets) ── */
          p.noStroke();
          var pr = 255, pg = 232, pb = 181;
          if (motion.includes("instrument")) { pr = 150; pg = 230; pb = 150; }
          else if (motion.includes("route")) { pr = 255; pg = 210; pb = 126; }
          else if (motion.includes("window")) { pr = 220; pg = 235; pb = 240; }
          for (var i = 0; i < particles.length; i++) {
            var pt = particles[i];
            if (!reduceMotion) {
              pt.x += Math.sin(time * 0.3 + pt.seed) * 0.5;
              pt.y += motion.includes("window") ? 0.6 : Math.cos(time * 0.2 + pt.seed) * 0.3;
              pt.life += 1;
            }
            if (pt.y > p.height + 10) { pt.y = -10; pt.x = Math.random() * p.width; }
            if (pt.y < -10) { pt.y = p.height + 10; }
            var flicker = 0.25 + Math.sin(time * 2 + pt.seed) * 0.15;
            p.fill(pr, pg, pb, flicker * (reduceMotion ? 50 : 80));
            p.circle(pt.x, pt.y, pt.size * 1.5);
          }
        };

        p.vrSetGuideFocus = function () { /* no-op: guide uses full-screen atmospheric art */ };
      };
      instance = new window.p5(sketch);
      guideArtEngine = {
        setFocus: function () { /* no-op */ },
        destroy() { if (instance) instance.remove(); instance = null; layer.replaceChildren(); }
      };
    }

    function showGuideStep(index) {
      const step = guideSteps[index];
      if (!step) return;
      guideIndex = index;
      root.dataset.vrGuideStep = step.id;
      root.dataset.vrGuidePhase = String(index);
      root.dataset.vrGuideAnimate = "false";
      setGuideFocus(step, index);
      const eyebrow = $("[data-vr-guide-eyebrow]");
      const emphasis = $("[data-vr-guide-emphasis]");
      const next = $("[data-vr-guide-next]");
      renderGuideText(step);
      if (eyebrow) eyebrow.textContent = step.eyebrow || spec.entryGuide?.eyebrow || "";
      if (emphasis) emphasis.textContent = step.emphasis || "";
      if (next) next.textContent = index >= guideSteps.length - 1
        ? (isChinese ? "进入阅读" : "Start Reading")
        : (isChinese ? "继续" : "Continue");
      window.requestAnimationFrame(() => { root.dataset.vrGuideAnimate = "true"; });
      window.dispatchEvent(new CustomEvent("vibereading:guide-step", { detail: step }));
    }

    function runGuide() {
      clearGuideTimers();
      root.dataset.vrMode = "guide";
      root.dataset.vrGuideExiting = "false";
      createGuideArt();
      const guide = $("[data-vr-guide]");
      const start = $("[data-vr-guide-start]");
      const next = $("[data-vr-guide-next]");
      const skip = $("[data-vr-guide-skip]");
      if (guide) guide.hidden = false;
      if (start) start.hidden = true;
      if (next) next.hidden = false;
      if (skip) skip.hidden = false;
      const title = $("[data-vr-book-title]");
      const invitation = $("[data-vr-guide-invitation]");
      if (title) title.hidden = true;
      if (invitation) invitation.hidden = true;
      showGuideStep(0);
    }

    function advanceGuide() {
      if (guideIndex >= guideSteps.length - 1) { enterReading(); return; }
      showGuideStep(guideIndex + 1);
    }

    function clearGuideTimers() {
      guideTimers.forEach((t) => window.clearTimeout(t));
      guideTimers = [];
    }

    function enterReading() {
      clearGuideTimers();
      destroyGuideArt();
      const guide = $("[data-vr-guide]");
      root.dataset.vrGuideExiting = "true";
      guideTimers.push(window.setTimeout(() => {
        root.dataset.vrMode = "reading";
        root.dataset.vrGuideExiting = "false";
        if (guide) guide.hidden = true;
        selectStage(0);
        startTimer();
        window.dispatchEvent(new CustomEvent("vibereading:guide-complete"));
      }, 1250));
    }

    /* ── Note export ── */
    function saveNote() {
      const textarea = $("[data-vr-note-textarea]");
      if (!textarea) return;
      const text = textarea.value.trim();
      if (!text) return;
      if (window.VibeReadingNoteShare?.saveMarkdown) {
        const result = window.VibeReadingNoteShare.saveMarkdown({
          bookTitle: spec.book?.title || "VibeReading",
          author: spec.book?.author || "",
          stageLabel: stages[activeStageIndex]?.label || "",
          stageSubtitle: stages[activeStageIndex]?.readingHint || "",
          note: text,
          filenamePrefix: spec.book?.title || "vibereading"
        });
        if (result?.message) showToast(result.message);
      }
    }

    function showToast(msg) {
      let toast = $("[data-vr-toast]");
      if (!toast) {
        toast = document.createElement("div");
        toast.className = "vr-toast";
        toast.setAttribute("data-vr-toast", "");
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.classList.add("vr-toast--visible");
      setTimeout(() => toast.classList.remove("vr-toast--visible"), 2500);
    }

    /* ── Click handler ── */
    document.addEventListener("click", async (event) => {
      const target = event.target.closest(
        "[data-vr-guide-start], [data-vr-guide-next], [data-vr-guide-skip], [data-vr-guide-replay], " +
        "[data-vr-sound-toggle], [data-vr-weather-level], [data-vr-stage], " +
        "[data-vr-timer-toggle], [data-vr-timer-reset], [data-vr-timer-mode], " +
        "[data-vr-bgm-volume], [data-vr-ambience-volume], [data-vr-note-save]"
      );
      if (!target) return;

      if (target.matches("[data-vr-guide-start]")) {
        await beginSound();
        runGuide();
      } else if (target.matches("[data-vr-guide-next]")) {
        advanceGuide();
      } else if (target.matches("[data-vr-guide-skip]")) {
        await beginSound();
        enterReading();
      } else if (target.matches("[data-vr-guide-replay]")) {
        stopTimer();
        resetTimerForMode();
        await beginSound();
        runGuide();
      } else if (target.matches("[data-vr-sound-toggle]")) {
        await setSoundEnabled(!audioController.soundEnabled);
      } else if (target.matches("[data-vr-weather-level]")) {
        setWeather(target.dataset.vrWeatherLevel);
      } else if (target.matches("[data-vr-stage]")) {
        selectStage(Number(target.dataset.vrStage));
      } else if (target.matches("[data-vr-timer-toggle]")) {
        if (timerRunning) stopTimer(); else startTimer();
      } else if (target.matches("[data-vr-timer-reset]")) {
        resetTimer();
      } else if (target.matches("[data-vr-note-save]")) {
        saveNote();
      }
    });

    document.addEventListener("input", (event) => {
      if (event.target.matches("[data-vr-bgm-volume]")) {
        setBgmVolume(Number(event.target.value));
      } else if (event.target.matches("[data-vr-ambience-volume]")) {
        setAmbienceVolume(Number(event.target.value));
      }
    });

    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-vr-timer-mode]")) {
        timerKind = event.target.value === "pomodoro" ? "pomodoro" : "elapsed";
        resetTimer();
      }
    });

    window.addEventListener("beforeunload", () => {
      audioController.stopAll();
      destroyWeatherEngine();
      destroyGuideArt();
      pointer.destroy();
    });

    /* ── Visibility pause — stop visual updates when hidden ── */
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        /* Pause all active weather engines */
        if (weatherEngine && weatherEngine._clock) weatherEngine._clock.pause();
      } else {
        /* Resume and reset clock to avoid dt spike */
        if (weatherEngine && weatherEngine._clock) {
          weatherEngine._clock.resume();
          weatherEngine._clock.reset();
        }
      }
    });

    /* ── Initialize ── */
    initializeStageControls();
    root.dataset.vrMode = "home";
    root.dataset.vrSound = "on";
    root.dataset.vrWeatherLevel = weatherLevel;
    resetTimerForMode();
    setWeather(weatherLevel, { persist: false });
    selectStage(0);
  }

  if (typeof window !== "undefined") {
    window.__VIBE_READING_TEST_HOOKS = Object.assign({}, window.__VIBE_READING_TEST_HOOKS, {
      createAudioController,
      createFrameClock,
      createPointerTracker,
      createGradientSpriteCache,
      createParticlePool,
      getIntensityProfile,
      smoothFalloff,
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
