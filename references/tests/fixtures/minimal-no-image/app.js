window.VIBE_READING_SPEC = {
  book: { title: "Test Book", author: "Test Author" },
  template: { primary: "instrument", reason: "minimal no-image test" },
  entryGuide: { durationSec: 10, soundRequiredAfterStart: true, motion: "instrument-scan-lock", steps: [{ id: "step1", text: "Begin slowly." }, { id: "step2", text: "Tune in." }, { id: "step3", text: "Start reading." }] },
  audio: { ambienceFiles: ["./assets/audio/fallback.mp3"] },
  weather: { kind: "signal", defaultLevel: "low" },
  stages: [
    { id: "s1", label: "Part 1", sourceRange: "Ch 1-3", chapters: ["Ch 1", "Ch 2", "Ch 3"], readingHint: "Focus on the signal.", weather: { kind: "signal", defaultLevel: "low" }, uiAccent: "#88cc88" },
    { id: "s2", label: "Part 2", sourceRange: "Ch 4-6", chapters: ["Ch 4", "Ch 5", "Ch 6"], readingHint: "The noise increases.", weather: { kind: "dust", defaultLevel: "low" }, uiAccent: "#ccaa66" },
    { id: "s3", label: "Part 3", sourceRange: "Ch 7-9", chapters: ["Ch 7", "Ch 8", "Ch 9"], readingHint: "Find clarity.", weather: { kind: "stars", defaultLevel: "low" }, uiAccent: "#6688cc" }
  ]
};
