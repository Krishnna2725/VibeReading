(function () {
  "use strict";

  function init() {
    const spec = window.VIBE_READING_SPEC;
    if (!spec) {
      console.error("VIBE_READING_SPEC must be defined by app.js before v2-runtime.js");
      return;
    }

    const root = document.documentElement;
    const one = (selector) => document.querySelector(selector);
    const all = (selector) => Array.from(document.querySelectorAll(selector));
    const templateId = String(spec.template?.primary || "window").toLowerCase();
    const bgm = spec.audio?.bgmFile ? new Audio(spec.audio.bgmFile) : null;
    const ambience = (spec.audio?.ambienceFiles || []).map((file) => new Audio(file));
    const fallbackGuideSteps = [
      { id: "settle", text: "Don't rush to turn the page. Let the sound and weather arrive first.", emphasis: "Breathe in slowly, pause." },
      { id: "orient", text: "This is your posture for entering the book — no plot hints, no answers.", emphasis: "Set aside judgment for now." },
      { id: "begin", text: "When the scene settles, begin reading from the current chapter.", emphasis: "Open the controls when you need them." }
    ];
    const guideSteps = spec.entryGuide?.steps?.length ? spec.entryGuide.steps : fallbackGuideSteps;
    const stages = spec.stages || [];
    const uiLanguage = spec.bookDirection?.uiLanguage || spec.book?.uiLanguage || "English";
    const isChinese = /^zh/i.test(uiLanguage);
    const bookTitle = one("[data-vr-book-title]");
    if (bookTitle) bookTitle.textContent = spec.book?.title || (isChinese ? "开始阅读" : "Start Reading");
    root.dataset.vrTemplate = templateId;
    root.dataset.vrGuideMotion = String(spec.entryGuide?.motion || spec.entryGuide?.layout || templateId).toLowerCase();

    let activeAudio = null;
    let guideTimers = [];
    let guideIndex = 0;
    let soundEnabled = true;
    let timerRunning = false;
    let timerSeconds = 0;
    let timerInterval = null;
    let timerKind = "elapsed";
    let weatherEngine = null;
    let guideArtEngine = null;
    let activeStageIndex = 0;
    const stageWeatherLevels = new Map();

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function splitGuideLines(value) {
      const text = String(value || "").trim();
      const lines = text
        .split(/(?<=[。！？；.!?;])\s*/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length > 1) return lines.slice(0, 3);
      if (text.length <= 18) return [text];
      const midpoint = Math.ceil(text.length / 2);
      const splitAt = text.lastIndexOf("，", midpoint) > 4 ? text.lastIndexOf("，", midpoint) + 1 : midpoint;
      return [text.slice(0, splitAt).trim(), text.slice(splitAt).trim()].filter(Boolean);
    }

    function renderGuideText(step) {
      const text = one("[data-vr-guide-text]");
      if (!text) return;
      const lines = splitGuideLines(step.text);
      text.innerHTML = lines.map((line, index) => {
        const role = index === 0 ? "vr-guide-line--strong" : (index === lines.length - 1 ? "vr-guide-line--soft" : "");
        return `<span class="vr-guide-line ${role}">${escapeHtml(line)}</span>`;
      }).join("");
    }

    function guideFocusForStep(step, index) {
      const visual = String(step.visual || step.id || "").toLowerCase();
      if (/right|panel|stage|control|compan|阶段|面板|右/.test(visual)) return { x: "78%", y: "68%", spotlight: true };
      if (/window|outside|sky|窗|远|外/.test(visual)) return { x: "55%", y: "38%", spotlight: true };
      if (/object|card|symbol|record|instrument|物|牌|唱片|仪器/.test(visual)) return { x: "50%", y: "58%", spotlight: true };
      const presets = [
        { x: "50%", y: "52%", spotlight: false },
        { x: "58%", y: "42%", spotlight: true },
        { x: "78%", y: "70%", spotlight: true },
        { x: "50%", y: "46%", spotlight: false }
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

    function createGuideArt() {
      const layer = one("[data-vr-guide-art]");
      if (!layer || guideArtEngine) return;
      if (!window.p5) {
        layer.dataset.vrGuideArtEngine = "css";
        return;
      }
      layer.dataset.vrGuideArtEngine = "p5";
      let instance = null;
      const guideMotion = root.dataset.vrGuideMotion || templateId;
      const sketch = (p) => {
        let particles = [];
        let focus = { x: 0.5, y: 0.5 };
        let phase = 0;
        let reduceMotion = false;

        function parsePercent(value, fallback) {
          const match = String(value || "").match(/([\d.]+)%/);
          return match ? Number(match[1]) / 100 : fallback;
        }

        function rebuild() {
          reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const count = reduceMotion ? 24 : 86;
          particles = Array.from({ length: count }, (_, index) => ({
            x: Math.random() * p.width,
            y: Math.random() * p.height,
            seed: Math.random() * 1000,
            size: 1.5 + Math.random() * 3.8,
            orbit: 34 + Math.random() * 180,
            drift: 0.001 + Math.random() * 0.004,
            delay: index / count
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
          p.noStroke();
          const targetX = focus.x * p.width;
          const targetY = focus.y * p.height;
          const time = p.frameCount * 0.018;
          if (guideMotion.includes("route")) {
            p.noFill();
            p.stroke(255, 224, 164, reduceMotion ? 22 : 42);
            p.strokeWeight(1.2);
            p.beginShape();
            for (let i = 0; i < 7; i += 1) {
              const x = p.width * (0.08 + i * 0.14);
              const y = p.height * 0.66 + Math.sin(time + i * 0.7) * 22 - phase * 8;
              p.curveVertex(x, y);
            }
            p.endShape();
          } else if (guideMotion.includes("vinyl")) {
            p.noFill();
            for (let r = 58; r < 280; r += 34) {
              p.stroke(255, 230, 184, reduceMotion ? 12 : 18 + Math.sin(time * 2 + r) * 6);
              p.strokeWeight(1);
              p.circle(targetX, targetY, r + Math.sin(time + r) * 4);
            }
          } else if (guideMotion.includes("instrument")) {
            p.stroke(150, 230, 150, reduceMotion ? 18 : 28);
            p.strokeWeight(1);
            for (let y = 0; y < p.height; y += 9) {
              const wobble = Math.sin(time * 4 + y * 0.03) * (2 + phase);
              p.line(0, y + wobble, p.width, y - wobble * 0.2);
            }
          } else if (guideMotion.includes("oracle")) {
            p.noFill();
            p.stroke(255, 220, 170, reduceMotion ? 18 : 32);
            p.strokeWeight(1);
            for (let i = 0; i < 3; i += 1) {
              p.push();
              p.translate(targetX + (i - 1) * 64, targetY + Math.sin(time + i) * 10);
              p.rotate(Math.sin(time * 0.5 + i) * 0.08);
              p.rect(-34, -52, 68, 104, 8);
              p.pop();
            }
          } else if (guideMotion.includes("window")) {
            p.noFill();
            p.stroke(255, 255, 255, reduceMotion ? 12 : 22);
            p.strokeWeight(1);
            p.rect(targetX - 150, targetY - 95, 300, 190, 6);
            p.line(targetX, targetY - 95, targetX, targetY + 95);
            p.line(targetX - 150, targetY, targetX + 150, targetY);
          }
          for (const particle of particles) {
            const gather = Math.min(1, Math.max(0, phase * 0.24 + particle.delay));
            const angle = particle.seed + time * (0.35 + phase * 0.05);
            const routePush = guideMotion.includes("route") ? (particle.delay * p.width * 0.8 - p.width * 0.4) : 0;
            const vinylOrbit = guideMotion.includes("vinyl") ? 1.4 : 1;
            const instrumentJitter = guideMotion.includes("instrument") ? Math.sin(time * 18 + particle.seed) * 18 : 0;
            const windowFall = guideMotion.includes("window") ? time * 90 * (0.3 + particle.delay) : 0;
            const orbitX = targetX + routePush + instrumentJitter + Math.cos(angle) * particle.orbit * vinylOrbit * (1 - gather * 0.42);
            const orbitY = targetY + ((particle.y + windowFall) % p.height - p.height * 0.5) * (guideMotion.includes("window") ? 0.55 : 0) + Math.sin(angle * 0.72) * particle.orbit * 0.42;
            const wind = Math.sin(time + particle.seed) * (18 + phase * 6);
            const nextX = orbitX + wind;
            const nextY = orbitY + Math.cos(time * 1.2 + particle.seed) * 14;
            if (!reduceMotion) {
              particle.x += (nextX - particle.x) * 0.045;
              particle.y += (nextY - particle.y) * 0.045;
            }
            const alpha = reduceMotion ? 46 : 28 + Math.sin(time * 2 + particle.seed) * 18 + phase * 5;
            if (guideMotion.includes("instrument")) p.fill(150, 230, 150, alpha * 0.72);
            else if (guideMotion.includes("route")) p.fill(255, 210, 126, alpha * 0.85);
            else if (guideMotion.includes("window")) p.fill(225, 238, 240, alpha * 0.75);
            else p.fill(255, 232, 181, alpha);
            if (guideMotion.includes("window")) {
              p.rect(particle.x, particle.y, 1, particle.size * 8, 1);
            } else {
              p.circle(particle.x, particle.y, particle.size * (1 + phase * 0.08));
            }
          }
          p.noFill();
          p.stroke(255, 230, 180, reduceMotion ? 18 : 30 + Math.sin(time) * 10);
          p.strokeWeight(1);
          if (guideMotion.includes("vinyl")) p.circle(targetX, targetY, 120 + Math.sin(time * 1.4) * 18);
          else if (!guideMotion.includes("instrument")) p.circle(targetX, targetY, 120 + Math.sin(time * 1.4) * 18);
        };

        p.vrSetGuideFocus = (nextFocus, index) => {
          focus = {
            x: parsePercent(nextFocus.x, 0.5),
            y: parsePercent(nextFocus.y, 0.5)
          };
          phase = index;
        };
      };
      instance = new window.p5(sketch);
      guideArtEngine = {
        setFocus(focus, index) {
          if (instance?.vrSetGuideFocus) instance.vrSetGuideFocus(focus, index);
        },
        destroy() {
          if (instance) instance.remove();
          instance = null;
          layer.replaceChildren();
        }
      };
    }

    function initializeStageControls() {
      all("[data-vr-stage]").forEach((control) => {
        const index = Number(control.dataset.vrStage);
        const stage = stages[index];
        if (!stage) return;
        if (!control.hasAttribute("aria-pressed")) {
          control.setAttribute("aria-pressed", String(index === 0));
        }
        if (!control.title) {
          control.title = stage.sourceRange || (stage.chapters || []).join("、");
        }
        if (!control.textContent.trim()) {
          control.textContent = `${String(index + 1).padStart(2, "0")} ${stage.label}`;
        }
      });
    }

    function formatTime(seconds) {
      const safe = Math.max(0, seconds);
      return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
    }

    function updateTimerDisplay() {
      const display = one("[data-vr-timer-display]");
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
      const toggle = one("[data-vr-timer-toggle]");
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
      const toggle = one("[data-vr-timer-toggle]");
      if (toggle) toggle.textContent = isChinese ? "暂停" : "Pause";
    }

    function resetTimer() {
      stopTimer();
      resetTimerForMode();
      root.dataset.vrPomodoroComplete = "false";
    }

    async function beginSound() {
      if (!soundEnabled) return false;
      if (activeAudio && !activeAudio.paused) return true;
      const candidates = [
        ...(bgm ? [{ audio: bgm, volume: 0.45, source: "bgm" }] : []),
        ...ambience.map((audio) => ({ audio, volume: 0.32, source: "ambience" }))
      ];

      // Start every candidate inside the same click gesture so a failed BGM
      // attempt cannot consume autoplay permission before the fallback.
      const attempts = candidates.map(({ audio, volume, source }) => {
        audio.loop = true;
        audio.volume = volume;
        return Promise.resolve(audio.play())
          .then(() => ({ audio, source, played: true }))
          .catch(() => ({ audio, source, played: false }));
      });
      const results = await Promise.all(attempts);
      const winner = results.find((result) => result.played);
      results.forEach((result) => {
        if (result.played && result !== winner) result.audio.pause();
      });
      if (winner) {
        activeAudio = winner.audio;
        root.dataset.vrSoundSource = winner.source;
        return true;
      }
      root.dataset.vrSoundSource = "unavailable";
      window.dispatchEvent(new CustomEvent("vibereading:sound-unavailable"));
      return false;
    }

    function pauseSound() {
      [bgm, ...ambience].filter(Boolean).forEach((audio) => audio.pause());
    }

    function setSoundEnabled(enabled) {
      soundEnabled = enabled;
      root.dataset.vrSound = enabled ? "on" : "off";
      const toggle = one("[data-vr-sound-toggle]");
      if (toggle) toggle.textContent = enabled
        ? (isChinese ? "暂停声音" : "Mute")
        : (isChinese ? "播放声音" : "Unmute");
      if (enabled) beginSound();
      else pauseSound();
    }

    function clearGuideTimers() {
      guideTimers.forEach((timer) => window.clearTimeout(timer));
      guideTimers = [];
    }

    function selectStage(index) {
      const safeIndex = Math.max(0, Math.min(index, stages.length - 1));
      const stage = stages[safeIndex];
      if (!stage) return;
      activeStageIndex = safeIndex;
      root.dataset.vrStage = stage.id;
      const currentStage = one("[data-vr-current-stage]");
      const currentRange = one("[data-vr-current-range]");
      const currentHint = one("[data-vr-current-hint]");
      if (currentStage) currentStage.textContent = stage.label;
      if (currentRange) currentRange.textContent = stage.sourceRange || (stage.chapters || []).join(" · ");
      if (currentHint) currentHint.textContent = stage.readingHint || "";
      all("[data-vr-stage]").forEach((button) => {
        button.setAttribute("aria-pressed", String(Number(button.dataset.vrStage) === safeIndex));
      });
      renderWeather(stageWeatherDescription(stage) || spec.weather?.kind || "");
      setWeather(stageWeatherLevels.get(stage.id) || stageDefaultWeatherLevel(stage), { persist: false });
      window.dispatchEvent(new CustomEvent("vibereading:stage", { detail: { stage, index: safeIndex } }));
    }

    function stageWeatherDescription(stage) {
      const weather = stage?.weather;
      if (weather && typeof weather === "object") {
        return weather.kind || weather.label || weather.type || weather.texture || "";
      }
      return weather || "";
    }

    function stageDefaultWeatherLevel(stage) {
      const weather = stage?.weather;
      if (weather && typeof weather === "object" && weather.defaultLevel) return weather.defaultLevel;
      return stage?.weatherLevel || spec.weather?.defaultLevel || "low";
    }

    function weatherKind(description) {
      const value = String(description).toLowerCase();
      if (/雨|rain|drizzle|storm/.test(value)) return "rain";
      if (/雪|snow/.test(value)) return "snow";
      if (/雾|mist|fog|haze/.test(value)) return "mist";
      if (/风|wind/.test(value)) return "wind";
      return "dust";
    }

    function weatherProfile(kind) {
      if (kind === "rain") return { count: 78, color: [210, 225, 235], gravity: 7.5, splash: true };
      if (kind === "snow") return { count: 56, color: [245, 246, 238], gravity: 1.2, drift: 0.9 };
      if (kind === "mist") return { count: 16, color: [210, 222, 222], gravity: 0.18, drift: 0.55, mist: true };
      if (kind === "wind") return { count: 48, color: [236, 232, 214], gravity: 0.5, drift: 5.5, streak: true };
      return { count: 46, color: [239, 219, 164], gravity: 0.45, drift: 0.9 };
    }

    function destroyWeatherEngine() {
      if (!weatherEngine) return;
      weatherEngine.destroy();
      weatherEngine = null;
    }

    function createParticle(width, height, kind) {
      const profile = weatherProfile(kind);
      const base = {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (profile.drift || 1.6),
        vy: profile.gravity * (0.45 + Math.random() * 0.9),
        size: 0.8 + Math.random() * 2.8,
        life: Math.random() * 100,
        splash: 0
      };
      if (kind === "rain") {
        base.vx = -0.8 + Math.random() * 0.9;
        base.vy = 7 + Math.random() * 7;
        base.size = 10 + Math.random() * 24;
      }
      if (kind === "mist") {
        base.x = -width * 0.2 + Math.random() * width * 1.4;
        base.y = Math.random() * height;
        base.size = 80 + Math.random() * 220;
        base.vx = 0.12 + Math.random() * 0.28;
        base.vy = (Math.random() - 0.5) * 0.08;
      }
      if (kind === "wind") {
        base.x = -width * 0.2 + Math.random() * width * 1.2;
        base.vx = 3 + Math.random() * 7;
        base.vy = (Math.random() - 0.5) * 0.7;
        base.size = 30 + Math.random() * 120;
      }
      return base;
    }

    function createCanvasWeather(layer, kind) {
      layer.dataset.vrWeatherEngine = "canvas";
      const canvas = document.createElement("canvas");
      canvas.className = "vr-weather-canvas";
      layer.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let width = 1;
      let height = 1;
      let particles = [];
      let raf = 0;

      function resize() {
        width = Math.max(1, layer.clientWidth || window.innerWidth);
        height = Math.max(1, layer.clientHeight || window.innerHeight);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const profile = weatherProfile(kind);
        const level = root.dataset.vrWeatherLevel || "low";
        const multiplier = level === "medium" ? 1 : 0.48;
        const count = reduceMotion ? Math.ceil(profile.count * 0.18) : Math.ceil(profile.count * multiplier);
        particles = Array.from({ length: count }, () => createParticle(width, height, kind));
      }

      function drawParticle(particle, profile) {
        const [r, g, b] = profile.color;
        if (kind === "rain") {
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.46)`;
          ctx.lineWidth = 1;
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
        } else if (kind === "mist") {
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
        } else {
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.45)`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      function tick() {
        const profile = weatherProfile(kind);
        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = kind === "mist" ? "screen" : "source-over";
        for (const particle of particles) {
          drawParticle(particle, profile);
          if (!reduceMotion) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life += 1;
          }
          if (kind === "rain" && particle.y + particle.size >= height - 4) {
            particle.splash = 1;
            particle.x = Math.random() * width;
            particle.y = -30;
          } else if (particle.y > height + particle.size || particle.x > width + particle.size || particle.x < -particle.size * 1.4) {
            Object.assign(particle, createParticle(width, height, kind));
            if (kind !== "wind") particle.y = -particle.size;
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

    function createP5Weather(layer, kind) {
      if (!window.p5) return createCanvasWeather(layer, kind);
      layer.dataset.vrWeatherEngine = "p5";
      let instance = null;
      const sketch = (p) => {
        let particles = [];
        let reduceMotion = false;

        function rebuild() {
          const profile = weatherProfile(kind);
          const level = root.dataset.vrWeatherLevel || "low";
          const multiplier = level === "medium" ? 1 : 0.48;
          reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const count = reduceMotion ? Math.ceil(profile.count * 0.18) : Math.ceil(profile.count * multiplier);
          particles = Array.from({ length: count }, () => createParticle(p.width, p.height, kind));
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
          const profile = weatherProfile(kind);
          p.clear();
          p.blendMode(kind === "mist" ? p.SCREEN : p.BLEND);
          for (const particle of particles) {
            const [r, g, b] = profile.color;
            if (kind === "rain") {
              p.stroke(r, g, b, 120);
              p.strokeWeight(1);
              p.line(particle.x, particle.y, particle.x + particle.vx * 1.6, particle.y + particle.size);
              if (particle.splash > 0) {
                p.noFill();
                p.stroke(r, g, b, particle.splash * 70);
                p.ellipse(particle.x, p.height - 8, particle.splash * 32, particle.splash * 8);
                particle.splash *= 0.78;
              }
            } else if (kind === "mist") {
              p.noStroke();
              for (let alpha = 18; alpha > 0; alpha -= 6) {
                p.fill(r, g, b, alpha);
                p.circle(particle.x, particle.y, particle.size * (alpha / 9));
              }
            } else if (kind === "wind") {
              p.stroke(r, g, b, 72);
              p.strokeWeight(1);
              p.line(particle.x, particle.y, particle.x + particle.size, particle.y + particle.vy * 8);
            } else {
              p.noStroke();
              p.fill(r, g, b, 115);
              p.circle(particle.x, particle.y, particle.size * 2);
            }

            if (!reduceMotion) {
              particle.x += particle.vx;
              particle.y += particle.vy;
              particle.life += 1;
            }
            if (kind === "rain" && particle.y + particle.size >= p.height - 4) {
              particle.splash = 1;
              particle.x = Math.random() * p.width;
              particle.y = -30;
            } else if (particle.y > p.height + particle.size || particle.x > p.width + particle.size || particle.x < -particle.size * 1.4) {
              Object.assign(particle, createParticle(p.width, p.height, kind));
              if (kind !== "wind") particle.y = -particle.size;
            }
          }
        };

        p.vrUpdateLevel = rebuild;
      };
      instance = new window.p5(sketch);
      return {
        updateLevel() {
          if (instance?.vrUpdateLevel) instance.vrUpdateLevel();
        },
        destroy() {
          if (instance) instance.remove();
          instance = null;
        }
      };
    }

    function renderWeather(description) {
      const layer = one("[data-vr-weather]");
      if (!layer) return;
      const kind = weatherKind(description);
      if (layer.dataset.vrWeatherKind === kind && layer.childElementCount) return;
      layer.dataset.vrWeatherKind = kind;
      destroyWeatherEngine();
      layer.replaceChildren();
      weatherEngine = createP5Weather(layer, kind);
    }

    function enterReading() {
      clearGuideTimers();
      destroyGuideArt();
      const guide = one("[data-vr-guide]");
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

    function showGuideStep(index) {
      const step = guideSteps[index];
      if (!step) return;
      guideIndex = index;
      root.dataset.vrGuideStep = step.id;
      root.dataset.vrGuidePhase = String(index);
      root.dataset.vrGuideAnimate = "false";
      setGuideFocus(step, index);
      const eyebrow = one("[data-vr-guide-eyebrow]");
      const emphasis = one("[data-vr-guide-emphasis]");
      const next = one("[data-vr-guide-next]");
      renderGuideText(step);
      if (eyebrow) eyebrow.textContent = step.eyebrow || spec.entryGuide?.eyebrow || "";
      if (emphasis) emphasis.textContent = step.emphasis || "";
      if (next) next.textContent = index >= guideSteps.length - 1
        ? (isChinese ? "进入阅读" : "Start Reading")
        : (isChinese ? "继续" : "Continue");
      window.requestAnimationFrame(() => {
        root.dataset.vrGuideAnimate = "true";
      });
      window.dispatchEvent(new CustomEvent("vibereading:guide-step", { detail: step }));
    }

    function runGuide() {
      clearGuideTimers();
      root.dataset.vrMode = "guide";
      root.dataset.vrGuideExiting = "false";
      createGuideArt();
      const guide = one("[data-vr-guide]");
      const start = one("[data-vr-guide-start]");
      const next = one("[data-vr-guide-next]");
      const skip = one("[data-vr-guide-skip]");
      if (guide) guide.hidden = false;
      if (start) start.hidden = true;
      if (next) next.hidden = false;
      if (skip) skip.hidden = false;
      const title = one("[data-vr-book-title]");
      const invitation = one("[data-vr-guide-invitation]");
      if (title) title.hidden = true;
      if (invitation) invitation.hidden = true;
      showGuideStep(0);
    }

    function advanceGuide() {
      if (guideIndex >= guideSteps.length - 1) {
        enterReading();
        return;
      }
      showGuideStep(guideIndex + 1);
    }

    function setWeather(level, options = {}) {
      root.dataset.vrWeatherLevel = level;
      const stage = stages[activeStageIndex];
      if (options.persist !== false && stage?.id) {
        stageWeatherLevels.set(stage.id, level);
      }
      all("[data-vr-weather-level]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.vrWeatherLevel === level));
      });
      if (weatherEngine?.updateLevel) weatherEngine.updateLevel();
      window.dispatchEvent(new CustomEvent("vibereading:weather", { detail: { level, stage, index: activeStageIndex } }));
    }

    document.addEventListener("click", async (event) => {
      const target = event.target.closest("[data-vr-guide-start], [data-vr-guide-next], [data-vr-guide-skip], [data-vr-guide-replay], [data-vr-sound-toggle], [data-vr-weather-level], [data-vr-stage], [data-vr-timer-toggle], [data-vr-timer-reset]");
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
        if (timerRunning) stopTimer();
        else startTimer();
      } else if (target.matches("[data-vr-timer-reset]")) {
        resetTimer();
      }
    });

    document.addEventListener("input", (event) => {
      if (!event.target.matches("[data-vr-volume]")) return;
      const volume = Number(event.target.value);
      [bgm, ...ambience].filter(Boolean).forEach((audio) => {
        audio.volume = volume;
      });
    });

    document.addEventListener("change", (event) => {
      if (!event.target.matches("[data-vr-timer-mode]")) return;
      timerKind = event.target.value === "pomodoro" ? "pomodoro" : "elapsed";
      resetTimer();
    });

    window.addEventListener("beforeunload", () => {
      pauseSound();
      destroyWeatherEngine();
      destroyGuideArt();
    });
    initializeStageControls();
    root.dataset.vrMode = "home";
    root.dataset.vrSound = "on";
    resetTimerForMode();
    setWeather(spec.weather?.defaultLevel || "low", { persist: false });
    selectStage(0);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
