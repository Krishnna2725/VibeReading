# Frontend Craft Contract

This file is implementation discipline, not a visual style preset.
Do not copy SaaS, dashboard, landing page, shadcn, Tailwind starter, or generic app aesthetics.

Use this structure:

```text
role → mental model → atmospheric engine → tokens → spatial components → choreography → accessibility → responsive → QA
```

## Role

Act as a senior frontend creative engineer, interaction designer, digital art director, typography specialist, and accessibility-minded UI engineer.
The page should be visually deliberate, maintainable, responsive, and interactive, not one-off prompt art.

## Mental Model Before Code

Before writing HTML, internally establish:

```text
chosen template routine
chosen template world verb and progression mechanic
visual taste from visual-brief.json
design token system
template-native affordances that become controls
large atmospheric forms that must not become SVG props
the persistent atmospheric engine
spatial scene choreography
entry / exploration / companion protocol ids, plus template-specific surface states
mobile adaptation
```

Do not output this reasoning.

## Atmospheric Engine First

Build a living environment before arranging content.
The engine is the page's persistent atmosphere: it remains active across the required states and any template-specific expanded states.

Use at least five persistent layers:

```text
light fields
shadow masses / vignette
texture / grain / paper / dust
depth structure: grid, window shadow, horizon, shelf, scanline, route, stage beam
environmental motion when needed: wind, shimmer, rain, mist, motes, signal
optional cursor glow or reactive light
```

The engine should respond to state changes with different light pressure, blur or scale, motion density, contrast, sound, or silence.
Avoid a static illustrated background with controls pasted on top.
概念图的具体使用方式由 art-direction.md 和 visual-brief.json 的 `assetPolicy` 决定；frontend-craft 不规定图片如何作为结构层。

## Rendering Mode Decision

SpaceSpec 的 `rendering.mode` 必须选择一种实现重心：

```text
dom             -> DOM / CSS 构成主要空间、物件与交互
canvas-enhanced -> DOM 承担交互与文本，Canvas / WebGL 只增强天气、信号、景深或局部视觉
three-diegetic  -> 少量可交互 3D 物件直接承担模板世界动作
```

只有当“操作三维物件”本身就是书籍理解路径的一部分时，才选择 `three-diegetic`。自动旋转模型、纯展示房间、与状态推进无关的景深，不足以支持该选择。

使用 `three-diegetic` 时：

- Three.js 负责场景物件、材质、光照和空间反馈；DOM 继续负责所有阅读文本、状态说明和关键操作语义。
- 至少一个 3D 世界动作必须直接推进 `entry -> exploration -> companion`，并在 SpaceSpec 的 `rendering.threeWorldAction` 中写明。
- 每个核心 3D 操作必须有键盘和触屏可用的 DOM 等价入口；Canvas 不能成为唯一交互树。
- WebGL 初始化失败、CDN 不可用或设备能力不足时，必须启用 `rendering.fallbackMode`，完整状态路径仍可达。
- 限制设备像素比、阴影分辨率、灯光和 Mesh 数量；移动端主动降低复杂度。
- 遵循 `prefers-reduced-motion`，页面隐藏时暂停持续渲染和合成音频，离开时释放不再使用的资源。

模板对渲染模式拥有最终约束。即使技术上可行，也不得违反模板文档中的 Three.js 禁区。

## Design Tokens & Skeuomorphism (拟物化)

Define compact CSS variables and use them consistently:

```text
--bg
--surface
--surface-2
--text
--muted
--accent
--accent-2
--shadow
--light
--grain
--motion-slow
--motion-medium
```

Tokens must come from `visual-brief.json`.
Avoid accidental colors outside variables.

When a template requires **Skeuomorphism** (e.g., `vinyl`, `instrument`), you must invent physical, tactile CSS tokens using layered shadows and gradients to simulate depth, material, and weight. DO NOT use flat design for these templates.

