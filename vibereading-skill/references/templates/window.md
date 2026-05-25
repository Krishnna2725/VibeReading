# 窗景观测 (Window Observatory)

## 模板标识 (Identity)

当读者需要通过观察、等待、聆听，并注意到天气、季节、距离或室内光线的变化来进入书籍时，使用 `window` 模板。

## 概念图作用 (Image Role)

`concept-image.png` 通常应作为**世界层 (World Layer)**：窗外风景、房间边缘、自然地貌、海岸线、田野、街道或天气场景。

为前端生成该图像时：16:9 比例，为文本留出清晰的负空间，不包含可读文本，不包含居中的英雄物件，没有可见的 UI，并保留足够干净的玻璃/天空/墙壁区域用于叠加元素。

前端应在概念图上叠加窗框、玻璃反光、遮罩、天气粒子、小窗扣以及纸条。不要把风景图单纯当成静态背景并在上面贴满通用控件。

## 美术指导偏好 (Art Direction Bias)

自然光、窗外风景、安静的负空间、雾气、纸白极简主义、柔和的室内阴影、克制的天气变化。

## 世界动词 (World Verb)

凝视 (look) / 等待 (wait) / 调节天气 (tune weather)

## 推进机制 (Progression Mechanic)

空间通过光线、时间流逝和天气的变化来推进，而不是通过多面板切换。

优秀的节奏示例：
```text
封闭的房间 -> 窗户变清晰 -> 天气迹象显现 -> 灯下的庇护所
白昼 -> 黄昏 -> 夜灯 -> 安静的阅读纸条
```

## 协议映射 (Protocol Mapping)

- `entry`: 可以是一扇昏暗的窗户、拉上的窗帘、玻璃反光、一个孤立的窗扣，或者悬浮在视野中的一句话。
- `exploration`: 应该是观测行为：天气刻度、风景的迹象、光线变化、声音开关或微小的窗户印记。
- `companion`: 变成一个庇护所表面（Shelter Surface）：窗边的便签、田野笔记、屋檐边缘、灯下的桌子，或安静的纸条。

## 交互物件与控件 (Objects And Controls)

使用 2-5 个锚点物件：窗扣、天气刻度、接雨碗、石头记记号、台灯、风向标、海岸刻度、窗帘边缘。

舞台控制项可以是天气刻度、季节标记、窗边纸条、海岸刻度或田野标签。
计时器和笔记应该感觉像放在窗边的真实纸张，而不是一个生产力挂件。

## Frontend Pattern Notes (前端实现模式)

本节提供该模板的“高质量前端实现语法”指引，用于指导 Coding Agent 产出具备物理感、空间感和极佳交互反馈的 Web 原型。

### 1. 结构与 DOM 层级 (Z-Index Architecture)
不要写一个大 div 塞满背景，必须通过明确的层级构建景深：
- **`z-index: 1` World Layer (窗外世界)**: `concept-image.png` 在此层。不要直接铺满，根据时间动态改变 `filter: brightness() contrast()` 或叠加 `mix-blend-mode: multiply` 的暗色遮罩。
- **`z-index: 2` Glass Layer (玻璃层)**: 
  使用 `backdrop-filter: blur(2px)` 模拟玻璃厚度。
  **必须添加玻璃反光 (Glass Glare)**：
  `background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, transparent 50%);`
- **`z-index: 3` Atmosphere (天气/呼吸层)**: 叠加极简的 Canvas 粒子（雨滴、雪滴）或 CSS `@keyframes` 驱动的雾气图层 (`opacity` 缓慢交替)。
- **`z-index: 4` Physical Frame (窗框与窗台)**: 窗框使用 `box-shadow: inset 0 0 20px rgba(0,0,0,0.8)` 制造厚度；底部单独切出一个 `div` 作为窗台 (Sill) 用于放置物件。

### 2. 交互与动效技法 (Interaction Recipes)
- **状态持久化**: 凡是被触摸过（如：拉开窗扣、拨动灯绳），必须存入 `localStorage`，重新加载时立刻恢复物理状态，营造“时间流逝但空间不变”的连贯感。
- **物理阻尼感**: 不要用 `<button>`。用 `<div>` 模拟窗扣 (Latch) 等物件，交互必须带有物理反馈：
  `transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);` (带微量回弹)。
- **光影联动**: 如果用户点亮了一盏“台灯”，不仅灯亮，窗玻璃上必须出现灯的倒影（通过 `opacity` 控制高光层），并且背景图 (World Layer) 的局部对比度需要改变。

### 3. 各模式实现规范 (Mode Implementation)
- **Entry & Exploration**:
  - Entry 时，可以先是一个全黑的房间或起雾的玻璃。
  - 核心交互不应是点按钮，而是让用户“擦拭玻璃”（鼠标滑过/拖拽清除 mask）或“拉动窗帘”（改变 div 的 `width` 或 `clip-path`）。
- **Companion Mode (阅读陪伴模式)**:
  - **绝不**弹出一个遮挡全部视野的居中 Modal。
  - 必须是物理空间的一部分：例如，文字渲染在一张“贴在玻璃上的半透明纸条”上，带有一点卷角阴影 (`border-radius` 配合多重 `box-shadow`)；或者视野下移，聚焦到窗台上的一本 Field Notebook 上。

### 4. 绝对禁忌 (Anti-Patterns)
- ❌ **通用网页组件**：禁止出现圆角的 SaaS 扁平按钮、标准网页滚动条、悬浮的导航栏。
- ❌ **死板的静态背景**：禁止直接 `background-image: cover` 然后上面什么都不做。必须有反光、有尘埃、有阴影。
- ❌ **喧宾夺主**：天气和光线变化必须是“克制且优雅的”，绝不能做成刺眼的高频动画，核心仍然是衬托文字阅读。
