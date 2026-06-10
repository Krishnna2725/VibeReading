---
name: vibereading
description: >
  为书籍生成沉浸式、非滚动的阅读陪伴网页。
  当用户要求文学氛围页、阅读空间或沉浸式阅读陪伴时使用。
---

# VibeReading

从一本书的精神气质中生成象征性的数字空间。
它不是摘要、落地页、仪表盘、电子书阅读器或通用笔记应用。

## 精简通用契约

每次输出必须具备：

- 固定视口的空间体验；
- 一个由模板定义的签名机制；
- 状态模型中包含精确协议 ID：`entry`、`exploration`、`companion`；
- 至少一种持续可见、低干扰的天气效果；
- 从签名机制自然变形而来的持续阅读能力；
- 响应式、键盘可操作，并支持减少动态效果。

这些是能力要求，不是固定的可见流程。
不要把“标题开场 → 独立物件集合 → Companion 面板”当作所有书籍的默认答案；当它确实符合书籍气质与模板机制时，仍可使用。

## 上下文预算

只读取当前步骤真正需要的文档：

```text
始终读取：  SKILL.md
选择模板：  references/template-index.md
设计实现：  仅 references/templates/[selected].md
生成规格：  references/space-spec-schema.md
选择音频：  references/audio-manifest.json
BGM 步骤： references/music-generation.md
可选参考：  仅在需要实现指导时读取 references/effects-recipes.md
```

除非用户要求混合模板，否则不得读取其他模板。
生成过程中不要读取 `references/tests/`。

## 工作流

1. 获取书名与可选作者名。
2. 搜索足够可靠的背景信息，理解主题与氛围，但不剧透关键转折。
3. 读取 `references/template-index.md`，选择恰好一个模板。
4. 仅读取选中模板。模板中的机制、视觉语法、图像角色、天气倾向、阅读表面与实现说明优先于通用习惯。
5. 按模板的图像角色生成 `concept-image.png`；无法生图时写入 `concept-prompt.md`。
6. 读取 `references/space-spec-schema.md`，生成精简的 `space-spec.json`。
7. 读取 `references/audio-manifest.json`，只选择页面实际使用的音频。
8. 读取 `references/music-generation.md`，启动纯音乐 BGM 生成并写入 `bgm-meta.json`。
9. 生成 `index.html`、`style.css` 与 `app.js`。
10. 复制实际引用的音频；仅当选择了笔记工具时复制 `references/note-share-export.js`。
11. 校验文件，并在浏览器中实测签名动作与持续阅读能力。

## 输出结构

新任务写入：

```text
vibereading-skill/output/[YYYY-MM-DD-《书名》-测试目的]/
├── index.html
├── style.css
├── app.js
├── space-spec.json
├── bgm-meta.json
├── concept-image.png
├── concept-prompt.md        # 仅生图不可用时
└── assets/
    ├── note-share-export.js # 仅选择笔记工具时
    └── audio/
```

HTML、CSS 与 JS 必须拆分，页面应能作为静态站点运行。

## 概念图

模板决定概念图是世界层、物理表面、舞台空间还是纹理来源。

概念图提示词应：

- 遵循选中模板的构图要求；
- 捕捉书籍的核心张力、主导意象、光线、材质、色彩与空间深度；
- 保留可用的负空间；
- 不包含可读文字、UI、Logo、导航、面板或封面式构图；
- 避免幼稚插画、直白剪贴画、通用奇幻/游戏界面和 SaaS 美学。

概念图用于稳定审美方向。不要在图片上粘贴通用控件。
将它的光、材质、色彩与深度转译到 `space-spec.json` 和 CSS 中。

## SpaceSpec

`space-spec.json` 是设计决策记录，不是内容资料堆。
每个值都必须具体到足以改变最终实现。

它需要定义：

- 书籍精神与空间隐喻；
- 选中模板及其适配原因；
- 精简视觉系统与概念图用法；
- 签名机制、拓扑关系、完成条件与 Companion 变形；
- 初始情境与协议状态；
- 持续天气；
- 选中的阅读工具与音频；
- 渲染模式与降级方式。

签名机制不能是通用的点击揭示。
至少一个可见结果必须依赖关系、顺序、连续数值、空间编排、路径分支或重复经过。

## 实现契约

优先遵循选中模板。所有模板共同遵守：

- 先建立活着的空间，再放置内容。
- 使用 CSS 变量统一色彩、材质、阴影、光与动态。
- 可读文字保留在 DOM；氛围可使用 CSS、Canvas 或 Three.js。
- 使用语义化控件、可见焦点、舒适触摸区域；关键操作不能只靠悬停。
- 移动端应改变交互方式，而不是简单缩小桌面版。
- 天气在各状态持续存在，并在持续阅读时变得更安静。
- Entry 可以从动作进行到一半时开始，不要求欢迎页。
- Companion 是能力状态，不是必须出现的容器。

### 阅读工具

根据模板选择 2-4 项：

```text
notes, timer, stage-navigation, focus, ambience-control
```

将它们嵌入模板原生物件，不要集中到通用面板。
选择 `notes` 时，使用本地存储并调用 `VibeReadingNoteShare.saveMarkdown()` 导出 Markdown。
选择 `timer` 时，必须提供暂停/继续与重置。
BGM 生成成功时，只能在用户交互后播放，并提供符合世界语法的开关。

### Three.js

仅当操作三维物件本身就是模板签名动作时，才使用 `three-diegetic`。
Three.js 负责物件、材质、光与空间；DOM 负责文字和语义等价操作。
必须提供 WebGL/CDN 降级、受限像素比、减少动态效果、移动端简化，以及键盘与触屏等价操作。

### 浮层

优先原地变形，少用面板。
任何浮层都必须能通过背景区域或清晰的世界内退出动作关闭；条件允许时支持 Escape，且不得产生死路。

## 校验

交付前检查：

- 必要文件存在，所有引用路径有效；
- SpaceSpec 符合 `references/space-spec-schema.md`；
- 签名拓扑符合模板，并真实实现了关系；
- 协议状态包含 `entry`、`exploration`、`companion`；
- 存在持续可见的天气，且不遮挡正文；
- 选中的阅读工具可用，未选择的工具没有生成通用界面；
- BGM 元数据声明 `is_instrumental: true`，生成的 BGM 不含歌词与人声；
- 概念图按模板图像角色使用；
- 页面固定视口、响应式、可访问，并支持减少动态效果；
- 浏览器实测路径为：初始情境 → 签名关系动作 → 可观察的世界变化 → 持续阅读能力。

如果页面只需替换书名、标签和颜色就能用于无关书籍，必须重新设计。