```css
/* Example Skeuomorphic physical tokens (Use as reference for retro machines) */
--bevel-out: inset 1px 1px 2px rgba(255,255,255,0.2), inset -1px -1px 2px rgba(0,0,0,0.5);
--bevel-in: inset 2px 2px 4px rgba(0,0,0,0.6), inset -1px -1px 1px rgba(255,255,255,0.1);
--metal-shine: linear-gradient(135deg, #555 0%, #333 50%, #444 100%);
--lcd-screen: inset 0 0 15px rgba(0,0,0,0.6), 0 0 5px rgba(122,184,212,0.2);
```

## Spatial Component Grammar

Do not think in ordinary web components like cards, navbar, hero, sidebar.
Think in template-native affordances:

```text
atmosphere layers
invitation affordance
active engagement affordance
detail or response surface
light / sound / weather / tone affordance
sustained reading surface
focus remnant or quiet trace
```

Controls may be HTML buttons and textareas under the hood, but they should appear as objects inside the world.
Each interactive affordance needs a world role, visual affordance, interaction state, keyboard/focus behavior, and mobile behavior.
Cards are allowed only when the book's world makes them feel like evidence, slips, archive pages, route stops, instrument nodes, rehearsal marks, oracle cards, or physical notes.
Even then, the atmospheric engine must visually swallow them; they should not float as generic UI cards.

## Anti-Sameness Guard

Do not reuse one universal page shell across books.
The selected template and visual brief must reshape the active engagement path, sustained reading surface, stage controls, timer, note area, and atmosphere controls.
If the same reading surface, stage controls, timer, or note layout could be copied to another unrelated book by changing only labels and colors, redesign it.
This is a layout rule, not a style preset.
The template owns the creative interaction pattern.
This file owns implementation discipline: accessibility, layering, responsive behavior, motion restraint, note export, timer controls, and QA.

## Overlay & Panel Discipline

All overlays, side panels, modals, micro-spaces, and full-screen transition layers must follow these rules:

### Backdrop Dismissal

Every overlay or panel must support backdrop dismissal:

```text
backdrop-type: clicking the dimmed backdrop area outside the panel content dismisses it
```

The panel content element may `stopPropagation` / `e.stopPropagation()` so clicks inside the panel don't bubble to the backdrop and close themselves.
If you use event delegation, bind panel buttons directly or resolve their actions before stopping propagation; panel buttons must not be trapped by the anti-bubble handler.
Visible close buttons are optional. Use one only when it fits the visual language; if present, it must work.

Exception: the initial Entry screen may be forward-only when the selected template explicitly defines a one-way threshold (e.g. ritual threshold crossing). Even then, the user must never feel trapped — after crossing they should see a clear path forward or a subtle retreat option.

### No Dead-End States

Every state beyond the initial invitation must have at least one discoverable return or forward path:

```text
Active engagement affordances must remain reachable after closing a micro-space or detail chamber.
A full-screen transitional overlay must not permanently block the world behind it.
  If an overlay blocks active engagement affordances, it must include:
  - A primary CTA that progresses forward
  - A secondary dismiss action that returns to active engagement ("继续探索", "再触碰一处", or equivalent)
```

Inner chambers, detail chambers, and transitional layers must be dismissible **without** requiring the user to commit to the next major state. The user should be able to toggle between exploration and a detail view freely.

Atmosphere panels must include a visible close/收起 affordance. Toggling by re-clicking the trigger object is acceptable as a secondary method, but the panel itself must also show a clear exit.
Smoke-test close affordances and template actions such as drawing, tuning, scanning, stopping, opening, focusing, or settling; each must produce an observable state, light, layout, text, or panel change.

### Z-Index Contract

All spatial layers must fit into a deliberate z-index hierarchy. Define it once — as CSS comments at the file top or as a named variable set — and never scatter magic z-index values:

```text
layer 0-4:   atmospheric engine (light, shadow, grain, depth, weather) — pointer-events: none
layer 5-10:  scene shell, template affordances, world constellation
layer 20-30: micro-spaces, detail chambers, side-chambers, fragment overlays
layer 40:    companion-mode overlay
layer 50-60: panels, modals, stage selector, atmosphere control panel
layer 70:    toast / notification
layer 999:   cursor glow or ambient pointer tracker
```

