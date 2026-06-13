# VibeReading Skill (dev)

VibeReading 是一个面向 AI Agent 的阅读体验生成 Skill。它会把一本书转译成一个可进入的沉浸式网页空间：有视觉概念、环境氛围、空间交互、阅读阶段、环境音和低干扰陪伴模式。

它不是电子书阅读器，也不是书籍介绍页。

它的目标是生成：

- 一个阅读陪伴空间
- 一段可进入的氛围
- 一个与书籍气质绑定的互动情绪场
- 一种阅读前和阅读中的数字仪式

用户应该感觉自己正在进入一本书的世界，而不是浏览一个网页。

## 设计哲学

大多数 AI 生成的"漂亮网页"失败的原因很相似：它们开始写代码太早。

如果没有清晰的艺术方向，模型很容易退回熟悉的网页套路：hero section、卡片、玻璃拟态、通用动画、随机氛围特效、无限滚动布局。结果可能在技术上能运行，但情感上是空的。

VibeReading 采用另一种方式。

它不把网页当作内容容器，而是把网页当作由一本书的情绪核心、象征系统和空间隐喻生成的数字艺术空间。

因此，工作流不会直接从"写一个页面"开始，而是先建立艺术方向，再进入实现。

## 为什么拆成多阶段工作流

视觉一致性很难在一次生成里完成。模型如果直接进入前端代码，很容易出现：

- 通用布局
- 重复的交互结构
- 流行但无意义的视觉风格
- 与文本气质脱节的动画
- 不匹配书籍情绪的 UI 组件
- 混杂的"AI 审美汤"

为了避免这些问题，VibeReading 将艺术方向和工程实现拆开：

```text
Book
→ Background Research
→ Template Selection
→ Concept Image Generation
→ Space Spec Design
→ Frontend Generation
```

概念图在这里不是装饰，而是艺术锚点。它在代码生成前先稳定页面的光线、材质、空间节奏、象征物件、字体气质和交互语言。

## 核心交互理念

VibeReading 拒绝把阅读界面做成效率工具。

生成的体验应该是：

- 非线性的
- 探索驱动的
- 氛围先行的
- 以物件和空间为交互入口的
- 带有仪式感的
- 最终服务于阅读陪伴的

交互被视为环境叙事，而不是 UI 导航。

每个页面最终都会进入一个更安静的 Companion Mode：一个低干扰的氛围空间，可以在用户阅读真实书籍时留在旁边。

## 本版相对原版的改动

### 模板系统：8 → 5

删除了 `archive`、`rehearsal`、`labyrinth` 三个模板，保留与阅读陪伴场景最契合的 5 个：

| 模板 | 拓扑 | 适合 |
|------|------|------|
| `window` | continuum / cyclical | 自然、诗歌、季节、安静旅行 |
| `oracle` | combination | 神话、诗歌、命运、心理 |
| `instrument` | continuum | 媒介、系统、科学、生态、哲学 |
| `vinyl` | cyclical / sequence | 音乐、记忆、复古文化 |
| `route` | sequence / branching-path | 旅行、流亡、迁徙、公路、河流 |

所有模板重写，核心变化：

- **交互拓扑区分**：每个模板定义独立的拓扑，不再只是视觉换皮
- **Companion 重新定义**：Companion 是持续阅读能力状态，不是必须弹出的面板
- **新增实现模式**：`three-diegetic` / `canvas-enhanced` / `dom` 三种渲染模式按需选择

### 工作流简化

| 原版 | 本版 |
|------|------|
| 11 步，含 `concept-prompt.md` 后备 | 10 步，概念图直接用 Seedream 生成 |
| `art-direction.md`、`frontend-craft.md` 单独步骤 | 已删除，视觉与实现指导下沉到各模板内部 |
| `visual-brief.json` 中间产物 | 已删除 |

### 新增文件

| 文件 | 说明 |
|------|------|
| `scripts/bgm-gen.py` | 独立 BGM 生成脚本，自动检查连通性、提交请求、下载 mp3 |
| `references/space-spec-schema.md` | SpaceSpec JSON 结构定义 |
| `references/effects-recipes.md` | 天气与氛围效果的前端实现参考 |

### 删除文件

| 文件 | 原因 |
|------|------|
| `references/art-direction.md` | 视觉指导下沉到各模板 |
| `references/frontend-craft.md` | 实现指导下沉到各模板 |

### 其他

- `music-generation.md` 补充了免费模型超时说明
- 测试脚本更新，适配新的模板结构

## 目录结构

```text
.
├── .gitignore
├── README.md
├── SKILL.md
├── assets/
│   └── audio/
├── scripts/
│   └── bgm-gen.py
├── references/
│   ├── templates/         # 5 个交互模板
│   ├── tests/
│   ├── template-index.md
│   ├── effects-recipes.md
│   ├── audio-manifest.json
│   ├── note-share-export.js
│   ├── music-generation.md
│   └── space-spec-schema.md
└── output/                # 生成结果目录，默认不提交 Git
```

## 使用方式

1. 将本仓库加载到支持 Skill / Workspace 指令的 AI Agent 中。
2. 确保 Agent 具备联网检索能力。建议同时具备图像生成能力（如 Seedream），概念图会显著影响最终页面质量。
3. 如需自动生成 BGM，设置环境变量 `MINIMAX_API_KEY`；未设置时跳过 BGM，使用内置环境音。
4. 直接对 Agent 发出指令：

```text
给《百年孤独》生成一个阅读陪伴页面
```

### BGM 独立脚本

```bash
export MINIMAX_API_KEY="your-key"
python scripts/bgm-gen.py \
  --prompt "Gentle, contemplative Chinese instrumental..." \
  --output-dir ./output/2026-06-13-《书名》/
```

## 测试

```bash
node --test references/tests/note-share-export.test.js
node references/tests/evaluate-vibereading-output.mjs output/<dir>
```

## 许可证

本项目使用 AGPL-3.0-only 许可证。

## 原版

原始版本在 [`main`](https://github.com/Krishnna2725/VibeReading/tree/main) 分支。
