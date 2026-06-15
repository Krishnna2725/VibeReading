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
    const bgm = spec.audio?.bgmFile ? new Audio(spec.audio.bgmFile) : null;
    const ambience = (spec.audio?.ambienceFiles || []).map((file) => new Audio(file));
    const guideSteps = spec.entryGuide?.steps || [];
    const stages = spec.stages || [];
    const bookTitle = one("[data-vr-book-title]");
    if (bookTitle) bookTitle.textContent = spec.book?.title || "开始阅读";

    let activeAudio = null;
    let guideTimers = [];
    let soundEnabled = true;
    let timerRunning = false;
    let timerSeconds = 0;
    let timerInterval = null;
    let timerKind = "elapsed";

    function renderStageButtons() {
      const container = one("[data-vr-stages]");
      if (!container || container.querySelector("[data-vr-stage]")) return;
      stages.forEach((stage, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "vr-button vr-stage-button";
        button.dataset.vrStage = String(index);
        button.textContent = `${String(index + 1).padStart(2, "0")} ${stage.label}`;
        button.title = stage.sourceRange || (stage.chapters || []).join("、");
        button.setAttribute("aria-pressed", String(index === 0));
        container.appendChild(button);
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
      if (toggle) toggle.textContent = "继续";
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
      if (toggle) toggle.textContent = "暂停";
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
      if (toggle) toggle.textContent = enabled ? "暂停声音" : "播放声音";
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
      renderWeather(stage.weather || spec.weather?.kind || "");
      window.dispatchEvent(new CustomEvent("vibereading:stage", { detail: { stage, index: safeIndex } }));
    }

    function weatherKind(description) {
      const value = String(description).toLowerCase();
      if (/雨|rain|drizzle|storm/.test(value)) return "rain";
      if (/雪|snow/.test(value)) return "snow";
      if (/雾|mist|fog|haze/.test(value)) return "mist";
      if (/风|wind/.test(value)) return "wind";
      return "dust";
    }

    function renderWeather(description) {
      const layer = one("[data-vr-weather]");
      if (!layer) return;
      const kind = weatherKind(description);
      if (layer.dataset.vrWeatherKind === kind && layer.childElementCount) return;
      layer.dataset.vrWeatherKind = kind;
      layer.replaceChildren();
      const count = kind === "rain" ? 42 : kind === "snow" ? 30 : kind === "mist" ? 4 : 24;
      for (let index = 0; index < count; index += 1) {
        const particle = document.createElement("i");
        particle.style.setProperty("--vr-x", `${Math.random() * 100}%`);
        particle.style.setProperty("--vr-delay", `${Math.random() * -12}s`);
        particle.style.setProperty("--vr-duration", `${4 + Math.random() * 8}s`);
        particle.style.setProperty("--vr-drift", `${-30 + Math.random() * 60}px`);
        particle.style.setProperty("--vr-size", `${1 + Math.random() * 4}px`);
        layer.appendChild(particle);
      }
    }

    function enterReading() {
      clearGuideTimers();
      root.dataset.vrMode = "reading";
      const guide = one("[data-vr-guide]");
      if (guide) guide.hidden = true;
      selectStage(0);
      startTimer();
      window.dispatchEvent(new CustomEvent("vibereading:guide-complete"));
    }

    function runGuide() {
      clearGuideTimers();
      root.dataset.vrMode = "guide";
      const guide = one("[data-vr-guide]");
      const start = one("[data-vr-guide-start]");
      const skip = one("[data-vr-guide-skip]");
      if (guide) guide.hidden = false;
      if (start) start.hidden = true;
      if (skip) skip.hidden = true;
      const title = one("[data-vr-book-title]");
      const invitation = one("[data-vr-guide-invitation]");
      if (title) title.hidden = true;
      if (invitation) invitation.hidden = true;

      const total = Math.max(15, Math.min(25, spec.entryGuide?.durationSec || 20));
      const stepDuration = Math.floor((total * 1000) / Math.max(guideSteps.length, 1));
      guideSteps.forEach((step, index) => {
        guideTimers.push(window.setTimeout(() => {
          root.dataset.vrGuideStep = step.id;
          root.dataset.vrGuideAnimate = "false";
          void root.offsetWidth;
          const text = one("[data-vr-guide-text]");
          const eyebrow = one("[data-vr-guide-eyebrow]");
          const emphasis = one("[data-vr-guide-emphasis]");
          if (text) text.textContent = step.text;
          if (eyebrow) eyebrow.textContent = step.eyebrow || spec.entryGuide?.eyebrow || "";
          if (emphasis) emphasis.textContent = step.emphasis || "";
          root.dataset.vrGuideAnimate = "true";
          window.dispatchEvent(new CustomEvent("vibereading:guide-step", { detail: step }));
        }, index * stepDuration));
      });
      guideTimers.push(window.setTimeout(() => {
        if (skip) skip.hidden = false;
      }, Math.min(8000, Math.max(5000, stepDuration))));
      guideTimers.push(window.setTimeout(enterReading, total * 1000));
    }

    function setWeather(level) {
      root.dataset.vrWeatherLevel = level;
      all("[data-vr-weather-level]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.vrWeatherLevel === level));
      });
      window.dispatchEvent(new CustomEvent("vibereading:weather", { detail: { level } }));
    }

    document.addEventListener("click", async (event) => {
      const target = event.target.closest("[data-vr-guide-start], [data-vr-guide-skip], [data-vr-guide-replay], [data-vr-sound-toggle], [data-vr-weather-level], [data-vr-stage], [data-vr-timer-toggle], [data-vr-timer-reset]");
      if (!target) return;

      if (target.matches("[data-vr-guide-start]")) {
        await beginSound();
        runGuide();
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

    window.addEventListener("beforeunload", pauseSound);
    renderStageButtons();
    root.dataset.vrMode = "home";
    root.dataset.vrSound = "on";
    resetTimerForMode();
    setWeather("low");
    selectStage(0);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
