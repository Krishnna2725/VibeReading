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
    "vinyl-groove-orbit",
    "instrument-scan-lock",
    "route-path-light",
    "oracle-card-reveal"
  ];

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
    const ambienceTracks = (spec.audio?.ambienceFiles || []).map((file) => new Audio(file));
    let activeAudio = null;
    let activeAudioSource = null;
    let bgmVolume = 0.45;
    let ambienceVolume = 0.32;
    let weatherLevel = spec.weather?.defaultLevel || "low";

    /* ── Guide ── */
    const fallbackGuideSteps = [
      { id: "settle", text: "Don't rush to turn the page. Let the sound and weather arrive first.", emphasis: "Breathe in slowly, pause." },
      { id: "orient", text: "This is your posture for entering the book — no plot hints, no answers.", emphasis: "Set aside judgment for now." },
      { id: "begin", text: "When the scene settles, begin reading from the current chapter.", emphasis: "Open the controls when you need them." }
    ];
    const guideSteps = spec.entryGuide?.steps?.length ? spec.entryGuide.steps : fallbackGuideSteps;
    const stages = spec.stages || [];
    const uiLanguage = spec.bookDirection?.uiLanguage || spec.book?.uiLanguage || "English";
    const isChinese = /^zh/i.test(uiLanguage);
    const bookTitle = $("[data-vr-book-title]");
    if (bookTitle) bookTitle.textContent = spec.book?.title || (isChinese ? "开始阅读" : "Start Reading");
    root.dataset.vrTemplate = templateId;

    /* Resolve guide motion preset */
    const rawMotion = String(spec.entryGuide?.motion || spec.entryGuide?.layout || templateId).toLowerCase();
    const guideMotion = GUIDE_MOTION_PRESETS.find((p) => rawMotion.includes(p.split("-")[0])) || rawMotion;
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
    let soundEnabled = true;

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

    function parseAccent(value, fallback) {
      const match = /^#([0-9a-f]{6})$/i.exec(String(value || "").trim());
      if (!match) return fallback.slice();
      const hex = match[1];
      return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
    }

    function effectWithAccent(effect, accent) {
      const tint = parseAccent(accent, effect.color);
      return {
        ...effect,
        color: effect.color.map((channel, index) => Math.round(channel * 0.72 + tint[index] * 0.28))
      };
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
      return stage?.weatherLevel || spec.weather?.defaultLevel || "low";
    }

    /* ──────────────────────────────────────────────────────────
       P5 EFFECT PRESETS — one per weather kind
       ────────────────────────────────────────────────────────── */
    const VIBE_EFFECTS = {
      rain: {
        count: 78, color: [210, 225, 235], gravity: 7.5,
        draw(p, particle, profile, reduceMotion) {
          const [r, g, b] = profile.color;
          p.stroke(r, g, b, 120);
          p.strokeWeight(1);
          p.line(particle.x, particle.y, particle.x + particle.vx * 1.6, particle.y + particle.size);
          if (particle.splash > 0) {
            p.noFill();
            p.stroke(r, g, b, particle.splash * 70);
            p.ellipse(particle.x, p.height - 8, particle.splash * 32, particle.splash * 8);
            particle.splash *= 0.78;
          }
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) { particle.x += particle.vx; particle.y += particle.vy; }
          if (particle.y + particle.size >= p.height - 4) {
            particle.splash = 1;
            particle.x = Math.random() * p.width;
            particle.y = -30;
          } else if (particle.y > p.height + particle.size || particle.x > p.width + particle.size || particle.x < -particle.size * 1.4) {
            particle.x = Math.random() * p.width;
            particle.y = -particle.size;
            particle.vx = -0.8 + Math.random() * 0.9;
            particle.vy = 7 + Math.random() * 7;
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: Math.random() * h, vx: -0.8 + Math.random() * 0.9, vy: 7 + Math.random() * 7, size: 10 + Math.random() * 24, life: Math.random() * 100, splash: 0 };
        }
      },

      "storm-rain": {
        count: 120, color: [180, 195, 210], gravity: 9.5, windX: -2.5,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          p.stroke(r, g, b, 100);
          p.strokeWeight(1.5);
          p.line(particle.x, particle.y, particle.x + particle.vx * 2.2, particle.y + particle.size * 1.2);
          if (particle.splash > 0) {
            p.noFill();
            p.stroke(r, g, b, particle.splash * 55);
            p.ellipse(particle.x, p.height - 6, particle.splash * 40, particle.splash * 10);
            particle.splash *= 0.82;
          }
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) { particle.x += particle.vx; particle.y += particle.vy; }
          if (particle.y + particle.size >= p.height - 4) {
            particle.splash = 1;
            particle.x = Math.random() * p.width;
            particle.y = -30;
          } else if (particle.y > p.height + particle.size || particle.x < -particle.size * 2) {
            particle.x = Math.random() * p.width;
            particle.y = -particle.size;
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: Math.random() * h, vx: -2.5 + Math.random() * 1.2, vy: 9 + Math.random() * 7, size: 14 + Math.random() * 28, life: Math.random() * 100, splash: 0 };
        }
      },

      fog: {
        count: 16, color: [210, 222, 222], gravity: 0.18, drift: 0.55, mist: true,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const alpha = 0.035 + Math.sin(particle.life * 0.01 + particle.seed) * 0.012;
          const radius = particle.size * 0.9;
          const ctx = p.drawingContext;
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, radius * 0.08,
            particle.x, particle.y, radius
          );
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
          gradient.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${alpha * 0.58})`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.save();
          ctx.fillStyle = gradient;
          ctx.fillRect(particle.x - radius, particle.y - radius, radius * 2, radius * 2);
          ctx.restore();
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) {
            // Noise-based drift
            const driftX = p.noise(particle.life * 0.003, particle.seed) * 1.5 - 0.75;
            const driftY = p.noise(particle.seed + 400, particle.life * 0.002) * 0.4 - 0.2;
            particle.x += driftX;
            particle.y += driftY;
            particle.life += 1;
          }
          if (particle.x > p.width + particle.size || particle.x < -particle.size) {
            particle.x = -p.width * 0.2 + Math.random() * p.width * 0.3;
            particle.y = Math.random() * p.height;
          }
        },
        initParticle(w, h) {
          return { x: -w * 0.2 + Math.random() * w * 1.4, y: Math.random() * h, vx: 0.12, vy: 0, size: 80 + Math.random() * 220, life: Math.random() * 100, splash: 0, seed: Math.random() * 1000 };
        }
      },

      snow: {
        count: 56, color: [245, 246, 238], gravity: 1.2, drift: 0.9,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const alpha = 80 + Math.sin(particle.life * 0.02 + particle.seed) * 35;
          p.noStroke();
          // Outer glow for depth
          p.fill(r, g, b, alpha * 0.3);
          p.circle(particle.x, particle.y, particle.size * 4);
          // Core
          p.fill(r, g, b, alpha);
          p.circle(particle.x, particle.y, particle.size * 2);
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) {
            // Noise-based wind drift instead of simple random
            const windX = p.noise(particle.life * 0.006, particle.seed) * 2 - 1;
            const windY = p.noise(particle.seed + 200, particle.life * 0.004) * 0.5;
            particle.x += particle.vx + windX * 0.8;
            particle.y += particle.vy + windY;
            particle.life += 1;
          }
          if (particle.y > p.height + particle.size) {
            particle.x = Math.random() * p.width;
            particle.y = -particle.size;
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.6, vy: 1.2 * (0.3 + Math.random() * 0.7), size: 1 + Math.random() * 3, life: Math.random() * 100, splash: 0, seed: Math.random() * 1000 };
        }
      },

      wind: {
        count: 48, color: [236, 232, 214], gravity: 0.5, drift: 5.5, streak: true,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const alpha = 50 + Math.sin(particle.life * 0.03 + particle.seed) * 22;
          p.stroke(r, g, b, alpha);
          p.strokeWeight(0.8);
          // Curved streak using noise
          p.noFill();
          p.beginShape();
          for (let i = 0; i < 4; i++) {
            const t = particle.life + i * 3;
            const wobble = p.noise(t * 0.02, particle.seed) * 16 - 8;
            p.curveVertex(particle.x + i * particle.size * 0.3, particle.y + wobble);
          }
          p.endShape();
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) {
            // Noise-based wind gusts
            const gust = p.noise(particle.life * 0.01, particle.seed) * 3;
            particle.x += particle.vx + gust;
            particle.y += particle.vy + p.noise(particle.seed + 300, particle.life * 0.008) * 1.5 - 0.75;
            particle.life += 1;
          }
          if (particle.x > p.width + particle.size) {
            particle.x = -p.width * 0.2;
            particle.y = Math.random() * p.height;
          }
        },
        initParticle(w, h) {
          return { x: -w * 0.2 + Math.random() * w * 1.2, y: Math.random() * h, vx: 3 + Math.random() * 7, vy: (Math.random() - 0.5) * 0.7, size: 30 + Math.random() * 120, life: Math.random() * 100, splash: 0, seed: Math.random() * 1000 };
        }
      },

      ripple: {
        count: 12, color: [180, 200, 220], gravity: 0, drift: 0,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          p.noFill();
          p.stroke(r, g, b, 40 + particle.life * 0.3);
          p.strokeWeight(0.8);
          const radius = particle.size * (1 + particle.life * 0.08);
          p.circle(particle.x, particle.y, radius);
          if (radius > 20) {
            p.stroke(r, g, b, 20 + particle.life * 0.15);
            p.circle(particle.x, particle.y, radius * 0.6);
          }
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) particle.life += 0.5;
          if (particle.life > 100) {
            particle.x = Math.random() * p.width;
            particle.y = Math.random() * p.height;
            particle.life = 0;
            particle.size = 10 + Math.random() * 30;
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, size: 10 + Math.random() * 30, life: Math.random() * 80, splash: 0 };
        }
      },

      water: {
        count: 20, color: [160, 195, 215], gravity: 0, drift: 0,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          p.noFill();
          p.stroke(r, g, b, 30 + Math.sin(particle.life * 0.05) * 15);
          p.strokeWeight(0.6);
          const wave = Math.sin(particle.life * 0.03 + particle.x * 0.01) * 12;
          p.beginShape();
          for (let i = 0; i < 5; i++) {
            const wx = particle.x + (i - 2) * 30;
            const wy = particle.y + Math.sin(particle.life * 0.04 + i * 0.8) * 6 + wave;
            p.curveVertex(wx, wy);
          }
          p.endShape();
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
          p.noStroke();
          p.fill(r, g, b, 115);
          p.circle(particle.x, particle.y, particle.size * 2);
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) { particle.x += particle.vx; particle.y += particle.vy; particle.life += 1; }
          if (particle.y > p.height + particle.size || particle.x > p.width + particle.size || particle.x < -particle.size) {
            particle.x = Math.random() * p.width;
            particle.y = -particle.size;
            particle.vx = (Math.random() - 0.5) * 0.9;
            particle.vy = 0.45 * (0.45 + Math.random() * 0.9);
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.9, vy: 0.45 * (0.45 + Math.random() * 0.9), size: 0.8 + Math.random() * 2.8, life: Math.random() * 100, splash: 0 };
        }
      },

      embers: {
        count: 32, color: [255, 160, 60], gravity: -0.8, drift: 0.6,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const glow = 0.4 + Math.sin(particle.life * 0.1) * 0.3;
          p.noStroke();
          p.fill(r, g, b, glow * 200);
          p.circle(particle.x, particle.y, particle.size * 2);
          p.fill(255, 200, 100, glow * 80);
          p.circle(particle.x, particle.y, particle.size * 5);
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
          p.noStroke();
          p.push();
          p.translate(particle.x, particle.y);
          p.rotate((particle.vx + Math.sin(particle.life * 0.035)) * 0.09);
          p.fill(255, 86, 18, flicker * 34);
          p.ellipse(0, 0, particle.size * 7, particle.size * 15);
          p.fill(r, g, b, flicker * 145);
          p.ellipse(0, particle.size * 1.2, particle.size * 3.6, particle.size * 9);
          p.fill(255, 228, 142, flicker * 205);
          p.ellipse(0, particle.size * 2.2, particle.size * 1.4, particle.size * 4.5);
          p.pop();
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) {
            const turbulence = p.noise(particle.life * 0.03, particle.seed) * 2 - 1;
            particle.x += particle.vx + turbulence * 1.2;
            particle.y += particle.vy;
            particle.life += 1;
          }
          if (particle.y < -particle.size * 2 || particle.life > 100) {
            particle.x = Math.random() * p.width;
            particle.y = p.height * 0.48 + Math.random() * p.height * 0.5;
            particle.life = 0;
            particle.vx = (Math.random() - 0.5) * 1;
            particle.vy = -1.2 * (0.3 + Math.random() * 0.7);
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: h * 0.48 + Math.random() * h * 0.5, vx: (Math.random() - 0.5) * 1, vy: -1.2 * (0.3 + Math.random() * 0.7), size: 1 + Math.random() * 3, life: Math.random() * 80, splash: 0, seed: Math.random() * 1000 };
        }
      },

      signal: {
        count: 24, color: [150, 230, 150], gravity: 0, drift: 0,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          p.stroke(r, g, b, 25 + Math.sin(particle.life * 0.08) * 15);
          p.strokeWeight(0.8);
          const y = particle.y;
          const wobble = Math.sin(particle.life * 0.15 + y * 0.03) * (3 + particle.size);
          p.line(0, y + wobble, p.width, y - wobble * 0.2);
          // Scanline bright spot
          if (Math.abs(y - (particle.life * 2) % p.height) < 20) {
            p.stroke(r, g, b, 50);
            p.strokeWeight(2);
            p.line(0, y, p.width, y);
          }
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) particle.life += 1;
          if (particle.life > 300) particle.life = 0;
        },
        initParticle(w, h) {
          return { x: 0, y: Math.random() * h, vx: 0, vy: 0, size: 1 + Math.random() * 3, life: Math.random() * 250, splash: 0 };
        }
      },

      paper: {
        count: 28, color: [220, 200, 170], gravity: 0.3, drift: 0.7,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const alpha = 0.3 + Math.sin(particle.life * 0.04) * 0.2;
          p.noStroke();
          p.fill(r, g, b, alpha * 255);
          // Small paper fiber shape
          p.push();
          p.translate(particle.x, particle.y);
          p.rotate(particle.life * 0.02);
          p.rect(-particle.size * 2, -particle.size * 0.4, particle.size * 4, particle.size * 0.8, 1);
          p.pop();
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) { particle.x += particle.vx + Math.sin(particle.life * 0.03) * 0.5; particle.y += particle.vy; particle.life += 1; }
          if (particle.y > p.height + particle.size || particle.life > 200) {
            particle.x = Math.random() * p.width;
            particle.y = -particle.size * 4;
            particle.life = 0;
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: -Math.random() * h * 0.3, vx: (Math.random() - 0.5) * 0.7, vy: 0.3 + Math.random() * 0.5, size: 1 + Math.random() * 2, life: Math.random() * 150, splash: 0 };
        }
      },

      stars: {
        count: 60, color: [220, 230, 255], gravity: 0, drift: 0.05,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const twinkle = 0.3 + Math.sin(particle.life * 0.05 + particle.seed) * 0.3;
          p.noStroke();
          p.fill(r, g, b, twinkle * 255);
          p.circle(particle.x, particle.y, particle.size * 2);
          if (particle.size > 2.5) {
            p.fill(r, g, b, twinkle * 40);
            p.circle(particle.x, particle.y, particle.size * 5);
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
          p.rotate(particle.rotation || 0);
          p.scale(0.68 + Math.abs(Math.sin(particle.life * 0.022 + particle.seed)) * 0.32, 1);
          // Leaf shape — pointed ellipse with notch
          p.fill(r, g, b, alpha * 200);
          p.beginShape();
          p.vertex(0, -sz * 2.5);          // tip
          p.bezierVertex(sz * 1.2, -sz * 1.5, sz * 1.5, -sz * 0.3, sz * 0.8, sz * 0.8);
          p.vertex(sz * 0.15, sz * 1.8);   // notch
          p.vertex(-sz * 0.15, sz * 1.8);
          p.vertex(-sz * 0.8, sz * 0.8);
          p.bezierVertex(-sz * 1.5, -sz * 0.3, -sz * 1.2, -sz * 1.5, 0, -sz * 2.5);
          p.endShape(p.CLOSE);
          // Leaf vein
          p.stroke(r * 0.65, g * 0.65, b * 0.65, alpha * 80);
          p.strokeWeight(0.4);
          p.line(0, -sz * 2.2, 0, sz * 1.5);
          // Side veins
          for (let v = -1; v <= 1; v += 1) {
            const vy = v * sz * 1.0;
            p.line(0, vy, sz * 0.6 * (v === 0 ? 0.5 : 1), vy - sz * 0.5);
            p.line(0, vy, -sz * 0.6 * (v === 0 ? 0.5 : 1), vy - sz * 0.5);
          }
          p.pop();
        },
        tick(particle, p, reduceMotion) {
          if (!reduceMotion) {
            const nx = p.noise(particle.life * 0.008, particle.seed) * 2 - 1;
            const ny = p.noise(particle.seed + 100, particle.life * 0.006) * 0.6;
            const parallax = 0.45 + (particle.depth || 0.5) * 0.8;
            particle.x += (particle.vx + nx * 1.5) * parallax;
            particle.y += (particle.vy + ny) * parallax;
            particle.rotation = (particle.rotation || 0) + nx * 0.04 + Math.sin(particle.life * 0.02) * 0.02;
            particle.life += 1;
          }
          if (particle.y > p.height + 20 || particle.x > p.width + 40 || particle.x < -40) {
            particle.x = Math.random() * p.width;
            particle.y = -20 - Math.random() * 40;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.life = 0;
            particle.depth = 0.3 + Math.random() * 0.7; // depth layer
          }
        },
        initParticle(w, h) {
          return { x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 1.2, vy: 0.4 + Math.random() * 0.8, size: 2 + Math.random() * 3, life: Math.random() * 200, splash: 0, seed: Math.random() * 1000, rotation: Math.random() * Math.PI * 2, depth: 0.3 + Math.random() * 0.7 };
        }
      },

      fireflies: {
        count: 24, color: [118, 242, 156], gravity: 0, drift: 0.3,
        draw(p, particle, profile) {
          const [r, g, b] = profile.color;
          const pulse = 0.3 + Math.sin(particle.life * 0.06 + particle.seed) * 0.35;
          const nearPointer = particle.nearPointer || 0;
          const extraBright = nearPointer * 0.3;
          p.noStroke();
          // Outer glow
          p.fill(r, g, b, pulse * 58 + extraBright * 28);
          p.circle(particle.x, particle.y, particle.size * 14);
          // Inner glow
          p.fill(r, g, b, pulse * 165 + extraBright * 70);
          p.circle(particle.x, particle.y, particle.size * 4);
          // Core
          p.fill(220, 255, 226, pulse * 235 + extraBright * 20);
          p.circle(particle.x, particle.y, particle.size * 1.5);
        },
        tick(particle, p, reduceMotion, peers = []) {
          if (!reduceMotion) {
            // Noise drift
            const nx = p.noise(particle.life * 0.005, particle.seed) * 2 - 1;
            const ny = p.noise(particle.seed + 50, particle.life * 0.004) * 2 - 1;
            particle.x += nx * 0.6 + particle.vx;
            particle.y += ny * 0.4 + particle.vy;
            particle.life += 1;
            // Flocking — simple neighbor attraction (find 1-2 nearest, pull gently)
            if (peers.length > 1) {
              let nearestDist = Infinity, nearest = null;
              for (const other of peers) {
                if (other === particle) continue;
                const dx = other.x - particle.x;
                const dy = other.y - particle.y;
                const d = dx * dx + dy * dy;
                if (d < nearestDist && d < 90000) { // within 300px
                  nearestDist = d;
                  nearest = other;
                }
              }
              if (nearest && nearestDist > 0) {
                const d = Math.sqrt(nearestDist);
                const pull = d < 34 ? -0.025 : d < 150 ? 0.012 : 0;
                particle.vx += (nearest.x - particle.x) / d * pull;
                particle.vy += (nearest.y - particle.y) / d * pull;
              }
            }
            // Damping
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            // Mouse interaction
            if (typeof pointerX === "number") {
              const mx = pointerX * p.width;
              const my = pointerY * p.height;
              const dx = particle.x - mx;
              const dy = particle.y - my;
              const dist = Math.sqrt(dx * dx + dy * dy);
              particle.nearPointer = dist < 120 ? (1 - dist / 120) : 0;
              if (dist < 100 && dist > 0) {
                particle.x += (dx / dist) * 0.8;
                particle.y += (dy / dist) * 0.5;
              }
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
          return { x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.2, size: 0.8 + Math.random() * 1.2, life: Math.random() * 400, splash: 0, seed: Math.random() * 1000, nearPointer: 0 };
        }
      }
    };

    /* ── Unified effect entry point (matches docs contract) ── */
    function renderEffect({ layer, kind, level, accent, reducedMotion }) {
      if (!layer) return null;
      const effectiveKind = normalizeWeatherKind(kind || "");
      const effectiveLevel = level || root.dataset.vrWeatherLevel || "low";
      const effectiveReducedMotion = typeof reducedMotion === "boolean"
        ? reducedMotion
        : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      return createP5Weather(layer, effectiveKind, {
        level: effectiveLevel,
        accent,
        reducedMotion: effectiveReducedMotion
      });
    }

    /* ── Canvas weather engine (fallback when p5 unavailable) ── */
    function createCanvasWeather(layer, kind, options = {}) {
      layer.dataset.vrWeatherEngine = "canvas";
      const baseEffect = VIBE_EFFECTS[kind] || VIBE_EFFECTS.dust;
      const effect = effectWithAccent(baseEffect, options.accent);
      const canvas = document.createElement("canvas");
      canvas.className = "vr-weather-canvas";
      layer.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      const reduceMotion = typeof options.reducedMotion === "boolean"
        ? options.reducedMotion
        : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let currentLevel = options.level || root.dataset.vrWeatherLevel || "low";
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
        const lvl = currentLevel;
        const mult = lvl === "medium" ? 1 : lvl === "off" ? 0 : 0.48;
        const count = reduceMotion ? Math.ceil(effect.count * 0.18) : Math.ceil(effect.count * mult);
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
              effect.tick(particle, { width, height, noise: Math.sin, noStroke(){} }, reduceMotion, particles);
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
        updateLevel(level) {
          currentLevel = level || root.dataset.vrWeatherLevel || currentLevel;
          resize();
        },
        destroy() {
          window.cancelAnimationFrame(raf);
          window.removeEventListener("resize", resize);
          canvas.remove();
        }
      };
    }

    /* ── P5 weather engine (preferred) ── */
    function createP5Weather(layer, kind, options = {}) {
      if (!window.p5) return createCanvasWeather(layer, kind, options);
      layer.dataset.vrWeatherEngine = "p5";
      const baseEffect = VIBE_EFFECTS[kind] || VIBE_EFFECTS.dust;
      const effect = effectWithAccent(baseEffect, options.accent);
      let currentLevel = options.level || root.dataset.vrWeatherLevel || "low";
      const reduceMotion = typeof options.reducedMotion === "boolean"
        ? options.reducedMotion
        : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let instance = null;
      const sketch = (p) => {
        let particles = [];

        function rebuild() {
          const lvl = currentLevel;
          const mult = lvl === "medium" ? 1 : lvl === "off" ? 0 : 0.48;
          const count = reduceMotion ? Math.ceil(effect.count * 0.18) : Math.ceil(effect.count * mult);
          particles = Array.from({ length: count }, () => effect.initParticle(p.width, p.height));
        }

        p.setup = () => {
          const canvas = p.createCanvas(layer.clientWidth || window.innerWidth, layer.clientHeight || window.innerHeight);
          canvas.addClass("vr-weather-canvas");
          canvas.parent(layer);
          p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
          p.frameRate(30);
          rebuild();
        };

        p.windowResized = () => {
          p.resizeCanvas(layer.clientWidth || window.innerWidth, layer.clientHeight || window.innerHeight);
          rebuild();
        };

        p.draw = () => {
          p.clear();
          p.blendMode((kind === "fog" || kind === "stars") ? p.SCREEN : p.BLEND);
          for (const particle of particles) {
            effect.draw(p, particle, effect, reduceMotion);
            if (!reduceMotion) {
              effect.tick(particle, p, reduceMotion, particles);
              particle.life += 1;
            }
          }
          // Global mouse illumination — subtle radial glow at cursor
          if (typeof pointerX === "number") {
            const mx = pointerX * p.width;
            const my = pointerY * p.height;
            const radius = Math.min(p.width, p.height) * (reduceMotion ? 0.11 : 0.18);
            const [r, g, b] = effect.color;
            const ctx = p.drawingContext;
            const gradient = ctx.createRadialGradient(mx, my, 0, mx, my, radius);
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${reduceMotion ? 0.08 : 0.16})`);
            gradient.addColorStop(0.42, `rgba(${r}, ${g}, ${b}, ${reduceMotion ? 0.035 : 0.07})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            ctx.fillStyle = gradient;
            ctx.fillRect(mx - radius, my - radius, radius * 2, radius * 2);
            ctx.restore();
          }
        };

        p.vrUpdateLevel = rebuild;
      };
      instance = new window.p5(sketch);
      return {
        updateLevel(level) {
          currentLevel = level || root.dataset.vrWeatherLevel || currentLevel;
          if (instance?.vrUpdateLevel) instance.vrUpdateLevel();
        },
        destroy() { if (instance) instance.remove(); instance = null; }
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
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      });
    }

    function destroyWeatherEngine() {
      if (!weatherEngine) return;
      weatherEngine.destroy();
      weatherEngine = null;
    }

    function setWeather(level, options = {}) {
      weatherLevel = level;
      root.dataset.vrWeatherLevel = level;
      const stage = stages[activeStageIndex];
      if (options.persist !== false && stage?.id) stageWeatherLevels.set(stage.id, level);
      $$("[data-vr-weather-level]").forEach((btn) => {
        btn.setAttribute("aria-pressed", String(btn.dataset.vrWeatherLevel === level));
      });
      if (weatherEngine?.updateLevel) weatherEngine.updateLevel(level);
      window.dispatchEvent(new CustomEvent("vibereading:weather", { detail: { level, stage, index: activeStageIndex } }));
    }

    /* ── Pointer state (mouse illumination) ── */
    let pointerX = 0.5, pointerY = 0.5;
    document.addEventListener("mousemove", (e) => {
      pointerX = e.clientX / window.innerWidth;
      pointerY = e.clientY / window.innerHeight;
    }, { passive: true });

    /* ── Sound system — sequential BGM-first fallback ── */
    function setBgmVolume(vol) {
      bgmVolume = vol;
      if (bgmAudio && activeAudioSource === "bgm") bgmAudio.volume = vol;
      root.dataset.vrBgmVolume = String(vol);
      window.dispatchEvent(new CustomEvent("vibereading:bgm-volume", { detail: { volume: vol } }));
    }

    function setAmbienceVolume(vol) {
      ambienceVolume = vol;
      ambienceTracks.forEach((a) => { if (!a.paused) a.volume = vol; });
      root.dataset.vrAmbienceVolume = String(vol);
      window.dispatchEvent(new CustomEvent("vibereading:ambience-volume", { detail: { volume: vol } }));
    }

    async function beginSound() {
      if (!soundEnabled) return false;
      if (activeAudio && !activeAudio.paused) return true;

      // 1. Try BGM first (sequential, not concurrent)
      if (bgmAudio) {
        bgmAudio.loop = true;
        bgmAudio.volume = bgmVolume;
        try {
          await bgmAudio.play();
          activeAudio = bgmAudio;
          activeAudioSource = "bgm";
          root.dataset.vrSoundSource = "bgm";
          return true;
        } catch (_) {
          // BGM failed — fall through to ambience
        }
      }

      // 2. Try ambience tracks (play first that succeeds)
      for (const audio of ambienceTracks) {
        audio.loop = true;
        audio.volume = ambienceVolume;
        try {
          await audio.play();
          activeAudio = audio;
          activeAudioSource = "ambience";
          root.dataset.vrSoundSource = "ambience";
          return true;
        } catch (_) {
          // This track failed — try next
        }
      }

      // 3. Nothing worked
      root.dataset.vrSoundSource = "unavailable";
      window.dispatchEvent(new CustomEvent("vibereading:sound-unavailable"));
      return false;
    }

    function pauseSound() {
      [bgmAudio, ...ambienceTracks].filter(Boolean).forEach((a) => a.pause());
    }

    function setSoundEnabled(enabled) {
      soundEnabled = enabled;
      root.dataset.vrSound = enabled ? "on" : "off";
      const toggle = $("[data-vr-sound-toggle]");
      if (toggle) toggle.textContent = enabled
        ? (isChinese ? "静音" : "Mute")
        : (isChinese ? "取消静音" : "Unmute");
      if (enabled) beginSound();
      else pauseSound();
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
      const layer = $("[data-vr-guide-art]");
      if (!layer || guideArtEngine) return;
      if (!window.p5) { layer.dataset.vrGuideArtEngine = "css"; return; }
      layer.dataset.vrGuideArtEngine = "p5";
      let instance = null;
      const motion = root.dataset.vrGuideMotion || templateId;
      const sketch = (p) => {
        let particles = [];
        let reduceMotion = false;

        function rebuild() {
          reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const count = reduceMotion ? 20 : 80;
          particles = Array.from({ length: count }, (_, i) => ({
            x: Math.random() * p.width, y: Math.random() * p.height,
            seed: Math.random() * 1000, size: 1 + Math.random() * 3,
            orbit: 30 + Math.random() * 160, delay: i / count,
            life: Math.random() * 300
          }));
        }

        p.setup = () => {
          const canvas = p.createCanvas(layer.clientWidth || window.innerWidth, layer.clientHeight || window.innerHeight);
          canvas.parent(layer);
          p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
          p.frameRate(24);
          rebuild();
        };

        p.windowResized = () => {
          p.resizeCanvas(layer.clientWidth || window.innerWidth, layer.clientHeight || window.innerHeight);
          rebuild();
        };

        p.draw = () => {
          p.clear();
          const time = p.frameCount * 0.016;

          // Template-specific full-screen atmospheric shapes (no crosshair/center circle)
          if (motion.includes("window")) {
            // Fog clearing: organic mist wisps that dissolve, not straight lines
            for (let i = 0; i < 8; i++) {
              const baseX = p.width * (0.15 + (i / 8) * 0.7);
              const t = time * 0.7 + i * 1.2;
              const y1 = p.noise(t, i * 0.3) * p.height;
              const y2 = p.noise(t + 5, i * 0.3 + 2) * p.height;
              const alpha = reduceMotion ? 6 : 10 + Math.sin(time + i) * 4;
              p.stroke(220, 235, 240, alpha);
              p.strokeWeight(1.5 + Math.sin(t * 0.5) * 0.8);
              p.noFill();
              p.beginShape();
              p.curveVertex(baseX + Math.sin(t * 0.3) * 40, y1);
              p.curveVertex(baseX + Math.sin(t * 0.3) * 40, y1);
              p.curveVertex(baseX + Math.cos(t * 0.2) * 30, (y1 + y2) / 2);
              p.curveVertex(baseX - Math.sin(t * 0.4) * 35, y2);
              p.curveVertex(baseX - Math.sin(t * 0.4) * 35, y2);
              p.endShape();
            }
          } else if (motion.includes("route")) {
            // Route line drawing forward
            p.noFill();
            p.stroke(255, 224, 164, reduceMotion ? 16 : 32);
            p.strokeWeight(1.5);
            p.beginShape();
            for (let i = 0; i < 9; i++) {
              const x = p.width * (0.05 + i * 0.11);
              const y = p.height * 0.65 + Math.sin(time * 0.8 + i * 0.6) * 25;
              p.curveVertex(x, y);
            }
            p.endShape();
          } else if (motion.includes("vinyl")) {
            // Groove ripples expanding from center
            p.noFill();
            for (let r = 40; r < Math.max(p.width, p.height); r += 50) {
              const alpha = reduceMotion ? 6 : 10 + Math.sin(time * 1.5 + r * 0.01) * 5;
              p.stroke(255, 230, 184, alpha);
              p.strokeWeight(0.8);
              p.circle(p.width / 2, p.height / 2, r + Math.sin(time + r * 0.02) * 6);
            }
          } else if (motion.includes("instrument")) {
            // Scanlines sweeping
            p.stroke(150, 230, 150, reduceMotion ? 10 : 18);
            p.strokeWeight(0.6);
            const scanY = (time * 40) % p.height;
            for (let y = 0; y < p.height; y += 6) {
              const dist = Math.abs(y - scanY);
              const alpha = dist < 30 ? (30 - dist) / 30 : 0;
              p.stroke(150, 230, 150, alpha * (reduceMotion ? 20 : 40));
              p.line(0, y, p.width, y);
            }
          } else if (motion.includes("oracle")) {
            // Card-edge glows floating
            p.noFill();
            p.stroke(255, 220, 170, reduceMotion ? 12 : 22);
            p.strokeWeight(1);
            for (let i = 0; i < 5; i++) {
              const cx = p.width * (0.2 + i * 0.15);
              const cy = p.height * 0.5 + Math.sin(time * 0.7 + i) * 30;
              p.rect(cx - 20, cy - 30, 40, 60, 4);
            }
          }

          // Full-screen ambient particles (per-template color)
          p.noStroke();
          for (const particle of particles) {
            if (!reduceMotion) {
              particle.x += Math.sin(time * 0.3 + particle.seed) * 0.6;
              particle.y += motion.includes("window") ? 0.8 : Math.cos(time * 0.2 + particle.seed) * 0.4;
              particle.life += 1;
            }
            // Wrap
            if (particle.y > p.height + 10) { particle.y = -10; particle.x = Math.random() * p.width; }
            if (particle.y < -10) { particle.y = p.height + 10; }

            const flicker = 0.3 + Math.sin(time * 2 + particle.seed) * 0.2;
            let r = 255, g = 232, b = 181;
            if (motion.includes("instrument")) { r = 150; g = 230; b = 150; }
            else if (motion.includes("route")) { r = 255; g = 210; b = 126; }
            else if (motion.includes("window")) { r = 220; g = 235; b = 240; }
            p.fill(r, g, b, flicker * (reduceMotion ? 60 : 90));
            p.circle(particle.x, particle.y, particle.size * 1.5);
          }
        };

        p.vrSetGuideFocus = () => { /* no-op: guide uses full-screen, not focus points */ };
      };
      instance = new window.p5(sketch);
      guideArtEngine = {
        setFocus() { /* no-op */ },
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
        "[data-vr-bgm-volume], [data-vr-ambience-volume], [data-vr-note-save], [data-vr-panel-toggle]"
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
        soundEnabled = true;
        await beginSound();
        runGuide();
      } else if (target.matches("[data-vr-sound-toggle]")) {
        setSoundEnabled(!soundEnabled);
      } else if (target.matches("[data-vr-weather-level]")) {
        setWeather(target.dataset.vrWeatherLevel);
      } else if (target.matches("[data-vr-stage]")) {
        selectStage(Number(target.dataset.vrStage));
      } else if (target.matches("[data-vr-timer-toggle]")) {
        if (timerRunning) stopTimer(); else startTimer();
      } else if (target.matches("[data-vr-timer-reset]")) {
        resetTimer();
      } else if (target.matches("[data-vr-panel-toggle]")) {
        const panel = $("[data-vr-companion-panel]");
        if (panel) {
          const expanded = panel.dataset.vrPanelExpanded === "true";
          panel.dataset.vrPanelExpanded = String(!expanded);
        }
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
      pauseSound();
      destroyWeatherEngine();
      destroyGuideArt();
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
