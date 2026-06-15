# Vinyl

## Role

用一台书籍专属唱机，把开始阅读变成落针播放的声音仪式。

## Best For

记忆、时间、音乐性文本、私人史、复古气质、围绕声音或循环展开的作品。

## Avoid

唱机隐喻与书籍气质无关，或需要大量不同场景图片才能成立的书。

## Primary Production Mode

预制前端对象主导。

复用稳定的唱机主体、唱片、唱臂、旋钮、播放状态与声音逻辑。生图生成一张书籍专属专辑封套 / label。

## Creative Budget

- 封套与 label；
- 书籍专属硬件材质、色彩和铭牌；
- 落针、旋转和声音反馈；
- 四阶段 Liner Notes、灯光、天气与文字。

## Visual Preset

生图生成一张可同时用于封套与唱片 label 的图像。
唱机必须具有对象感和物理反馈，但不能变成复杂机械演示。

## BGM Preset

全书只有一张唱片和一首纯音乐 BGM。
不生成多唱片架、多专辑或多音轨。

## Weather Preset

浮尘、热浪、窗外雨影、薄雾、文字雨或缓慢风。天气应落在设备、房间和唱片材质上。

## Companion Preset

`Deck Controls`

```text
Power / Start   开始入静与声音授权
Weather         天气强度
Volume          声音
Stage           四阶段
Timer           阅读计时与番茄钟
Liner Notes     读前坐标与阶段文字
```

## Entry Guide Behavior

点击开始后设备通电，唱片旋转，唱针落下，BGM 或环境音淡入，短文字引导读者进入书籍。

## Stage Expression

四阶段不更换 BGM。通过 Liner Notes、灯光、天气、文字、材质状态和唱机反馈表达变化。

## Forbidden

- 多唱片架、多音轨和拖放多张唱片；
- 现代流媒体播放器 UI；
- 只有装饰唱机，没有清晰播放状态；
- 复杂 Three.js 房间或自由镜头；
- 大段文字直接盖在旋转唱片上。

## Acceptance

- 用户一眼理解唱机与播放；
- 点击开始后立即有声音；
- 唱片与唱臂反馈清楚；
- 四阶段可切换，但始终是一台唱机与一首 BGM。
