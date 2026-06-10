---
name: vibereading
description: >
  Generate an immersive reading companion HTML page for a book. This skill
  transforms a book title and author into a single self-contained webpage:
  a non-scrolling, exploratory, multi-state digital reading installation.
  Use whenever the user wants a book companion page, immersive reading space,
  literary atmosphere page, or says "为《xxx》生成阅读陪伴页面", "给xxx做沉浸式阅读空间",
  or similar book-to-page generation requests.
---

# VibeReading Skill

Create a self-contained reading companion page for a book.
The result is not a summary, landing page, dashboard, or e-book reader.
It is a symbolic digital space generated from the book's spirit.

## Core Contract

Every output must feel like:

```text
non-scrolling
nonlinear or semi-nonlinear
exploration-centered
driven by a persistent atmospheric engine
choreographed through spatial scene states
at least three states: Entry / 开篇, Exploration / 探索, Companion / 陪伴
optionally expanded by the selected template into 4-8 states
finally usable as a calm reading companion mode
```

`entry`, `exploration`, and `companion` are minimum protocol ids for implementation and QA.
They mean: initial orientation, active engagement, and sustained reading.
They do **not** require a visible title card, object constellation, three-act story, or companion panel.

The selected template owns the visible surface rhythm, world verbs, interaction form, and reading-mode shape.
First build a living space; then let the selected template decide how content and controls appear inside it.

## Loading & Workflow

Follow this order. Do not load every reference at once. Use progressive disclosure.

```text
1. Get book title and author (author is optional).
2. Search the web for enough reliable book context: themes, atmosphere, background.
3. Read references/template-index.md → choose exactly one primary template id.
4. Read only references/templates/[template-id].md and follow its world verb / image role / progression mechanic / feasibility limits.
5. Read references/art-direction.md. Use the selected template's Image Role before generating the concept image.
6. Create vibereading-skill/output/[run-folder]/concept-image.png (required if agent has image generation).
   Otherwise write concept-prompt.md and visual-brief.json as text-only fallback.
7. Read references/frontend-craft.md, references/note-share-export.js,
   references/audio-manifest.json, and references/space-spec-schema.md.
8. Generate vibereading-skill/output/[run-folder]/space-spec.json with Prompt 1 → validate.
9. Read references/music-generation.md → generate BGM. Write bgm-meta.json.
10. Read references/effects-recipes.md only if the template, visual brief, or
    SpaceSpec needs rain, snow, dust, leaves, insects, signal, or scanlines.
11. Generate vibereading-skill/output/[run-folder]/index.html, style.css, and app.js with Prompt 2 → validate.
12. Copy referenced audio files from assets/audio/ to vibereading-skill/output/[run-folder]/assets/audio/.
13. Do a quick browser smoke scan: inspect the initial state, perform the selected template's core action, dismiss any opened overlay/backdrop if present, and reach the sustained reading mode.
14. Tell user the output path and one sentence describing the space.
```

Never read template files other than the one selected, unless user asks for hybrid.
Files under `references/legacy/` are archival; never load them.

## Template IDs

`template.primary` must be one of:

```text
window, archive, oracle, instrument, rehearsal, vinyl, labyrinth, route
```

## Output Structure

All generated pages go under the skill directory's own output folder:

```text
vibereading-skill/output/[YYYY-MM-DD-《书名》-测试目的]/
├── index.html              (结构 + 引用 style.css / app.js)
├── style.css               (全部 CSS：tokens, atmosphere, layout, responsive)
├── app.js                  (全部 JS：state machine, audio, timer, notes)
├── space-spec.json
├── visual-brief.json
├── bgm-meta.json          (generated/skipped/failed status for custom BGM)
├── concept-image.png      (required when image generation is available)
├── concept-prompt.md      (fallback only when image generation is unavailable)
└── assets/
    ├── note-share-export.js  (或 app.js 中内联同等逻辑)
    └── audio/
```

将 CSS 和 JS 拆分为独立文件的原因：单文件 HTML 常超出一次性输出上限，迫使模型压缩代码、跳过细节。拆为三个文件后每个文件 200-350 行，远低于压力边界，且可通过 `file://` 协议零依赖本地打开。

Do not write new runs to the repository root `output/` directory unless the user explicitly asks for a legacy path.

---

## Prompt 1: Generate SpaceSpec JSON

Fill `[BOOK_TITLE]`, `[AUTHOR]`, `[TEMPLATE_INDEX]`, `[SELECTED_TEMPLATE_DOC]`,
`[VISUAL_BRIEF_JSON]`, `[AUDIO_MANIFEST]`, and `[SEARCH_RESULTS]` with actual values.

<prompt>
你是文学交互设计师。将一本书转译为 VibeReading SpaceSpec JSON。

