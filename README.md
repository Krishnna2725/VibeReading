# VibeReading (dev)

AI Agent Skill：从一本书的精神气质生成沉浸式、非滚动的阅读陪伴网页。

本分支基于原版 (`main`) 重构，以下是相对原版的主要改动。

---

## 目录结构变化

原版将 skill 文件嵌套在 `vibereading-skill/` 子目录内，本版将其移至仓库根目录，去掉了多余的嵌套：

```
vibereading-skill/   ← 原版（已删除）
references/          ← 现在直接在根目录
assets/
scripts/
SKILL.md
```

## 相对原版的改动

### SKILL.md（工作流重写）

| 原版 | 本版 |
|------|------|
| 11 步流程，含 `concept-prompt.md` 后备 | 10 步，移除 `concept-prompt.md`（直接用 Seedream 生图） |
| 包含 `art-direction.md`、`frontend-craft.md` 步骤 | 已删除，视觉指导下沉到各模板内部 |
| `visual-brief.json` 中间产物 | 已删除 |

### 模板系统

8 个模板全部重写，核心变化：

- **交互拓扑区分**：每个模板定义独立的拓扑（`continuum` / `cyclical` / `branching-path` 等），不再只是视觉换皮
- **Companion 重新定义**：Companion 是持续阅读能力状态，不是必须弹出的面板
- **新增实现模式**：`three-diegetic` / `canvas-enhanced` / `dom` 三种渲染模式按需选择

### 新增文件

| 文件 | 说明 |
|------|------|
| `scripts/bgm-gen.py` | 独立 BGM 生成脚本，自动检查连通性、提交请求、下载 mp3 |
| `references/space-spec-schema.md` | SpaceSpec JSON 结构定义 |
| `references/effects-recipes.md` | 天气与氛围效果的前端实现参考 |

### 删除文件

| 文件 | 原因 |
|------|------|
| `references/art-direction.md` | 视觉指导下沉到各模板 |
| `references/frontend-craft.md` | 实现指导下沉到各模板 |
| `package.json` | 纯静态输出，无需 npm |
| `LICENSE` | 开源协议另行安排 |

### 其他

- 音频路径从 `references/assets/` 扁平化到 `assets/audio/`
- `music-generation.md` 补充了免费模型超时说明
- `.gitignore` 增加本地计划文档排除规则
- 测试脚本更新，适配新的模板结构

---

## 使用方式

```bash
# BGM 生成（独立脚本，可后台运行）
export MINIMAX_API_KEY="your-key"
python scripts/bgm-gen.py \
  --prompt "Gentle, contemplative Chinese instrumental..." \
  --output-dir ./output/2026-06-13-《书名》/
```

完整工作流参见 `SKILL.md`。

## 原版

原始版本在 [`main`](https://github.com/Krishnna2725/VibeReading/tree/main) 分支。
