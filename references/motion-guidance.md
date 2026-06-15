# 动画指导

动画服务于入静、阶段变化和空间呼吸，不负责炫技。

## GSAP 的使用边界

如果执行环境可以把 GSAP 作为本地文件复制进输出目录，可以用 GSAP 增强：

- 入静文字 `eyebrow / text / emphasis` 的分层进入；
- 阶段切换时主图、短文字和陪伴面板状态的协调过渡；
- 可中断、可重新播放的入静时间线；
- 使用 `gsap.matchMedia()` 响应 `prefers-reduced-motion`。

禁止通过 CDN 加载 GSAP。若没有本地 GSAP 文件，继续使用共享运行时的 CSS 动画，不得阻塞生成。

## GSAP 写法

- 动画只使用 `transform`、`autoAlpha` 和 CSS 变量；
- 使用 `power1.out`、`power3.inOut` 等内置 easing；
- 多步骤序列使用 timeline，不用堆叠 delay；
- 阶段切换使用 `overwrite: "auto"`，避免快速点击时动画互相争抢；
- `prefers-reduced-motion` 下 duration 设为 0 或跳过动画。

## 禁止

- 随机漂移文字；
- 每次点击都改变元素位置；
- 弹跳、橡皮筋、旋转飞入等玩具感动画；
- 动画影响按钮可点击性或遮挡内容；
- 为普通 hover 引入 GSAP。