### 目标

为《[BOOK_TITLE]》生成一个非滚动、探索为核心的阅读陪伴空间。
这不是普通网页、landing page、信息面板或游戏任务。
它应该像一个由书籍气质生成的数字艺术互动装置。
Entry / Exploration / Companion 是最低协议状态，不是固定三幕叙事。
表层流程必须服从所选模板的 world verb、progression mechanic 和 companion reveal rule。

### 已读取资料

已选模板，只使用这一份，不要借用其他模板：

[SELECTED_TEMPLATE_DOC]

模板索引，仅用于确认选择理由：

[TEMPLATE_INDEX]

搜索结果：

[SEARCH_RESULTS]

视觉转译简报，视觉系统必须优先服从它：

[VISUAL_BRIEF_JSON]

可用音频，必须使用精确 file 路径：

[AUDIO_MANIFEST]

空间规格 schema 定义，严格按此 JSON 结构输出：

[SPACE_SPEC_SCHEMA]

### 设计重点

- 只收集足够设计空间的上下文，不写百科全书，不剧透关键反转或结局。
- `coreTension` 用一句话抓住核心矛盾。
- `dominantImage` 写精神画面，不写封面物件。
- `spatialMetaphor` 给 coding AI 一个可实现的空间说明。
- `templateFit` 解释为什么选这个模板，而不是表面图像匹配。
- 让 `artDirection.imageRole` 与已选模板的 Image Role 对齐：这张概念图在前端里是世界层、物理表面、舞台空间，还是纹理/碎片来源；`frontendUse` 写明它如何进入 HTML/CSS。
- `atmosphericEngine` 说明持续存在的空间天气：光、影、纹理、粒子/线条、景深、环境运动。
- `sceneChoreography` 说明状态之间如何通过模糊、缩放、残影、换光、层移、显影推进；至少包含 entry、exploration、companion 三个协议 id，但这些 id 只代表功能阶段，表层节奏应按模板扩展为 4-8 个状态。
- initial state 只保留一个主导邀请；它可以是窗口、桌面封口、牌堆、仪器、灯位、房间物件、文字走廊、路线标记或其他模板定义的入口。
- `interaction.interactionAnchors` 提供 2 到 5 个模板原生 affordances；它们可以是物件、区域、信号、卡牌、仪表、停靠点、光位、声音、文字块或持续操作，不必统一表现为按钮物件。
- interaction anchors 必须体现所选模板的主动作，例如看天气、开档案、抽牌、调频/扫描、布光、触摸物件、沿文字转向、停靠路线；不要退化成通用信息卡或同一套浮动按钮。
- Atmosphere 至少包含一个手动光照、声音、天气或色调切换，具体形态由模板决定。
- Companion / sustained reading mode 是低干扰阅读能力，不是固定 dashboard 或固定侧栏；它的出现时机和形状服从模板，可最终出现、周期返回、阈值显现，或作为日志/便签逐渐长出。
- 阅读进度统一用 `reading.stages`，不要另拆 `chapters`；stage 由原书气质和阅读姿态生成，而不是机械复刻目录。
- 每个 stage 必须有清晰序号、短标签、副标题/脚注、灯光、声音和阅读提示；副标题/脚注说明这一部分的主旨以及它如何联动环境。
- `avoid` 写出这本书最容易滑向的幼稚化、套路化、网页化错误。

### 输出格式

严格按照 `references/space-spec-schema.md` 中定义的 JSON 结构输出。
所有字段必须填写，没有合适值时使用空字符串 `""` 或空数组 `[]`。
只输出 JSON，不要 markdown，不要解释。
</prompt>

---

## Prompt 2: Generate index.html + style.css + app.js

Fill `[BOOK_TITLE]`, `[SPACE_SPEC_JSON]`, `[VISUAL_BRIEF_JSON]`,
`[SELECTED_TEMPLATE_DOC]`, `[FRONTEND_CRAFT_DOC]`, optional `[EFFECT_RECIPES_DOC]`, `[NOTE_SHARE_EXPORT_SCRIPT]`,
`[AUDIO_MANIFEST]`, and `[BGM_META_JSON]` with actual values.

### 生成方式

将下方 prompt 模板中的方括号内容替换为实际值后，按 prompt 中的规则输出三个文件。

写入路径：
- `vibereading-skill/output/[run-folder]/index.html`（仅 HTML 结构 + `<link>` 和 `<script>` 引用）
- `vibereading-skill/output/[run-folder]/style.css`（全部 CSS）
- `vibereading-skill/output/[run-folder]/app.js`（全部 JS）

<prompt>
你是为《[BOOK_TITLE]》创建沉浸式阅读陪伴页面的前端创意工程师。
你将生成三个文件：index.html（结构）、style.css（样式）、app.js（逻辑）。
不要返回解释，只返回这三个文件的内容。

