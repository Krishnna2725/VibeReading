# Pre-Reading Guide

The guide appears on every page load and every refresh. It is a short sound-enabled reading ceremony, not a welcome screen, tutorial, or centered subtitle fade.

The guide and pre-reading introduction are the same flow. The agent decides sentence order and pacing. Do not create a separate explanatory framework, questionnaire, or labeled columns.

The guide usually does four things without labeling them:

- slow the reader's body and attention while sound and weather begin;
- give a few spoiler-safe words about the book's atmosphere and reading posture;
- gently reveal one or two necessary interactions;
- fade the overlay away and enter the companion space.

## Sound Start

The homepage must provide one clear, poetic Start action that fits the book.

Visible guide controls should use Chinese by default: `开始`, `继续`,
`跳过引导`, `进入阅读`. Use English or another language only when the user
explicitly requests it or the book-specific art direction clearly depends on
that language. Technical `data-vr-*` hooks remain language-neutral.

After the user clicks Start:

1. immediately try `./assets/audio/bgm.mp3`;
2. if BGM fails, immediately play ambience;
3. fade sound in slowly;
4. show the first guide step and visual response;
5. every next step must wait for user click.

The guide must never be silent. Do not wait for remote generation or local JSON before deciding sound.

## Copy

Guide text must be:

- short, poetic, and aimed at a reader who has not read the book;
- spoiler-safe;
- free of unexplained proper nouns;
- not a feature walkthrough;
- around 80 to 180 Chinese characters total for Chinese books, unless the user requests another language.

Each step may include:

```text
eyebrow      very short atmospheric cue
text         main line
emphasis     shorter echo line
visual       how this line changes the scene
focusWords   1-3 key text tokens to emphasize
entryRegion  where text lands on the page (template-specific)
objectCue    template object state change for this step
```

The shared runtime provides only the basic entry shell, text hierarchy, and template-aware p5 art layer.
The page-specific code must still add book-specific layout, object feedback, and pacing.

Never settle for default centered body text fading in and out.

## Text-Animation Binding

重点词必须渲染为 `<span class="guide-focus-word" data-vr-guide-token="关键词">关键词</span>`。

动画层只能绑定两类目标：

1. **文字 token**：用 `getBoundingClientRect()` 定位，做呼吸光晕 / 聚合扩散
2. **模板物件状态**：tonearm-hover, needle-drop, power-on, groove-glow 等

禁止无目标的漂浮光点。禁止 focusX/focusY 坐标式全屏漂移。

Entry 区必须是稳定排版区域（模板相关位置），不允许默认全屏居中大字幕。

中文引导字号上限：标题 ≤ 2rem，正文 ≤ 1rem。它是入静仪式，不是机场广告牌。

## Motion Direction

Treat the guide as a 15 to 25 second micro-scene, but user-clicked step by step.
Use timeline thinking even if the final implementation uses CSS or Web Animations:

```text
0.0s   sound permission; room tone appears
0.4s   main object enters first state: window light, needle hover, CRT power, route glow, card shadow
1.2s   first text layer appears in a template-specific position
2.4s   weather / particles / light respond to the text
click  previous line recedes; next line and object state take over
exit   overlay and text fade slowly; main space stays clean
```

Use:

- timeline sequencing: not all elements enter at once;
- transform + opacity: animate `x / y / scale / rotation / opacity`;
- stagger: text, ticks, stations, cards, and particles may enter in offset rhythm;
- object-state animation: the template object changes, not only the subtitle;
- slow ease: default 900 to 1800 ms, gentle and elegant;
- reduced-motion fallback: keep light, opacity, hierarchy, and object state; remove large motion.

## Required Feedback

Every guide must include at least two of these:

- typography feedback: main line, weak line, and emphasis differ in size, color, opacity, position, or rhythm;
- environment feedback: p5 light, wind, fog, rain, ripple, scanline, vinyl highlight, route glow, card shadow;
- focus feedback: mask, spotlight, or local brightness guides the eye toward the window, record player, route, receiver, or card table;
- object feedback: visible state change such as power-on, needle drop, route lighting, card reveal, screen stabilization.

Do not use plain text only.

## Template Entrances

### Window

The guide feels like slowly seeing through a window.
Place text near the window frame, sill, reflection, or dim interior, not fixed center.
Use outside light, fog thinning, rain traces, latch glow, or glass reflection. Focus should guide the reader toward the outside view or glass surface.

### Vinyl

The guide feels like a needle-drop ritual.
Place text near the sleeve, label, tonearm, or liner notes. Let the record begin rotating slowly and the tonearm hover or descend. Text may follow circular grooves or paper liner layout.

### Instrument

The guide feels like tuning into a stable signal.
Place text inside the CRT, paper tape, LCD, or device label. Power the screen on, reduce noise, light indicators, and stabilize waveform or channel pointer.

### Route

The guide feels like the start of a journey.
Place text near a station, route line, ticket, vehicle window, or roadside light. Let a distant light appear, draw the first route segment, or brighten the first stop.

### Oracle

The guide feels like a card table appearing.
Place text near card faces, table edge, candlelight, cloth texture, or guardian card. Reveal card backs, dust, candle glow, or a slow card turn without explaining plot.

## Constraints

- Skip is always visible and always functional. There is no configurable `skipControl` or `showSkipButton` field. Do not add one.
- Skip must be visually secondary. Do not make it compete with Start.
- After the guide, the first reading view must be clean: only the main scene and the template's companion controls.
- Refresh must show the guide again.
- Do not auto-rotate text.
- Do not auto-enter reading mode.
- Do not use abrupt flashes, sudden disappearance, or fast hard cuts.
- After skip, the page must still enter a sound-enabled companion space.
