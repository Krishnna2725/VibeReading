# 图片生成

## Prompt 转译原则

模板文档和 SpaceSpec 是给 Agent 阅读、推理和写前端使用的，不是生图 Prompt。

Agent 必须先提炼出一条纯视觉 Prompt，再把它交给生图工具。禁止把以下内容原样输入生图工具：

- UI、面板、按钮、控件和交互要求；
- 功能清单、模板说明、验收规则和开发术语；
- 阶段 JSON、阅读提示、书名、作者名或其他待显示文字；
- “安全区用于 UI”之类会诱导模型画出界面的句子。

安全留白要翻译成纯构图语言，例如：

```text
右侧窗外区域保持低细节、低对比、无遮挡
```

不要写：

```text
右侧预留给 UI 面板
```

## 绝对禁止文字

每条图片 Prompt 都必须明确包含：

```text
No text anywhere in the image. No letters, words, numbers, captions, signs,
labels, logos, watermarks, book-cover typography, interface, panels, buttons or UI.
```

生成结果中不得出现任何文字，包括模糊文字、招牌、书脊文字、海报、标签、刻度、Logo 和水印。发现文字必须重新生成，不能交给前端遮挡。

## 通用规则

- 默认 16:9；
- 画面主体完整；
- 图片只负责视觉世界，不负责 UI；
- 不生成廉价奇幻、游戏界面、SaaS 背景或通用壁纸；
- Prompt 只描述画面中的可见内容、构图、光线、材质、天气和镜头。

## Window 硬性构图

Window 的核心主体只能是窗户与窗外世界，不是室内家居。

- 窗户加窗外景色必须占画面面积至少 `70%`；
- 透过玻璃可见的窗外景色必须占画面面积至少 `55%`；
- 室内边缘和所有家具合计不得超过 `30%`；
- 窗户必须从画面上缘延伸到下缘或接近下缘，形成主导视觉平面；
- 至少 `25%` 的窗外区域保持低细节、低对比、无遮挡，供前端文字与控件叠加；
- 沙发、床、椅子、书桌、台灯、书架不得成为前景主体；默认不生成这些物件；
- 不生成室内设计摄影、家居样板间、卧室、客厅或咖啡馆构图。

Window 母图 Prompt 应接近：

```text
A dominant floor-to-ceiling window occupying more than 70% of the frame,
with the exterior landscape visible through glass occupying more than 55%.
Only a narrow, dark interior border is visible. The window and exterior are
the unmistakable subject. Keep a broad low-detail area in the exterior view.
No furniture as focal point. No text anywhere...
```

母图生成后，最多进行三次图生图：

- 保持窗户结构、视角和整体视觉身份；
- 只改变窗外风景、天气、季节、时间和光线；
- 图片数量不需要与阅读阶段数量一致；
- 前端不得重新绘制复杂窗框和窗台。

## 其他模板

- Vinyl：生成一张无文字的书籍专属封套图案或唱片 label 图案；
- Instrument：生成一张无文字的背景环境、仪器表面或屏幕纹理；
- Route：生成一张具有清晰方向和低细节区域的旅途空间；
- Symbols：生成一张宁静的象征空间或仪式表面。

其他模板默认只生成一张主要图像，阶段变化由前端氛围表达完成。
