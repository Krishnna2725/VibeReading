# 占卜牌阵 (Oracle Spread)

## 模板标识 (Identity)

当书籍需要通过象征学、神话、诗歌、命运、心理学、预言、精神张力或层次丰富的内在意象进行解读时，使用 `oracle` 模板。

## 概念图作用 (Image Role)

`concept-image.png` 通常应作为**仪式表面 (Ritual Surface)**：祭坛布、羊皮纸、石板、水面、木桌、法阵，或是作为卡牌和符文背景的祭坛。

为前端生成该图像时：提供一个居中但极其宁静的表面，为 3-6 张 DOM 卡牌留出开阔的空间。不包含可读文本，不要出现具体的塔罗牌品牌，不要有任何可能喧宾夺主或与卡牌标签抢视线的花哨元素。

## 美术指导偏好 (Art Direction Bias)

占卜牌阵、构成主义预言卡、水墨抽象、民间图腾、神圣极简主义、象征性几何图形。

## 世界动词 (World Verb)

抽取 (draw) / 揭示 (reveal) / 排列 (arrange) / 解读 (interpret)

## 推进机制 (Progression Mechanic)

页面的推进是通过控制下的逐步揭示来完成，而不是像普通的抽牌游戏。

优秀的节奏示例：
```text
密封的卡牌 -> 三张牌阵 -> 关系连线 -> 解读卷轴
孤立的预兆 -> 对立的卡牌 -> 交叉的卡牌 -> 宁静的阅读表面
```

## 协议映射 (Protocol Mapping)

- `entry`: 可以是一张被覆盖的牌、密封的牌组、布上的圆阵、一个孤立的预兆，或者宁静的仪式桌。
- `exploration`: 应该包含抽取、翻转、排列卡牌，或选择具有书籍特定含义的象征符号。
- `companion`: 变成一个解读卷轴 (Interpretation Scroll)、折叠的便条、祭坛边缘留白，或是一条宁静的阅读长带。

## 交互物件与控件 (Objects And Controls)

使用 2-5 个锚点物件：牌组、卡牌背面、念珠、绳结、阵法标记、水碗、封印、折角的符纸。

舞台控制项可以是卡牌、念珠、封印、符纸，或阵法刻度。

## Frontend Pattern Notes (前端实现模式)

本节提供该模板的“高质量前端实现语法”指引，用于指导 Coding Agent 产出具备物理感、空间感和极佳交互反馈的 Web 原型。

### 1. 结构与 DOM 层级 (Z-Index Architecture)
构建一个具备神圣感、深邃感的物理牌阵：
- **`z-index: 1` Ritual Cloth (仪式底层)**: `concept-image.png` 在此层。背景可以极其缓慢地微动（如使用 `transform-origin` 和缓慢的 `rotate`，周期 60s），营造宇宙或时间的暗流。
- **`z-index: 2` Spreads & Connections (牌阵与连线)**: 使用 Canvas 或 SVG 画出极其纤细的连线、几何法阵（如 `opacity: 0.1` 的淡金线或光效线）。
- **`z-index: 3` Oracle Cards (占卜卡牌)**: DOM 构建的卡牌，必须包含正反面结构 (`.card-front`, `.card-back`)，必须绝对居中或按照经典牌阵（如三牌阵）严格布局。
- **`z-index: 4` Particle & Glow (神圣光效)**: 微弱的脉冲阴影（Pulse Box-Shadow）或 CSS 发光粒子，用于高亮当前需要交互的牌面。

### 2. 交互与动效技法 (Interaction Recipes)
- **真实的 3D 翻牌物理感**: 翻牌交互必须具有重力感。
  ```css
  .card-container { perspective: 1000px; }
  .card { 
    transform-style: preserve-3d; 
    transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1); 
  }
  .card.flipped { transform: rotateY(180deg) scale(1.05); } /* 翻开时微微放大并带有弹簧效应 */
  .card-back, .card-front { backface-visibility: hidden; }
  ```
- **延迟与仪式感**: 卡牌翻开时，不应立刻刷出大量文字。应有 0.5s 的停顿，等牌面稳住，卡牌上的隐喻符号再伴随 `opacity` 渐隐显现。
- **能量脉冲 (Energy Pulse)**: 未翻开的牌或核心卡牌应有呼吸光效：
  `animation: pulse 4s ease-in-out infinite;`配合 `box-shadow` 使用。

### 3. 各模式实现规范 (Mode Implementation)
- **Entry & Exploration**:
  - Entry 时，整个空间应该是昏暗的，卡牌背朝上。
  - 用户点击或悬浮时，不要出现常规的 tooltip，而是通过改变背景的光效（如底层的 `radial-gradient` 向该卡牌聚集）来给反馈。
- **Companion Mode (阅读陪伴模式)**:
  - **绝不**将大段文字直接挤在卡牌正面。
  - 阅读模式应在卡牌翻开后，从卡牌下方或旁边展开一段**解读卷轴 (Interpretation Scroll)**，背景为半透明的羊皮纸或星空色，使用经典的衬线字体（Serif）进行排版，仿佛是在朗读神谕。

### 4. 绝对禁忌 (Anti-Patterns)
- ❌ **常规轮播图与网格图**：绝对禁止把卡牌做成左右滑动的 Carousel 或是死板的 CSS Grid 图像库。必须是一场有空间感的祭祀。
- ❌ **硬核解密与网游 UI**：禁止做成类似于 Hearthstone 或万智牌那种带有攻击力/血量图标的奇幻游戏 UI。设计必须是极简、宗教感、甚至是抽象哲学的。
- ❌ **动画过快**：占卜需要时间。禁止使用 `< 0.3s` 的快速动画，所有动作都必须缓慢、带有神秘学的威严。