质量标准：用户感觉自己进入了书的世界，而不是打开了一个网页或应用。

### Inputs

SpaceSpec 是唯一事实来源，严格按它实现：

[SPACE_SPEC_JSON]

Visual Brief 决定成熟度、光、材质、色彩、大型空间形体，以及 concept-image.png 在页面中的使用方式：

[VISUAL_BRIEF_JSON]

Selected Template 只提供本次空间套路，不要混用其他模板：

[SELECTED_TEMPLATE_DOC]

Frontend Craft Contract 是实现纪律，不是视觉风格预设：

[FRONTEND_CRAFT_DOC]

Effect Recipes 是按需参考。只有 SpaceSpec 或模板明确需要雨、雪、尘、落叶、萤火、蝴蝶、扫描线等效果时，才使用相关 recipe，不要为了使用效果而添加效果。若未读取该文件，则这里填“未读取；本页不需要具体效果 recipe”：

[EFFECT_RECIPES_DOC]

Note Export Script，必须复制到 `./assets/note-share-export.js` 或内联等价逻辑：

[NOTE_SHARE_EXPORT_SCRIPT]

Audio Manifest，音频路径必须使用 `./assets/audio/FILE`：

[AUDIO_MANIFEST]

BGM Meta，只有当 `status` 为 `generated` 且 `file` 为 `./assets/audio/bgm.mp3` 时，页面才实现定制 BGM 功能：

[BGM_META_JSON]

### 必须实现

**契约级硬性要求（不可缺失）：**

- 固定视口，不做传统长页滚动。
- 至少三种协议状态 `entry` / `exploration` / `companion` 必须可发现。表层流程按选中模板的 progression mechanic 和 companion reveal rule 实现。
- 先实现 persistent atmospheric engine，再实现内容层；atmospheric engine 必须贯穿所有状态。
- 若 visual-brief.json 允许使用 `concept-image.png`，必须按模板 Image Role 使用它：作为世界层、物理表面、舞台空间或局部纹理；不要把图片当普通网页背景再贴通用控件。
- Initial state 只保留一个主导邀请，不同时展示完整控制面板、阶段条、碎片列表、笔记框。
- 必须有手动氛围切换，表现为世界内部 affordance，而不是设置项。
- Companion 必须提供这些能力：阅读计时器（带暂停/继续 + 重置）、stage 切换、环境声音、灯光/氛围切换、localStorage 笔记、边注保存（调用 `VibeReadingNoteShare.saveMarkdown()`，完成后用轻量 toast 反馈）、专注模式、返回探索入口。
- 计时器必须有暂停/继续和重置控件，不可仅为被动展示。
- 若 BGM Meta 的 `status` 为 `generated`，必须提供定制 BGM 播放功能：引用 `./assets/audio/bgm.mp3`，在首次用户交互后尝试播放，Companion 模式内提供 BGM 开关按钮，与背景氛围声并列。

**以下由选中模板主导，SKILL.md 不做额外规定：**
- 交互物件的外观与行为 → 严格按 SpaceSpec 的 `interactionAnchors` + 模板的 Objects And Controls
- 状态推进的空间编排方式 → 按 frontend-craft.md 的 Spatial Choreography，具体节奏服从模板的 Progression Mechanic
- Companion 的出现时机、视觉形态和布局 → 严格按模板的 Companion Reveal Rule
- Stage 序号、副标题/脚注的视觉形式 → 按模板的 Objects And Controls

### 视觉禁忌

不得显示结构名、模板名、方法名等内部标签。
不得作为 SaaS landing page、dashboard、或通用笔记应用呈现。
具体视觉约束参见 visual-brief.json 的 `doNotCopyFromConcept` 和 `implementationRisks`，以及 art-direction.md 的 Translation Rules。

### 交互纪律

严格执行 `references/frontend-craft.md` 的 Overlay & Panel Discipline 和 Z-Index Contract。

### 技术要求

- **拆分为三个文件输出**：
  - `index.html`：纯 HTML 结构，`<!DOCTYPE html>` 开头，通过 `<link rel="stylesheet" href="style.css">` 和 `<script src="app.js"></script>` 引用另两个文件。绝对不要用内联 `<style>` 或 `<script>` 块。
  - `style.css`：全部 CSS，从 tokens / reset 到 atmospheric engine / layout / responsive / reduced-motion。
  - `app.js`：全部 JS，包含 state machine、audio registry、timer、note export、event bindings。用 `DOMContentLoaded` 或 readyState 检测做事件延迟绑定，避免 DOM 未渲染时 `getElementById` 返回 null。