A lower-layer component must never block interactivity on a higher-layer component.
When in doubt, close the blocking overlay first, then transition.

### Mobile Behavior

Side panels (notes, settings) should become bottom sheets or full-width on screens narrower than 640px.
Overlay backdrops must remain tappable to dismiss on touch devices.
Atmosphere panels should not cover primary exploration objects on small screens — reduce height, use a collapsed state, or offer a peek/slide handle.

### Escape Key

Where feasible, pressing the `Escape` key should dismiss the topmost open panel, overlay, or modal. Add a single global `keydown` listener that checks for the currently-open panel.

## Layout And Texture

Use fixed viewport by default.
Compose the scene by spatial depth, not page sections.
Prefer CSS grid, absolute atmospheric layers, CSS variables, `clamp()`, `min()`, `max()`, and viewport units.

For desktop, compose the main scene against a 16:9 mental canvas first.
Do not let important affordances freely drift until they collide at common laptop widths.
Active engagement layouts usually need stable zones defined by the selected template:

```text
primary action surface
detail / response / reading surface
```

Affordances may overlap shadows, borders, stains, light halos, or inactive edges.
They should not cover readable labels, body text, primary actions, or the active detail chamber.
If the page needs a layered archive, signal map, or memory field, create depth with z-index, blur, opacity, light, and scale instead of letting text-bearing elements block each other.
Atmospheric blur belongs on background, glass, ghost, particle, reflection, or distant layers only; never place readable UI inside a parent that has `filter: blur()`.

Use texture for maturity:

```text
grain overlays
blend modes
repeating gradients
blurred light fields
shadow masses
material scratches
paper / dust / mist / scanline layers when appropriate
```

Large forms should come from light, shadow, geometry, material blocks, blur, masking, and gradients.
Small SVG or CSS symbols are allowed only as subtle traces.

## Atmospheric Effects

Every generated page must include at least one persistent, visible, low-distraction weather effect selected for the book and template.
Read `references/effects-recipes.md` and use or adapt the relevant recipe.
Weather may be rain, snow, fog, wind, dust, ash, pollen, dew, heat haze, storm light, or another credible atmospheric condition.
Color changes, audio-only ambience, scanlines, signal noise, generic glow, and random particles do not count as weather.
The effect must remain recognizable across states, avoid readable surfaces, and reduce density or motion in Companion mode.
Additional insects, falling objects, scanlines, or signal effects remain optional.
Do not fake rain, snow, dust, leaves, fireflies, butterflies, or signal motes with a single regular full-screen stripe pattern.
If UI copy, a stage, a tone state, or an audio option explicitly says rain, snow, dust, leaves, fireflies, butterflies, ash, or signal motes, that image needs a visible lightweight layer; otherwise use more abstract wording like "cool", "low noise", "dim", or "wet tone".

### Light And Tone Switches

Manual atmosphere controls must produce visible changes in the room, not just toggle a button's selected state.
实现方式由 visual-brief.json 的 `lighting.states` 和 `cssTranslation.motion` 决定。

## Typography

Typography must express the book's personality.
Do not default to system sans-serif everywhere.

Choose at most two type moods, such as literary serif, archive grotesque, monospace instrument text, rehearsal-program type, handwritten annotation, or newspaper case-file type.
Keep hierarchy clear and avoid oversized typography as fake drama.

## Spatial Choreography

Motion should serve entering and deepening.
Each state transition should feel like camera and atmosphere changing together, not a panel being toggled.
The exact standard state ids `entry`, `exploration`, and `companion` must remain present in the implementation.
They are protocol ids, not a visible three-act formula and not required layout names.
Template-specific surface states may be added around them, but they must not rename or replace `exploration`.
The state machine should use the selected template's verbs: look through weather, open archive layers, draw cards, tune/scan an instrument, focus light, handle objects, walk text, or stop along a route.

```text
slow reveal
breathing light
fade through material
glow response
layer shift
soft parallax
mode transition
blur / unblur
scale drift
scene flash or residual afterimage
light sweep
```

