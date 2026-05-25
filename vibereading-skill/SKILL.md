---
name: vibereading
description: >
  为一本书生成沉浸式阅读陪伴网页。该 Skill 会将书名与作者转译为一个
  静态 HTML/CSS/JS 页面：非滚动、探索驱动、多状态、带持续氛围引擎的
  数字阅读空间。适用于“给《xxx》生成阅读陪伴页面”“为 xxx 做沉浸式阅读空间”
  “生成文学氛围网页”等请求。
---

# VibeReading Skill

为一本书创建一个自包含的阅读陪伴页面。

生成结果不是摘要、落地页、信息面板、电子书阅读器或普通网页。它应该像一个由书籍精神生成的象征性数字空间。

## 核心契约

每个输出都必须具备以下气质：

```text
固定视口，不做传统长页面滚动
非线性或半非线性
以探索为核心
由持续存在的 atmospheric engine 驱动
通过空间状态编排推进
至少包含 entry / exploration / companion 三个协议状态
可由所选模板扩展为 4-8 个表层状态
最终可作为安静的阅读陪伴模式停留
```

`entry`、`exploration`、`companion` 是实现与校验所需的最低协议 id：

- `entry`：初始进入与定向
- `exploration`：主动探索与参与
- `companion`：可持续阅读陪伴

它们不等于固定的标题页、物件陈列、三幕叙事或侧栏面板。可见节奏、交互物、世界动词、阅读模式形态均由选中的模板决定。

先建立一个活的空间，再让模板决定内容和控件如何在这个空间里出现。

## 加载与工作流

按以下顺序执行。不要一次性读取所有参考文件，要渐进式读取。

```text
1. 获取书名与作者；作者可为空。
2. 联网检索足够可靠的书籍背景信息：主题、气质、时代、象征、阅读语境。
3. 读取 references/template-index.md，选择且只选择一个 primary template id。
4. 只读取 references/templates/[template-id].md，遵循其中的 world verb、Image Role、progression mechanic、feasibility limits。
5. 读取 references/art-direction.md。根据所选模板的 Image Role 生成概念图。
6. 如果 Agent 有图像生成能力，创建 vibereading-skill/output/[run-folder]/concept-image.png。
   如果没有图像生成能力，写入 concept-prompt.md，并用 text-only fallback 生成 visual-brief.json。
7. 读取 references/frontend-craft.md、references/note-share-export.js、
   references/audio-manifest.json、references/space-spec-schema.md。
8. 生成 vibereading-skill/output/[run-folder]/space-spec.json，并校验。
9. 读取 references/music-generation.md，尝试生成 BGM，写入 bgm-meta.json。
10. 只有在模板、visual brief 或 SpaceSpec 明确需要雨、雪、尘、落叶、萤火、扫描线等具体效果时，
    才读取 references/effects-recipes.md。
11. 生成 vibereading-skill/output/[run-folder]/index.html、style.css、app.js，并校验。
12. 将页面引用的音频从 assets/audio/ 复制到 vibereading-skill/output/[run-folder]/assets/audio/。
13. 做一次浏览器烟测：查看初始状态，执行模板核心交互，关闭可能打开的覆盖层或详情层，到达 companion 模式。
14. 告诉用户输出路径，并用一句话描述这个阅读空间。
```

除非用户明确要求混合模板，否则不要读取未选中的模板文件。

## 模板 ID

`template.primary` 必须是以下值之一：

```text
window, archive, oracle, instrument, rehearsal, labyrinth, route, vinyl
```

## 输出结构

所有新生成页面都放在 Skill 自己的输出目录：

```text
vibereading-skill/output/[YYYY-MM-DD-《书名》-测试目的]/
├── index.html
├── style.css
├── app.js
├── space-spec.json
├── visual-brief.json
├── bgm-meta.json
├── concept-image.png
├── concept-prompt.md
└── assets/
    ├── note-share-export.js
    └── audio/
```

说明：

- `index.html` 只放结构，并通过 `<link>` / `<script>` 引用 `style.css` 与 `app.js`。
- `style.css` 放全部样式：tokens、atmosphere、layout、responsive、reduced-motion。
- `app.js` 放全部逻辑：状态机、音频、计时器、笔记、事件绑定。
- 如果已经生成 `concept-image.png`，通常不需要 `concept-prompt.md`；如果没有图像生成能力，必须写 `concept-prompt.md` 作为 fallback。

---

## Prompt 1：生成 SpaceSpec JSON

