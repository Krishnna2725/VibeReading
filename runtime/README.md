# V2 共享运行时

生成页面时可以复制或内联：

```text
runtime/v2-runtime.js
runtime/v2-runtime.css
```

页面必须在加载运行时前定义：

```html
<script>
  window.VIBE_READING_SPEC = {
    entryGuide: { durationSec: 20, steps: [] },
    audio: { bgmFile: "./assets/audio/bgm.mp3", ambienceFiles: [] },
    stages: []
  };
</script>
```

运行时通过 `data-vr-*` 属性连接页面控件，提供：

- 每次刷新回首页；
- 点击开始后 BGM / 环境音兜底；
- 入静引导；
- 四阶段；
- 天气三档；
- 声音与音量；
- 普通计时与 25 分钟番茄钟。

模板仍负责主体视觉、书籍个性、阶段表现和组件主题化。
