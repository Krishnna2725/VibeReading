# VibeReading Agent Handoff

Last updated: 2026-06-18

This document is the onboarding packet for a new platform-side Codex, TARS,
BT-7274, CASE, or any other agent joining the VibeReading project through
Multica.

It is not the product contract. The authoritative generation contract is:

```text
vibereading-skill/SKILL.md
```

Use this file to understand the current project state, known traps, and how to
coordinate without replaying the entire local Codex conversation.

## Project Location

The repo root is the current VibeReading workspace. Use relative paths whenever
possible to avoid Windows console encoding issues.

```text
vibereading-skill/
AGENTS.md
```

## Current Product Shape

VibeReading generates a 16:9 desktop reading companion page for a book.

It is not:

- an ebook reader;
- a plot explainer;
- a generic book landing page;
- a puzzle game;
- a dashboard.

Each generated page must include:

- one selected template: `window`, `vinyl`, `instrument`, `route`, or `oracle`;
- pre-reading guide on every refresh;
- sound after the user clicks Start;
- exactly one instrumental BGM for the whole book;
- 3 to 6 reading stages based on the real table of contents or chapter order;
- weather or atmospheric motion;
- template-specific companion controls;
- reading timer and 25-minute pomodoro;
- `file://` support;
- 16:9 desktop-first layout.

## Reading Path For Generation Tasks

For ordinary page generation, read only:

```text
vibereading-skill/SKILL.md
vibereading-skill/references/template-index.md
vibereading-skill/references/templates/[selected-template].md
vibereading-skill/references/space-spec-schema.md
vibereading-skill/references/audio-manifest.json
```

Read optional references only when the step needs them:

```text
references/visual-design-contract.md
references/entry-guide.md
references/image-generation.md
references/music-generation.md
references/effects-recipes.md
references/technical-contract.md
```

Do not browse all templates, old outputs, or tests unless a specific failure
requires it.

## Template Summary

The five templates are equal options.

```text
window      looking through a window / image-led atmosphere
vinyl       record player / sleeve / needle / liner-note ritual
instrument  reading receiver / signal tuning / CRT or device object
route       route, stops, path, travel movement
oracle      card table, symbols, deck, reveal ritual
```

Current important template decisions:

- `instrument` and `oracle` normally build the main object with DOM/CSS/SVG/p5.
- `window`, `vinyl`, and `route` may use generated imagery.
- Only `window` may use one base image plus up to three image-to-image variants.
- The old `symbols` template is replaced by `oracle`.
- The old generic bottom-right companion card is deprecated.
- Companion controls should belong to the selected template object.

## Runtime Architecture

Shared runtime lives in:

```text
vibereading-skill/runtime/
```

Runtime is shared by all templates. There is not one runtime per template.

Runtime owns:

- guide state;
- sound start and BGM-to-ambience fallback;
- weather layer setup;
- stage switching events;
- timer and pomodoro state;
- `data-vr-*` event binding.

Runtime should not visually design the template object. It is a shared circuit
board, not the TV/radio/window/card table itself.

Recent direction:

- Runtime binds existing `[data-vr-stage]` controls.
- Template output should author its own stage controls.
- The evaluator should not pass an output just because copied runtime contains
  `data-vr-stage`.

## Old Output Reuse Rule

This is a major hard-won lesson from QDE-7.

Old `output/` folders may be used as asset libraries only.

Allowed:

- copy audio files;
- copy images;
- copy textures;
- copy fonts if needed;
- inspect old output only to find asset paths and decide whether assets fit.

Not allowed:

- copy old `index.html`;
- copy old `style.css`;
- copy old `app.js`;
- copy old DOM structure;
- copy old CSS architecture;
- copy old JavaScript event logic;
- use old outputs as implementation references.

Reason:

BT generated a Three-Body Problem `instrument` page that looked almost identical
to a previous 1984 `instrument` page because the old output was used as a
structure reference while reusing BGM assets. This caused the page skeleton and
bugs to be replicated.