将 `[BOOK_TITLE]`、`[AUTHOR]`、`[TEMPLATE_INDEX]`、`[SELECTED_TEMPLATE_DOC]`、`[VISUAL_BRIEF_JSON]`、`[AUDIO_MANIFEST]`、`[SEARCH_RESULTS]`、`[SPACE_SPEC_SCHEMA]` 替换为实际内容。

<prompt>
你是一名文学交互设计师。请将一本书转译为 VibeReading SpaceSpec JSON。

### 目标

为《[BOOK_TITLE]》生成一个非滚动、以探索为核心的阅读陪伴空间。

这不是普通网页、landing page、信息面板、游戏任务或电子书阅读器。它应该像一个由书籍气质生成的数字艺术装置。

Entry / Exploration / Companion 是最低协议状态，不是固定三幕叙事。页面表层流程必须服从所选模板的 world verb、progression mechanic 和 companion reveal rule。

### 已读取资料

已选模板如下。只允许使用这个模板，不要借用其他模板：

[SELECTED_TEMPLATE_DOC]

模板索引如下，仅用于确认选择理由：

[TEMPLATE_INDEX]

检索结果如下：

[SEARCH_RESULTS]

视觉转译简报如下。视觉系统必须优先服从它：

[VISUAL_BRIEF_JSON]

可用音频如下。音频字段必须使用精确 file 路径：

[AUDIO_MANIFEST]

SpaceSpec schema 如下。必须严格按此 JSON 结构输出：

[SPACE_SPEC_SCHEMA]

### 设计要求

- 只收集足够设计空间的上下文，不写百科全书，不剧透关键反转或结局。
- `coreTension` 用一句话抓住核心矛盾。
- `dominantImage` 写精神画面，不写封面物件。
- `spatialMetaphor` 给 coding agent 一个可实现的空间说明。
- `template.fit` 解释为什么选这个模板，而不是表面图像匹配。
- `artDirection.imageRole` 必须与所选模板的 Image Role 对齐，并在 `frontendUse` 中写清楚概念图如何进入 HTML/CSS。
- `atmosphericEngine` 要说明持续存在的空间天气：光、影、纹理、粒子、线条、景深、环境运动。
- `sceneChoreography.sceneStates` 至少包含 `entry`、`exploration`、`companion` 三个协议 id；可按模板扩展为 4-8 个状态，但不能替换或重命名这三个标准状态。
- 初始状态只保留一个主导邀请，不要同时展示完整控制面板、阶段条、碎片列表、笔记框。
- `interaction.interactionAnchors` 提供 2-5 个模板原生 affordances。它们可以是物件、区域、信号、卡牌、仪表、停靠点、光位、声音、文字块或持续操作，不必统一表现为按钮。
- interaction anchors 必须体现所选模板的主动动作，例如看天气、开档案、抽牌、调频/扫描、布光、沿文字转向、停靠路线、落针播放；不要退化成通用信息卡或一组浮动按钮。
- `interaction.atmosphereControls` 至少包含一个手动氛围控制，可为灯光、声音、天气或色调切换，具体形态由模板决定。
- Companion / sustained reading mode 是低干扰阅读能力，不是固定 dashboard 或固定侧栏。它的出现时机和形态必须服从模板。
- 阅读进度统一使用 `reading.stages`，不要另建 `chapters`。Stage 应来自原书气质和阅读姿态，而不是机械复制目录。
- 每个 stage 必须有 ordinal、label、subtitle、light、sound、hint。
- `spirit.avoid` 写出这本书最容易滑向的幼稚化、套路化、网页化错误。

### 输出格式

严格按照 `references/space-spec-schema.md` 中定义的 JSON 结构输出。所有字段必须填写；没有合适值时使用空字符串 `""` 或空数组 `[]`。

只输出 JSON，不要输出 Markdown，不要解释。
</prompt>

---

## Prompt 2：生成 index.html + style.css + app.js

将 `[BOOK_TITLE]`、`[SPACE_SPEC_JSON]`、`[VISUAL_BRIEF_JSON]`、`[SELECTED_TEMPLATE_DOC]`、`[FRONTEND_CRAFT_DOC]`、`[EFFECT_RECIPES_DOC]`、`[NOTE_SHARE_EXPORT_SCRIPT]`、`[AUDIO_MANIFEST]`、`[BGM_META_JSON]` 替换为实际内容。

<prompt>
你是一名为《[BOOK_TITLE]》创建沉浸式阅读陪伴页面的前端创意工程师。你将生成三个文件：`index.html`、`style.css`、`app.js`。

