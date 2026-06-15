(function () {
  "use strict";

  const spec = window.VIBE_READING_SPEC;
  if (!spec) {
    console.error("VIBE_READING_SPEC is required before v2-runtime.js");
    return;
  }

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const root = document.documentElement;
  const guide = $("[data-vr-guide]");
  const guideText = $("[data-vr-guide-text]");
  const guideStart = $("[data-vr-guide-start]");
  const guideSkip = $("[data-vr-guide-skip]");
  const guideReplay = $("[data-vr-guide-replay]");
  const soundToggle = $("[data-vr-sound-toggle]");
  const volumeControl = $("[data-vr-volume]");
  const weatherButtons = $$("[data-vr-weather-level]");
  const stageButtons = $$("[data-vr-stage]");
  const timerDisplay = $("[data-vr-timer-display]");
  const timerToggle = $("[data-vr-timer-toggle]");
  const timerReset = $("[data-vr-timer-reset]");
  const timerMode = $("[data-vr-timer-mode]");

  const bgm = spec.audio?.bgmFile ? new Audio(spec.audio.bgmFile) : null;
  const ambience = (spec.audio?.ambienceFiles || []).map((file) => new Audio(file));
  const guideSteps = spec.entryGuide?.steps || [];
  const stages = spec.stages || [];

  let activeAudio = null;
  let guideTimers = [];
  let currentStage = 0;
  let soundEnabled = true;
  let timerRunning = false;
  let timerSeconds = 0;
  let timerInterval = null;
  let timerKind = "elapsed";

  function formatTime(seconds) {
    const safe = Math.max(0, seconds);
    const minutes = Math.floor(safe / 60);
    const remainder = safe % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  function updateTimerDisplay() {
    if (timerDisplay) timerDisplay.textContent = formatTime(timerSeconds);
  }

  function resetTimerForMode() {
    timerSeconds = timerKind === "pomodoro" ? 25 * 60 : 0;
    updateTimerDisplay();
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
    if (timerToggle) timerToggle.textContent = "暂停";
  }

  function stopTimer() {
    timerRunning = false;
    window.clearInterval(timerInterval);
    timerInterval = null;
    if (timerToggle) timerToggle.textContent = "继续";
  }

  function resetTimer() {
    stopTimer();
    resetTimerForMode();
    root.dataset.vrPomodoroComplete = "false";
  }

  async function tryPlay(audio, volume) {
    if (!audio) return false;
    audio.loop = true;
    audio.volume = volume;
    try {
      await audio.play();
      activeAudio = audio;
      return true;
    } catch {
      return false;
    }
  }

  async function beginSound() {
    if (!soundEnabled) return false;
    if (activeAudio && !activeAudio.paused) return true;

    const bgmStarted = await tryPlay(bgm, 0.45);
    if (bgmStarted) {
      root.dataset.vrSoundSource = "bgm";
      return true;
    }

    for (const audio of ambience) {
      if (await tryPlay(audio, 0.32)) {
        root.dataset.vrSoundSource = "ambience";
        return true;
      }
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
    if (soundToggle) soundToggle.textContent = enabled ? "暂停声音" : "播放声音";
    if (enabled) beginSound();
    else pauseSound();
  }

  function clearGuideTimers() {
    guideTimers.forEach((timer) => window.clearTimeout(timer));
    guideTimers = [];
  }

  function enterReading() {
    clearGuideTimers();
    root.dataset.vrMode = "reading";
    if (guide) guide.hidden = true;
    selectStage(0);
    startTimer();
    window.dispatchEvent(new CustomEvent("vibereading:guide-complete"));
  }

  function runGuide() {
    clearGuideTimers();
    root.dataset.vrMode = "guide";
    if (guide) guide.hidden = false;
    if (guideStart) guideStart.hidden = true;
    if (guideSkip) guideSkip.hidden = false;

    const total = Math.max(15, Math.min(25, spec.entryGuide?.durationSec || 20));
    const stepDuration = Math.floor((total * 1000) / Math.max(guideSteps.length, 1));

    guideSteps.forEach((step, index) => {
      const timer = window.setTimeout(() => {
        root.dataset.vrGuideStep = step.id;
        if (guideText) guideText.textContent = step.text;
        window.dispatchEvent(new CustomEvent("vibereading:guide-step", { detail: step }));
      }, index * stepDuration);
      guideTimers.push(timer);
    });

    guideTimers.push(window.setTimeout(enterReading, total * 1000));
  }

  async function startGuide() {
    await beginSound();
    runGuide();
  }

  async function replayGuide() {
    stopTimer();
    resetTimerForMode();
    soundEnabled = true;
    root.dataset.vrSound = "on";
    await beginSound();
    runGuide();
  }

  function setWeather(level) {
    root.dataset.vrWeatherLevel = level;
    weatherButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.vrWeatherLevel === level));
    });
    window.dispatchEvent(new CustomEvent("vibereading:weather", { detail: { level } }));
  }

  function selectStage(index) {
    currentStage = Math.max(0, Math.min(index, stages.length - 1));
    const stage = stages[currentStage];
    if (!stage) return;

    root.dataset.vrStage = stage.id;
    stageButtons.forEach((button) => {
      const selected = Number(button.dataset.vrStage) === currentStage;
      button.setAttribute("aria-pressed", String(selected));
    });
    window.dispatchEvent(new CustomEvent("vibereading:stage", { detail: { stage, index: currentStage } }));
  }

  guideStart?.addEventListener("click", startGuide);
  guideSkip?.addEventListener("click", async () => {
    await beginSound();
    enterReading();
  });
  guideReplay?.addEventListener("click", replayGuide);
  soundToggle?.addEventListener("click", () => setSoundEnabled(!soundEnabled));
  volumeControl?.addEventListener("input", (event) => {
    const volume = Number(event.target.value);
    [bgm, ...ambience].filter(Boolean).forEach((audio) => {
      audio.volume = volume;
    });
  });
  weatherButtons.forEach((button) => {
    button.addEventListener("click", () => setWeather(button.dataset.vrWeatherLevel));
  });
  stageButtons.forEach((button) => {
    button.addEventListener("click", () => selectStage(Number(button.dataset.vrStage)));
  });
  timerToggle?.addEventListener("click", () => {
    if (timerRunning) stopTimer();
    else startTimer();
  });
  timerReset?.addEventListener("click", resetTimer);
  timerMode?.addEventListener("change", (event) => {
    timerKind = event.target.value === "pomodoro" ? "pomodoro" : "elapsed";
    resetTimer();
  });

  window.addEventListener("beforeunload", pauseSound);

  root.dataset.vrMode = "home";
  root.dataset.vrSound = "on";
  root.dataset.vrWeatherLevel = "low";
  root.dataset.vrStage = stages[0]?.id || "stage-1";
  if (guide) guide.hidden = false;
  if (guideStart) guideStart.hidden = false;
  if (guideSkip) guideSkip.hidden = true;
  resetTimerForMode();
  setWeather("low");
  selectStage(0);
})();
