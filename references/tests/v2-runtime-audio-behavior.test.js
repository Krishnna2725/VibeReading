const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const assert = require("node:assert/strict");

const runtimeSource = fs.readFileSync(path.join(__dirname, "../../runtime/v2-runtime.js"), "utf8");

function loadAudioFactory() {
  const context = {
    console,
    window: {
      setTimeout,
      clearTimeout,
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {},
      requestAnimationFrame(fn) { fn(); },
      matchMedia() { return { matches: false }; },
      __VIBE_READING_TEST_HOOKS: {},
    },
    document: {
      readyState: "loading",
      addEventListener() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
      documentElement: { dataset: {}, style: { setProperty() {} } },
      body: { appendChild() {} },
    },
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init?.detail; },
    Audio: function Audio() {},
  };
  vm.runInNewContext(runtimeSource, context, { filename: "v2-runtime.js" });
  return context.window.__VIBE_READING_TEST_HOOKS.createAudioController;
}

class FakeAudio {
  constructor(file) {
    this.file = file;
    this.loop = false;
    this.preload = "";
    this.volume = 1;
    this.currentTime = 0;
    this.paused = true;
    this.playCount = 0;
    this.shouldReject = false;
  }

  play() {
    this.playCount += 1;
    if (this.shouldReject) return Promise.reject(new Error(`play failed: ${this.file}`));
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }
}

function createControlledWait() {
  const queue = [];
  return {
    get pending() {
      return queue.length;
    },
    wait() {
      return new Promise((resolve) => {
        queue.push(resolve);
      });
    },
    async flushAll() {
      let idlePasses = 0;
      while (idlePasses < 5) {
        if (!queue.length) {
          idlePasses += 1;
          await Promise.resolve();
          continue;
        }
        idlePasses = 0;
        const batch = queue.splice(0, queue.length);
        batch.forEach((resolve) => resolve());
        await Promise.resolve();
      }
    },
  };
}

function buildController(options = {}) {
  const createAudioController = loadAudioFactory();
  const created = new Map();
  const bgmAudio = options.bgmAudio || new FakeAudio("bgm.mp3");
  const waitControl = options.waitControl || createControlledWait();
  const soundSources = [];
  const controller = createAudioController({
    bgmAudio,
    ambienceFiles: options.ambienceFiles || {
      rain: "./assets/audio/rain.mp3",
      wind: "./assets/audio/wind.mp3",
    },
    createAudio(file) {
      if (!created.has(file)) created.set(file, new FakeAudio(file));
      return created.get(file);
    },
    wait: waitControl.wait,
    onSoundSourceChange(source) {
      soundSources.push(source);
    },
    onSoundUnavailable() {
      soundSources.push("unavailable");
    },
  });
  return { controller, created, bgmAudio, waitControl, soundSources };
}

function createImmediateWaitControl() {
  return {
    wait() {
      return Promise.resolve();
    },
    async flushAll() {},
  };
}

test("rapid consecutive stage switches clean stale ambience audios", async () => {
  const { controller, created, waitControl } = buildController({ bgmAudio: null });

  const first = controller.switchStageAmbience("rain");
  const second = controller.switchStageAmbience("wind");
  await waitControl.flushAll();
  await Promise.allSettled([first, second]);

  const rain = created.get("./assets/audio/rain.mp3");
  const wind = created.get("./assets/audio/wind.mp3");
  assert.equal(rain.paused, true);
  assert.equal(rain.currentTime, 0);
  assert.equal(rain.volume, 0);
  assert.equal(wind.paused, false);
  assert.equal(wind.volume, 0.32);
});

test("stage change fades outgoing and incoming ambience at the same time", async () => {
  const { controller, created, waitControl } = buildController({ bgmAudio: null });

  const first = controller.switchStageAmbience("rain");
  await waitControl.flushAll();
  await first;

  const rain = created.get("./assets/audio/rain.mp3");
  const second = controller.switchStageAmbience("wind");
  for (let pass = 0; pass < 8 && waitControl.pending < 2; pass += 1) {
    await Promise.resolve();
  }

  const wind = created.get("./assets/audio/wind.mp3");
  assert.ok(waitControl.pending >= 2, "both fades should be waiting in the same transition tick");
  assert.ok(rain.volume < 0.32, "outgoing ambience should already be fading out");
  assert.ok(wind.volume > 0, "incoming ambience should fade in before outgoing fade completes");

  await waitControl.flushAll();
  await second;
});

test("mute and unmute resume BGM and current ambience", async () => {
  const { controller, created, bgmAudio, waitControl } = buildController({ waitControl: createImmediateWaitControl() });

  const started = controller.beginSound(() => "rain");
  await waitControl.flushAll();
  await started;
  assert.equal(bgmAudio.paused, false);
  assert.equal(created.get("./assets/audio/rain.mp3").paused, false);

  await controller.setSoundEnabled(false, () => "rain");
  assert.equal(bgmAudio.paused, true);
  assert.equal(created.get("./assets/audio/rain.mp3").paused, true);

  const resumed = controller.setSoundEnabled(true, () => "rain");
  await waitControl.flushAll();
  await resumed;
  assert.equal(bgmAudio.paused, false);
  assert.equal(created.get("./assets/audio/rain.mp3").paused, false);
  assert.ok(bgmAudio.playCount >= 2);
});

test("BGM failure still falls back to current stage ambience", async () => {
  const bgmAudio = new FakeAudio("bgm.mp3");
  bgmAudio.shouldReject = true;
  const { controller, created, waitControl, soundSources } = buildController({ bgmAudio, waitControl: createImmediateWaitControl() });

  const startedPromise = controller.beginSound(() => "rain");
  await waitControl.flushAll();
  const started = await startedPromise;

  assert.equal(started, true);
  assert.equal(bgmAudio.paused, true);
  assert.equal(created.get("./assets/audio/rain.mp3").paused, false);
  assert.ok(soundSources.includes("ambience"));
});

test("switching to no ambience pauses and resets all ambience tracks", async () => {
  const { controller, created, waitControl } = buildController({ bgmAudio: null, waitControl: createImmediateWaitControl() });

  const first = controller.switchStageAmbience("rain");
  await waitControl.flushAll();
  await first;
  const second = controller.switchStageAmbience("");
  await waitControl.flushAll();
  await second;

  const rain = created.get("./assets/audio/rain.mp3");
  assert.equal(rain.paused, true);
  assert.equal(rain.currentTime, 0);
  assert.equal(rain.volume, 0);
  assert.equal(controller.currentAmbienceAudio, null);
});