不要返回解释，只返回这三个文件的内容。

质量标准：用户应该感觉自己进入了书的世界，而不是打开了一个网页或应用。

### 输入

SpaceSpec 是唯一事实来源，必须严格按它实现：

[SPACE_SPEC_JSON]

Visual Brief 决定成熟度、光、材质、色彩、大型空间形体，以及 `concept-image.png` 在页面中的使用方式：

[VISUAL_BRIEF_JSON]

Selected Template 只提供本次空间套路。不要混用其他模板：

[SELECTED_TEMPLATE_DOC]

Frontend Craft Contract 是实现纪律，不是视觉风格预设：

[FRONTEND_CRAFT_DOC]

Effect Recipes 是按需参考。只有当 SpaceSpec 或模板明确需要具体雨、雪、尘、落叶、萤火、蝴蝶、扫描线等效果时，才使用相关 recipe。若未读取该文件，则此处写“未读取；本页不需要具体 effect recipe”：

[EFFECT_RECIPES_DOC]

Note Export Script 必须复制到 `./assets/note-share-export.js` 或内联等价逻辑：

[NOTE_SHARE_EXPORT_SCRIPT]

Audio Manifest 中的音频路径必须在页面中写成 `./assets/audio/FILE`：

[AUDIO_MANIFEST]

BGM Meta：只有当 `status` 为 `generated` 且 `file` 为 `./assets/audio/bgm.mp3` 时，页面才实现定制 BGM 功能：

[BGM_META_JSON]

### 必须实现

- 固定视口，不做传统长页面滚动。
- 至少三种协议状态 `entry` / `exploration` / `companion` 可发现；表层流程按所选模板的 progression mechanic 和 companion reveal rule 实现。
- 先实现 persistent atmospheric engine，再实现内容层；atmospheric engine 必须贯穿所有状态。
- 若 visual-brief.json 允许使用 `concept-image.png`，必须按模板 Image Role 使用它：作为世界层、物理表面、舞台空间或局部纹理，不要把图片当普通网页背景再贴通用控件。
- Initial state 只保留一个主导邀请，不要同时展示完整控制面板、阶段条、碎片列表、笔记框。
- 必须有手动氛围切换，表现为世界内部 affordance，而不是设置项。
- Companion 必须提供：阅读计时器（暂停/继续 + 重置）、stage 切换、环境声音、灯光/氛围切换、localStorage 笔记、边注保存（调用 `VibeReadingNoteShare.saveMarkdown()` 并用轻量 toast 反馈）、专注模式、返回探索入口。
- 计时器必须有暂停/继续和重置控件，不可仅为被动展示。
- 如果 BGM Meta 的 `status` 为 `generated`，必须引用 `./assets/audio/bgm.mp3`，在首次用户交互后尝试播放，并在 Companion 模式内提供 BGM 开关，且与普通环境声并列。

### 模板主导项

- 交互物件的外观与行为：严格按 SpaceSpec 的 `interactionAnchors` 和所选模板的 Objects And Controls。
- 状态推进的空间编排：遵循 frontend-craft.md 的 Spatial Choreography，具体节奏服从模板 Progression Mechanic。
- Companion 的出现时机、视觉形态和布局：严格按模板 Companion Reveal Rule。
- Stage 序号、subtitle/hint 的视觉形式：按模板 Objects And Controls。

### 视觉禁忌

- 不得显示结构名、模板名、方法名等内部标签。
- 不得呈现为 SaaS landing page、dashboard 或通用笔记应用。
- 不要把读者体验做成“信息卡片合集”。
- 不要让核心控件只是装饰；点击后必须有可见状态变化。
- 不要使用大型 SVG 道具作为主场景，除非模板明确要求；大型形体应优先由光、影、材质、图片、CSS gradient、mask 和 DOM 层构建。

### 交互纪律

严格执行 `references/frontend-craft.md` 中的 Overlay & Panel Discipline 和 Z-Index Contract：

- 每个 overlay / panel 必须支持点击背景关闭。
- 如果有可见关闭按钮，它必须可用。
- Escape 尽量关闭当前打开的 panel / overlay。
- 不得出现无法返回或无法继续的死胡同状态。
- 背景氛围层不得阻塞前景交互。

### 技术要求

