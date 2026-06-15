# V2 共享运行时

生成页面时必须把共享运行时复制到输出目录并外链。禁止把运行时复制后又内联，禁止同一脚本或样式重复加载。

不要手写骨架。先运行：

```bash
python scripts/scaffold-output.py --output-dir "output/<任务>"
```

```text
runtime/v2-runtime.js
runtime/v2-runtime.css
```

标准加载顺序：

```html
<link rel="stylesheet" href="./runtime/v2-runtime.css">
<link rel="stylesheet" href="./style.css">
...
<script src="./app.js"></script>
<script src="./runtime/v2-runtime.js"></script>
```

`app.js` 必须在顶层同步定义 `window.VIBE_READING_SPEC`。运行时负责生成 `[data-vr-stages]` 中的阶段按钮；书籍专属代码不得重复生成共享控件。

运行时通过 `data-vr-*` 属性连接页面控件，提供：

- 每次刷新回首页；
- 点击开始后 BGM / 环境音兜底；
- 入静引导；
- 可变数量的目录阶段；
- 天气三档；
- 声音与音量；
- 普通计时与 25 分钟番茄钟。

模板仍负责主体视觉、书籍个性、阶段表现和组件主题化。