Avoid bouncy UI, fast snaps, game-like rewards, random particle noise, and hover effects unrelated to the world.
All interactive elements need hover, focus-visible, active or pressed feedback, and selected state where relevant.
Do not make every state a separate slide; keep the same spatial engine alive while content layers enter, dissolve, recede, or settle.
After clicking the Entry action, check the rendered scene at a common desktop viewport.
Spatial transforms may tilt, scale, or drift the world, but they must not push readable content mostly off-screen or reveal large accidental blank, black, or white triangles.

## Sustained Reading Craft

Companion 的出现时机和视觉形态由选中模板的 Companion Reveal Rule 决定，frontend-craft 不做额外规定。

### Timer

阅读计时器必须有暂停/继续和重置控件，不可仅为被动展示。
控件应融入模板的 sustained reading surface，不导入通用 app chrome。

### Reading Stages

使用 `reading.stages` 作为唯一阅读进度模型。Stage 控件的视觉形式按模板的 Objects And Controls 实现。

### Note Export

边注区必须包含一个紧凑的保存操作。
使用 `references/note-share-export.js`，复制到 `./assets/note-share-export.js` 或内联同等代码。
按钮调用 `VibeReadingNoteShare.saveMarkdown()`，传入书名、作者、当前 stage label/subtitle 和笔记文本。
脚本通过浏览器 Blob 下载本地 Markdown 副本。
用轻量 toast 或页面内状态行显示脚本返回的提示信息。
因为是静态页面，不依赖本地 Node/Python 服务。

## Accessibility And Mobile

Required:

```text
semantic buttons for clickable objects
aria-labels when visible labels are symbolic
visible focus states
44px touch targets where possible
readable contrast
no essential hover-only interaction
reduced-motion fallback where feasible
hidden objects removed from keyboard flow
```

Mobile is not a smaller desktop stage.
On small screens, reduce visible object count if needed, stack companion controls, keep Entry simple, make side chambers full-width or bottom sheets, avoid horizontal overflow, and keep touch targets comfortable.

## Implementation Cleanliness

Use clear class names based on spatial roles, CSS variables for tokens, a small JS state machine, data attributes for modes, one audio registry, one render/update path for repeated controls, and localStorage for notes.

Avoid duplicated inline styles, magic colors outside variables, unreachable hidden controls, unlabeled buttons, and large unstructured JS blocks when a simple registry would work.

## Final Self-Check

Before finishing, ask:

```text
Does the page have a clear token system?
Do visible colors come from the visual brief?
Is there a persistent atmospheric engine with at least five layers?
Do scene transitions feel spatial rather than like slide switching?
Do interactions look like world actions, not app operations?
Does sustained reading mode inherit the same material system?
Could the reading surface, stage controls, timer, and note area fit an unrelated book with only text changed? If yes, redesign.
Does the timer have pause/resume and reset controls?
Does the note area include a save action that exports Markdown?
Does mobile still feel intentional?
Are focus states and touch targets usable?
At a common 16:9 desktop size, do active affordances avoid blocking readable content?
Do rain, particles, scanlines, and texture each read as their intended effect rather than one noisy pattern?
Is at least one visible weather effect continuously present, appropriate to the book, and quieter in Companion mode?
Does a manual light/weather/tone switch visibly change the room, especially when its label implies night, lamp, dusk, or deep focus?
Is there any large SVG prop that should instead be light, shadow, or material?
Does the first screen feel like entering a book, not landing on a website?

### Overlay & Panel Checklist
Does every overlay/panel have working backdrop-click dismissal?
If a visible close button exists, does it work?
Did visible world actions that promise progression visibly change state, reveal a panel, or advance the scene?
Is there any state with no discoverable return or forward path?
Do full-screen transitional overlays avoid permanently blocking underlying affordances?
Does the atmosphere panel include a visible close affordance (not just re-toggling the trigger)?
Are side panels full-width / bottom sheets on mobile?
Does pressing Escape dismiss the active panel?
Did you write the z-index hierarchy as a comment or variable set, not scattered magic numbers?
```
