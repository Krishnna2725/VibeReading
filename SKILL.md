---
name: vibereading
description: >
  为书籍生成 16:9 阅读陪伴网页。每次阅读从一段有声音的短暂入静开始，
  随后进入由主视觉、单首纯音乐 BGM、天气、基于目录划分的阅读阶段和模板专属陪伴组件构成的空间。
---

# VibeReading V2

为一本书生成安静、个性化、可长期停留的阅读陪伴空间。
它不是剧情导览、复杂互动装置、解谜游戏、电子书阅读器或生产力仪表盘。

## 核心契约

每次输出必须具备：

- 一个从 `window`、`vinyl`、`instrument`、`route`、`symbols` 中选择的模板；
- 每次刷新后重新出现的入静首页；
- 用户点击“开始”后立即出现的 BGM 或环境音；
- 一首严格纯音乐 BGM，以及 BGM 失败时的环境音兜底；
- AI 主动检索目录后，按章节进度聚合出的 3–6 个可手动切换阶段；
- 持续、克制、可调强度的天气或氛围效果；
- 模板专属陪伴组件；
- 阅读计时与番茄钟；
- 16:9 首屏完整呈现；
- `file://` 双击可用、键盘可操作，并支持减少动态效果。

浏览器通常禁止零操作有声自动播放。因此“默认播放 BGM”的实现方式统一为：

```text
页面加载 → 入静首页 → 用户点击开始 → 立即播放 BGM；失败则立即播放环境音
```

入静引导期间不得无声。

## 上下文预算

只读取当前步骤需要的文件：

```text
始终读取：  SKILL.md
选择模板：  references/template-index.md
设计实现：  仅 references/templates/[selected].md
生成规格：  references/space-spec-schema.md
入静引导：  references/entry-guide.md
陪伴组件：  references/companion-components.md
生成图片：  references/image-generation.md
选择音频：  references/audio-manifest.json
生成 BGM： references/music-generation.md
可选天气：  references/effects-recipes.md
动画增强：  references/motion-guidance.md
```

不得读取未选中的模板，不得读取 Git 历史中的旧模板，生成过程中不要读取 `references/tests/`。

## 工作流

1. 获取书名与可选作者名。
2. 搜索足够可靠的背景信息与目录；目录过长时提取章节顺序、篇幅分布和结构转折。
3. 为未读者设计无剧透入静引导，帮助读者进入本书，不单独生成额外理解框架。
4. 读取 `template-index.md`，选择恰好一个模板。
5. 仅读取选中模板；根据目录与章节进度聚合 3–6 个阅读阶段，并定义书籍身份。
6. 读取 `space-spec-schema.md`，生成 `space-spec.json`。
7. 读取 `music-generation.md`，用 `scripts/bgm-gen.py start` 启动后台 BGM 任务；不得自行等待接口或跳过。
8. 读取 `image-generation.md`，先把设计要求转译成纯视觉 Prompt，再调用生图工具；仅 Window 可基于母图生成最多三张变化图。
9. 读取音频清单，选择必要环境音作为氛围与 BGM 失败兜底。
10. 运行 `python scripts/scaffold-output.py --output-dir "output/<任务>"` 创建标准页面骨架；不要自行重建或内联共享运行时。
11. 只修改书籍专属的 `app.js`、`style.css` 和主体场景标记。
12. 复制实际引用的图片与音频。
13. 用 `scripts/bgm-gen.py status` 验收后台 BGM，并运行纯代码集成校验。

## 输出结构

```text
output/[YYYY-MM-DD-《书名》-测试目的]/
├── index.html
├── style.css
├── app.js
├── space-spec.json
├── bgm-meta.json
├── concept-image.png
├── prompts/
│   ├── image.txt
│   └── bgm.txt
├── stage-2.png               # 仅 Window 按需生成
├── stage-3.png               # 仅 Window 按需生成
├── stage-4.png               # 仅 Window 按需生成
└── assets/
    └── audio/
        ├── bgm.mp3
        └── ...
```

HTML、CSS 与 JS 必须拆分。复制并外链共享运行时，禁止复制后再次内联、禁止重复加载。关键配置定义在 `app.js`，不得依赖 `fetch()` 本地 JSON。

## 书籍身份与阶段

先定义整本书共享的：

```text
visualMotif, musicDirection, textVoice, motionCharacter, uiLanguage, avoid
```

再根据真实目录和章节进度，定义 3–6 个阶段各自的：

```text
label, sourceRange, chapters, readingHint, floatingTexts, weather, light, ambience, motion, uiAccent
```

阶段数量由 AI 根据目录结构主动决定，下限 3 个、上限 6 个。章节较多时应按结构转折和阅读进度聚合，不得用纯情绪阶段替代目录依据。
各阶段必须有可感知变化，但仍属于同一本书；提示无剧透，不解释后续剧情。
除 Window 外，阶段通常复用同一张主图，通过天气、光线、环境声、文字、动画和局部 UI 表达变化。

## 一级能力

每个模板的预制陪伴组件必须提供：

- 重新开始入静引导；
- 天气强度：关闭 / 低 / 中；
- 声音播放 / 暂停 / 音量；
- 3–6 个目录阶段切换；
- 阅读计时：暂停 / 继续 / 重置；
- 25 分钟番茄钟。

组件必须符合模板表达，默认安静，不遮挡首屏主体。

## 图片

- 默认生成一张 16:9 主图；
- 模板规则必须先转译成纯视觉 Prompt，不能原样输入生图工具；
- 图片不得出现任何文字、字符、数字、Logo、水印、标签、招牌、UI 或面板；
- Window 的母图必须直接包含完整窗边空间；前端不得重画复杂窗框；
- Window 中窗户与窗外景色至少占 70%，窗外可见景色至少占 55%，室内与家具合计不得超过 30%；
- Window 可基于母图进行最多三次图生图，只改变窗外风景、天气、季节、时间与光线；
- Vinyl、Instrument、Route、Symbols 默认只生成一张主图。

## 声音

- 每本书只生成一首 BGM；
- 必须声明 `is_instrumental: true`；
- 最终状态只能为 `generated` 或 `failed`；不得因为等待时间较长、接口调用方式不明或资源生成不方便而写成 `skipped`；
- 用户点击开始后立即尝试播放 BGM；
- BGM 不可用时立即播放环境音；
- 页面不能通过 `fetch()` 元数据后才发现 BGM；
- 只复制实际使用的音频。

## 轻量校验

不要让生成 Agent 对自己的审美和内容质量写长篇自评。交付前只做确定性的运行底线检查：

- 输出文件齐全；
- `space-spec.json` 与 `bgm-meta.json` 可解析；
- `app.js` 无语法错误；
- HTML 正确加载 CSS 与 JS；
- HTML 引用的本地资源存在；
- 运行纯代码集成校验，确认入静、声音、阶段切换、计时、番茄钟、双击运行约束与显示比例均可用。

书籍贴合度、画面气质和美术调参交给人类用户判断，不属于自动校验。
