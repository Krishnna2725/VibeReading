# 灯光排练场 (Light Rehearsal)

## 模板标识 (Identity)

当书籍涉及表演、面具、角色扮演、公共/私密的张力、人物心理学、戏剧、哥特式空间，或是处于被观察的权力关系下时，使用 `rehearsal` 模板。

## 概念图作用 (Image Role)

`concept-image.png` 通常应作为**空旷的表演空间 (Empty Performance Space)**：黑匣子剧场、排练室、侧幕、打光的木地板、后台砖墙、镜子，或是处于阴影中的门口。

为前端生成该图像时：创造强烈的明暗对比区域（光区与暗区），但避免出现细致的人脸或复杂的演员形象。前端将负责添加提示灯、剪影、面具以及舞台地贴。

## 美术指导偏好 (Art Direction Bias)

舞台灯光、排练室、明暗对比 (chiaroscuro)、侧幕、工作灯、空旷的地贴标记、受控的黑暗。

## 世界动词 (World Verb)

打光 (light) / 走位 (block) / 揭示 (reveal) / 提示 (cue)

## 推进机制 (Progression Mechanic)

读者通过改变灯光所允许看到的范围来推进页面。

优秀的节奏示例：
```text
黑暗的舞台 -> 第一个提示灯 -> 暴露的面具 -> 后台阅读剧本
工作灯 -> 聚光灯转移 -> 影子分裂 -> 安静的提示角
```

## 协议映射 (Protocol Mapping)

- `entry`: 可以是一个黑暗的地板标记、未打光的舞台、拉上的幕布、镜子的边缘，或一盏孤立的提示灯。
- `exploration`: 应该包含切换灯光、揭示面具、在不同区域间转移注意力，或对比公共/私密的剪影。
- `companion`: 是一本导演笔记、后台桌子、灯光圈内，或是安静的排练提示本。

## 交互物件与控件 (Objects And Controls)

使用 2-5 个锚点物件：聚光灯、提示灯开关、面具、幕布拉绳、地板标记 (Floor Mark)、镜子碎片、道具桌、侧门。

舞台控制项可以是提示编号、灯光标记、地板胶带、面具标签或排练卡片。

## Frontend Pattern Notes (前端实现模式)

本节提供该模板的“高质量前端实现语法”指引，用于指导 Coding Agent 产出具备物理感、空间感和极佳交互反馈的 Web 原型。

### 1. 结构与 DOM 层级 (Z-Index Architecture)
利用重度依赖混合模式的光影系统，不要直接改变背景图：
- **`z-index: 1` Stage Floor (舞台地板/背景)**: `concept-image.png`，整体可以先压暗 (`brightness(0.3)`)。
- **`z-index: 2` Props & Silhouettes (道具与剪影层)**: 使用高对比度的 SVG 或纯黑元素作为演员或面具的替身。
- **`z-index: 3` Lighting System (灯光引擎层)**: 极其关键！使用多个绝对定位的 `div`，通过 `background: radial-gradient(...)` 模拟聚光灯，利用 `mix-blend-mode: overlay` 或 `color-dodge` 切出光斑。
- **`z-index: 4` Curtains & Framing (幕布与边框)**: 使用多重 CSS 阴影（`box-shadow`）模拟垂坠的侧幕，阻挡多余光线。

### 2. 交互与动效技法 (Interaction Recipes)
- **聚光灯追踪 (Spotlight Tracking)**: 当用户移动鼠标或悬浮特定区域，聚光灯 `div` 的 `transform: translate()` 平滑跟随，照亮隐藏在暗处的文字。
  `transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);`
- **面具/剪影切换**: 点击一个光斑中的面具，使用 `clip-path` 的缓动动画，像帷幕拉开一样暴露出内部被掩盖的真实文本。
- **幕布垂感 (Curtain Physics)**: 用多个狭长的 `div` 拼接，给予渐变阴影，鼠标划过时触发微小的左右偏移，模拟布料的重量。

### 3. 各模式实现规范 (Mode Implementation)
- **Entry & Exploration**:
  - 舞台应该是全暗的（仅有一盏微弱的工作灯）。
  - 用户的操作就像是灯光师：拨动推子，聚光灯“啪”地打在某个特定标记上，那里浮现出书籍的引言或角色的台词。
- **Companion Mode (阅读陪伴模式)**:
  - **绝不**在舞台正中央用刺眼的大白字写书。
  - 阅读模式应当像退回了“后台 (Backstage)”。光线变得柔和偏暖，文字排版类似于带有涂改痕迹的剧本（Script）、散落在道具桌上的导演笔记（Director Prompt）。

### 4. 绝对禁忌 (Anti-Patterns)
- ❌ **复杂具象的演员动画**：禁止使用真实的 2D/3D 虚拟人来演戏。重点是“光”与“文字”的关系，人只应作为阴影或面具存在。
- ❌ **牺牲可读性的黑暗**：不要因为追求哥特或黑暗效果，导致正文文字黑乎乎一团无法阅读。光斑打到的地方对比度必须极高。
- ❌ **普通的切换按钮**：禁止在页面放“上一页/下一页”，必须用“Cue 1、Cue 2”等场记提示词来推进阅读。
