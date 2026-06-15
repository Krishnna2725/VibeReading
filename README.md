# VibeReading Skill

VibeReading 将一本书转译成一个低干扰、可持续停留的阅读陪伴页面。它不复述剧情，也不把阅读做成解谜游戏；它用短暂的读前入静、书籍专属画面、天气、声音和基于目录划分的阅读阶段，帮助读者进入并保持阅读状态。

## V2 产品边界

每个页面都必须具备六项一级能力：

- 每次刷新都会回到首页，并重新进行 15–25 秒读前入静；
- 用户点击开始后立即播放声音，优先播放全书唯一一首纯音乐 BGM，失败时使用环境音兜底；
- 持续可见且可调节的天气效果；
- AI 主动检索目录后，按章节进度聚合出的 3–6 个阅读阶段；
- 阅读计时器；
- 25 分钟番茄钟。

浏览器禁止无交互有声播放，因此“默认播放”在本项目中的准确含义是：用户点击首页的开始按钮后，声音立即启动，入静过程绝不静默。

## 五个平等模板

| 模板 | 核心表达 |
| --- | --- |
| `window` | 一扇随阶段改变光线、天气与景色的窗 |
| `vinyl` | 一台预制唱片机与一张承载全书 BGM 的唱片 |
| `instrument` | 以仪器、刻度、波形或结构变化表现阅读状态 |
| `route` | 以一条简洁旅程和四个停靠点陪伴阅读 |
| `symbols` | 以 3–5 个象征物提供阅读观察角度 |

五个模板没有主次层级。除 `window` 可使用一张基础图加最多三张图生图变化外，其余模板默认只生成一张主图。所有模板全书只生成一首 BGM。

## 目录

```text
vibereading-skill/
├── SKILL.md
├── V2版更新计划.md
├── runtime/                       # 共享一级能力运行时
├── references/
│   ├── template-index.md
│   ├── templates/                 # 五个模板的个性化指导
│   ├── space-spec-schema.md
│   ├── entry-guide.md
│   ├── companion-components.md
│   ├── image-generation.md
│   ├── music-generation.md
│   ├── effects-recipes.md
│   ├── audio-manifest.json
│   └── tests/
├── assets/audio/
└── output/                        # 生成结果，默认不提交 Git
```

## 最小读取路径

常规生成任务只读取：

1. `SKILL.md`
2. `references/template-index.md`
3. 一个选中的模板
4. `references/space-spec-schema.md`
5. `references/audio-manifest.json`

只在对应步骤按需读取图片、音乐、入静、组件或天气参考。不要遍历全部模板和测试文件。

## 输出

所有新任务写入：

```text
output/YYYY-MM-DD-《书名》-测试目的/
├── index.html
├── style.css
├── app.js
├── space-spec.json
├── bgm-meta.json
├── concept-image.png
└── assets/audio/
```

页面必须支持直接双击 `index.html` 通过 `file://` 运行，并优先适配 16:9 桌面视口。

## 轻量校验

```bash
node --check runtime/v2-runtime.js
node --test references/tests/note-share-export.test.js references/tests/v2-runtime-contract.test.js references/tests/output-evaluator.test.js
node references/tests/evaluate-vibereading-output.mjs output/<目录>
```

输出校验器以纯代码方式检查入静、声音、阶段切换、计时、番茄钟、双击运行和显示比例，不要求 Agent 自评审美或进行浏览器、多模态检查。正式产品要求见 `V2版更新计划.md`。