## Current Multica Issues

Useful issue history:

```text
QDE-6   Stabilized VibeReading workflow and cleaned agent-facing docs.
QDE-7   Real generation test for The Three-Body Problem with instrument.
QDE-8   CASE review report for QDE-7.
QDE-11  Current task for BT: fix old-output reuse boundaries and evaluator/runtime gaps.
```

QDE-7 finding:

The similar 1984/Three-Body outputs were caused by old-output structure copying,
not mainly by runtime visual defaults.

QDE-8 finding:

Evaluator passed while real product issues remained:

- missing visible pomodoro control;
- skip-control semantics were unclear;
- companion controls were not collapsed;
- reused BGM was mislabeled as generated;
- prompt files remained scaffold placeholders;
- spoiler-safe stage labels needed more care.

QDE-11 task:

BT should fix:

- old-output reuse boundary in docs;
- `bgm-meta.status = reused`;
- evaluator check for real output-authored stage controls;
- `entryGuide.skipControl` ambiguity;
- scaffold prompt placeholder confusion;
- regression tests.

## Validation Philosophy

Keep validation deterministic.

The evaluator should check:

- required files;
- JSON parse;
- JS syntax;
- local asset references;
- runtime load order;
- actual authored controls;
- timer/pomodoro contract;
- BGM status and source metadata;
- 16:9 handling.

The evaluator should not try to judge:

- art taste;
- literary interpretation quality;
- whether the page is beautiful;
- multimodal screenshot quality.

Human users judge art direction.

## Known Traps

### Trap 1: Negative Technology Rules

Avoid writing rules like:

```text
Do not use Three.js.
Three.js is not part of the default stack.
```

This created a false positive when the book title `The Three-Body Problem`
matched a case-insensitive `three` regex.

Prefer saying what to use:

```text
Use HTML/CSS/SVG/p5 and the shared runtime unless the task explicitly asks for
another stack.
```

### Trap 2: Old Output As Shortcut

When agents are told to reuse BGM or images from old outputs, they may also copy
the old page framework. This must be blocked explicitly.

### Trap 3: Runtime Strings Passing Evaluator

If the evaluator scans copied runtime code together with authored output, it may
think a feature exists because the runtime protocol exists.

For checks about visible controls, inspect authored `index.html`, `style.css`,
and `app.js` separately from copied runtime files.

### Trap 4: Ambiguous Boolean Fields

`entryGuide.skipControl: true` was interpreted as "hide skip" by one agent, but
runtime showed the skip button. Avoid ambiguous boolean fields. Prefer explicit
names such as:

```text
showSkipButton
defaultCollapsed
```

Or remove the field if the behavior is no longer configurable.

### Trap 5: Scaffold Placeholder Text

Prompt files generated by scaffold can be mistaken for final artifacts.

Final outputs should either:

- replace prompt placeholders with book-specific prompt records; or
- make it clear that a prompt was not used for that template path.


## Current Open Questions

These are not final decisions yet:

- Should `entryGuide.skipControl` be removed or replaced with `showSkipButton`?
- Should companion collapsed state be specified in `space-spec.json` or remain
  template-authored?
- How strict should evaluator be about prompt files for non-image templates?
- Should platform Codex become the default Multica coordinator, with local Codex
  only maintaining high-density context summaries?

## What Not To Do

- Do not migrate the entire local chat history into Multica.
- Do not ask a new agent to read every old output.
- Do not let tests become taste review.
- Do not use old generated pages as implementation templates.
- Do not write API keys or secrets into repository docs.
- Do not commit unless Cooper explicitly asks.

## Quick Start For A New Platform Agent

1. Read root `AGENTS.md`.
2. Read this handoff.
3. Read `vibereading-skill/SKILL.md`.
4. Check current Multica issues, especially QDE-11.
5. For implementation, assign BT-7274.
6. For independent review, assign CASE.
7. Keep generated-output art direction decisions for Cooper.