- 可用 CDN 引入稳定版本的 React、framer-motion、Three.js 或轻量库（在 index.html 的 `<head>` 中以 `<link>`、`<script>` 或 import map 引用固定版本 CDN URL）。Three.js 仅在选中模板明确允许且真三维承担核心世界动作时使用；不得只作为装饰。
- 使用 WebGL / Three.js 时，DOM 必须继续承担阅读文本和关键操作语义，并提供键盘可用的等价控件、WebGL/CDN 失败降级、`prefers-reduced-motion` 处理、移动端性能收敛和受限设备像素比。降级后 `entry` / `exploration` / `companion` 仍必须可达。
- 移动端适配。
- 建立 CSS token system，token 值来自 visual-brief.json；使用空间角色类名、CSS 变量、data 属性、小型状态机、统一 audio registry。
- 音频使用 `new Audio()` 或 `<audio>`，路径为 `./assets/audio/FILE`。
- 边注保存逻辑写入 `app.js`（复制 `note-share-export.js` 的 IIFE 到文件顶部）；不依赖本地 Node/Python 服务。
- 无障碍与工程纪律参见 frontend-craft.md（语义按钮、focus-visible、44px 触摸目标、reduced-motion、隐藏元素移出可访问树、文字不糊）。
- 不要输出解释，只输出三个文件内容（分别标注文件名）。
</prompt>

---

## Validation

Quick-check before delivering. Retry once if visual scan fails.
Do not claim visual scan unless you inspected the rendered page in a browser and clicked through one core path.

### SpaceSpec (关键字段)

- Valid JSON. `template.primary` is a valid id, `template.file` matches the selected template.
- `atmosphericEngine.persistentLayers` ≥ 5; must include light, texture, depth.
- `sceneChoreography.sceneStates` and `interaction.acts` both include exact ids `entry`, `exploration`, and `companion`.
  Expanded template states may add extra ids, but must not replace or rename these three standard states.
- `interaction.interactionAnchors` has 2-5 items, each with `kind`, `worldRole`, `affordance`, `action`, `reveals`, `surfaceBehavior`, and `spatialIntegration`.
- `interaction.atmosphereControls` has ≥ 1 manual control.
- `reading.stages` has 3-8 stages with ordinal + subtitle + light + sound + hint.
- All audio file paths exist in `references/audio-manifest.json`.

### BGM

- `bgm-meta.json` exists with status `generated`, `skipped`, or `failed`.
- If status is `generated`, `assets/audio/bgm.mp3` exists and `index.html` references it.
- If status is `skipped` or `failed`, the page still works with ordinary ambience audio and must not reference missing BGM.

### Visual Brief

- `visual-brief.json` is valid JSON with `source`, `styleFamily` (name, rationale, brightness, abstraction), `palette`, `lighting`, `materials`, `spatialDepth`, `imageUse`, `cssTranslation`, `assetPolicy`.
- `assetPolicy.forbidLargeSvgProps` is `true`.

### HTML / CSS / JS（结构与视觉）

- 三个文件齐全：`index.html`（`<!DOCTYPE html>`）、`style.css`、`app.js`。`index.html` 正确引用另外两个文件（`href="style.css"` / `src="app.js"`）。无内联 `<style>` 或 `<script>` 块。
- Non-scrolling fixed viewport. The three protocol capabilities are discoverable: initial orientation → template-native active engagement → sustained reading.
- Persistent atmospheric engine visible across all states (not static BG swaps).
- Spatial transitions (not show/hide panels). Sustained reading mode is calm, not a dashboard, and its reveal rule follows the selected template.
- Timer with pause/resume + reset, notes with Markdown export, stage switching, focus mode; placement and visual form follow the selected template.
- If BGM status is `generated`, the Companion mode includes a working BGM toggle and starts playback only after a user gesture.
- Browser smoke scan covers the selected template's core path: initial invitation → one active engagement action → dismiss any opened overlay/backdrop if present → sustained reading; text-bearing UI stays visible and manual atmosphere/tone controls visibly affect the room.
- Blur, fog, glass, scanline, weather, or memory-drift effects may soften atmosphere layers, but must not be inherited by readable text, buttons, timers, notes, or active detail chambers.
- Semantic buttons, focus-visible states, 44px touch targets, reduced-motion fallback.
- Mobile responsive (not just scaled-down desktop).
- CSS token system from visual-brief.json. No magic colors.
- If WebGL / Three.js is used, core actions have DOM/keyboard equivalents, failure fallback preserves the complete state path, pixel ratio and mobile complexity are bounded, and reduced-motion visibly reduces continuous scene motion.

### Retry if answer is yes to any:

- Could this page work for many unrelated books with only the title swapped?
- Are core controls decorative, undiscoverable, or unresponsive when clicked?
- Are large SVG props used as main set pieces, or are internal labels like template names visible?
