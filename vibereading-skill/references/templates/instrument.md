# 仪器接收器 (Instrument Receiver)

## 模板标识 (Identity)

当读者需要通过信号、系统、声音、生态学、理论、媒介噪音、网络、科学或隐藏结构来理解书籍时，使用 `instrument` 模板。

## 概念图作用 (Image Role)

`concept-image.png` 通常应作为**仪器表面或投影场 (Instrument Surface / Projection Field)**：接收器工作台、声纳面板、黑暗的控制台、坐标纸、城市信号墙、地图桌或机器打印纸。

为前端生成该图像时：生成一个稀疏的、类似硬件界面的物理对象，而不是软件仪表盘。留下空白的屏幕或纸张区域，供 DOM 生成的波形、节点、日志和控件栖息。

## 美术指导偏好 (Art Direction Bias)

数据艺术、低保真仪器、瑞士编辑网格、声纳、模拟接收器、机器打印纸、低噪图表。

## 世界动词 (World Verb)

调频 (tune) / 扫描 (scan) / 隔离 (isolate) / 记录 (log)

## 推进机制 (Progression Mechanic)

读者通过降低噪音，直到稳定的模式显现来推进阅读。

优秀的节奏示例：
```text
充满静电噪音的场 -> 调频刻度 -> 隔离出的频道 -> 低噪日志
表面回波 -> 扫描节点 -> 成功记录的样本 -> 阅读接收器
```

## 协议映射 (Protocol Mapping)

- `entry`: 可以是闲置的静电噪音、模糊的地图、空白的示波器、接收器的嗡嗡声，或单一不稳定的信号。
- `exploration`: 应该包含调频、扫描、隔离、静音、采样，或对比几个节点的行为。
- `companion`: 变成转录文本边缘 (Transcript Margin)、接收器日志、样本记录册，或是稳定的低噪声频道。

## 交互物件与控件 (Objects And Controls)

使用 2-5 个锚点物件：频率旋钮、波形纸带、声纳节点、天线标记、物理拨动开关、采样托盘、插头、频道指示灯。

舞台控制项可以是频率刻度、深度标记、频道指示灯、采样标签、波形标记或地图节点。

## Frontend Pattern Notes (前端实现模式)

本节提供该模板的“高质量前端实现语法”指引，用于指导 Coding Agent 产出具备物理感、空间感和极佳交互反馈的 Web 原型。

### 1. 结构与 DOM 层级 (Z-Index Architecture)
这必须是一个具有机械感和硬件厚度的界面：
- **`z-index: 1` Device Chassis (机箱外壳层)**: `concept-image.png` 在此层。可以包含金属拉丝或老旧塑料的质感，带有微小的磨损边缘。
- **`z-index: 2` Display Screens (屏幕与面板)**: 屏幕必须有内嵌的物理凹陷感。
  `box-shadow: inset 0 4px 10px rgba(0,0,0,0.8), 0 1px 1px rgba(255,255,255,0.1);`
- **`z-index: 3` Signals & Logs (信号与数据层)**: 屏幕内运动的波形（Canvas）、散落的复古绿色单色文本。文本应带有微小的发光 (`text-shadow: 0 0 8px rgba(122,184,212,0.8);`)
- **`z-index: 4` Hardware Controls (物理控件层)**: 金属旋钮 (Knobs)、厚重的机械按键 (Push Buttons)、拨动开关 (Toggles)。控件必须投下与其厚度匹配的阴影 (`drop-shadow` 或多重 `box-shadow`)。

### 2. 交互与动效技法 (Interaction Recipes)
- **金属旋钮 (Knobs)**: 使用 `conic-gradient` 模拟金属反光，鼠标拖拽控制 `transform: rotate()`。
  `background: conic-gradient(from 0deg, #444, #666 45deg, #444 90deg...);`
- **CRT / LCD 屏幕特效**: 加上扫描线 (Scanlines) 和 RGB 分离滤镜：
  ```css
  .screen::after { background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 2px, 3px 100%; }
  ```
- **机械按压反馈**: 厚重按键被按下时，不只是位移，内部的高光和外阴影都要改变：
  `.btn:active { transform: translateY(6px); box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); }`

### 3. 各模式实现规范 (Mode Implementation)
- **Entry & Exploration**:
  - 满屏的杂音 (Noise / Static) 或无意义的乱码。
  - 用户必须“动手调频”。例如转动一个旋钮，随着角度逼近某个目标值，屏幕的杂音透明度降低，文本渐渐清晰，或者波形的振幅稳定。
- **Companion Mode (阅读陪伴模式)**:
  - **绝不**弹出一个现代的白色滚动文本框。
  - 文字必须以“打字机吐出纸带”、“终端命令逐行打印”或“系统解密日志”的形式呈现。排版应像是一份长长的机械输出凭证，保持硬核的工业气质。

### 4. 绝对禁忌 (Anti-Patterns)
- ❌ **现代扁平化 SaaS UI**：禁止做成普通的 ECharts 数据仪表盘或现代网站后台。它是一台老机器，不是一个 Web App。
- ❌ **全屏覆盖的动画**：波形和信号应当局限在“屏幕面板”区域内，不得破坏周围机器外壳的空间感。
- ❌ **缺乏物理声音反馈**：(如果条件允许) 没有机械操作的声音，旋钮和按键就会显得干瘪。推荐搭配极简的 Web Audio 音效。