- 拆分为三个文件：
  - `index.html`：纯 HTML 结构，以 `<!DOCTYPE html>` 开头，通过 `<link rel="stylesheet" href="style.css">` 和 `<script src="app.js"></script>` 引用另外两个文件；不要内联 `<style>` 或 `<script>`。
  - `style.css`：全部 CSS，从 tokens / reset 到 atmospheric engine / layout / responsive / reduced-motion。
  - `app.js`：全部 JS，包含 state machine、audio registry、timer、note export、event bindings。使用 `DOMContentLoaded` 或 readyState 检测绑定事件，避免 DOM 未渲染时查询失败。
- 可使用稳定 CDN 引入 React、framer-motion 或轻量库，但静态打开时必须仍可理解；无依赖原生实现优先。
- 必须适配移动端。
- 建立 CSS token system，token 值来自 visual-brief.json；使用空间角色类名、CSS 变量、data 属性、小型状态机、统一 audio registry。
- 音频使用 `new Audio()` 或 `<audio>`，路径为 `./assets/audio/FILE`。
- 边注保存逻辑必须可用，不依赖本地 Node/Python 服务。
- 语义按钮、可见 focus-visible、44px 触摸目标、reduced-motion fallback。

### 输出格式

只输出三个文件内容，并分别标注文件名。不要输出解释。
</prompt>

---

## 校验

交付前快速检查。若视觉烟测失败，最多重试一次。

不要声称完成浏览器视觉检查，除非真的在浏览器中打开并点击过核心路径。

### SpaceSpec

- JSON 合法。
- `template.primary` 是合法 id，`template.file` 与所选模板匹配。
- `atmosphericEngine.persistentLayers` 至少 5 个，并包含 light、texture、depth。
- `sceneChoreography.sceneStates` 和 `interaction.acts` 都包含精确 id：`entry`、`exploration`、`companion`。
- `interaction.interactionAnchors` 有 2-5 项，每项包含 `kind`、`worldRole`、`affordance`、`action`、`reveals`、`surfaceBehavior`、`spatialIntegration`。
- `interaction.atmosphereControls` 至少 1 个手动控制。
- `reading.stages` 有 3-8 个 stage，且每个 stage 有 ordinal、subtitle、light、sound、hint。
- 所有音频 file 路径都存在于 `references/audio-manifest.json`。

### BGM

- `bgm-meta.json` 存在，`status` 为 `generated`、`skipped` 或 `failed`。
- 如果 `status` 为 `generated`，`assets/audio/bgm.mp3` 必须存在，页面必须引用它。
- 如果 `status` 为 `skipped` 或 `failed`，页面仍需使用普通环境音正常工作，且不得引用不存在的 BGM。

### Visual Brief

- `visual-brief.json` 是合法 JSON，包含 `source`、`styleFamily`、`palette`、`lighting`、`materials`、`spatialDepth`、`imageUse`、`cssTranslation`、`assetPolicy`。
- `assetPolicy.forbidLargeSvgProps` 必须为 `true`。

### HTML / CSS / JS

- 三个文件齐全：`index.html`、`style.css`、`app.js`。
- `index.html` 正确引用 `style.css` 和 `app.js`，没有内联 `<style>` 或 `<script>`。
- 固定视口，非传统滚动页面。
- 初始定向 → 模板原生主动交互 → sustained reading 三段能力可发现。
- persistent atmospheric engine 在所有状态中可见，不是静态背景切换。
- 状态转换应具有空间感，不是简单 show/hide 面板。
- Companion mode 安静、低干扰，不像 dashboard，并遵循所选模板 reveal rule。
- 计时器有暂停/继续和重置。
- 笔记可 localStorage 保存，并可通过 Markdown 导出。
- Stage 切换、环境声、灯光/氛围切换、专注模式可用。
- 如果 BGM 为 generated，Companion mode 有可用 BGM 开关，且只在用户手势后播放。
- 浏览器烟测覆盖：初始邀请 → 一个核心交互 → 关闭 overlay/backdrop → 到达 sustained reading → 手动氛围控制可见生效。
- 模糊、雾、玻璃、扫描线、天气或记忆漂移效果不得影响可读文字、按钮、计时器、笔记或活动详情层。
- 移动端可用，不只是缩小桌面端。
- 使用来自 visual-brief.json 的 CSS token system；避免散落 magic colors。

### 如果以下任一问题为“是”，需要重做

- 这个页面是否只改书名就能用于很多无关书籍？
- 核心控件是否只是装饰，点击后无明显变化？
- 是否出现了内部模板名、方法名或结构标签？
- 是否使用了不必要的大型 SVG 道具？
- Companion 是否像普通生产力工具或 dashboard？
