# 单首 BGM 后台生成

MiniMax 音乐接口可能需要数分钟才返回。Agent 不得自行调用接口、等待接口响应、因等待时间过长标记 `skipped`，也不得复制其他书籍的 BGM。

## 唯一执行路径

先把最终英文 Prompt 写入输出目录：

```text
output/<任务>/prompts/bgm.txt
```

然后只执行：

```bash
python scripts/bgm-gen.py start --prompt-file "output/<任务>/prompts/bgm.txt" --output-dir "output/<任务>"
```

`start` 会立即返回。后台 worker 负责：

1. 调用 MiniMax；
2. 独立等待长延迟响应；
3. 下载到 `assets/audio/bgm.mp3`；
4. 更新 `bgm-meta.json`；
5. 把过程写入 `bgm-generation.log`。

Agent 启动任务后立即继续页面工作，不要盯住进程。完成其他工作后运行：

```bash
python scripts/bgm-gen.py status --output-dir "output/<任务>"
```

状态含义：

- `generated`：验收通过；
- `pending`：后台仍在执行，不得改成 `skipped`；
- `failed`：保留失败原因，页面使用环境音兜底；
- `skipped`：仅当用户明确要求不生成 BGM 时允许。

## Prompt

Prompt 必须为英文，描述书籍气质、速度、动态、乐器、空间感和阅读适配，并以此结尾：

```text
Strictly instrumental, no vocals, no singing, no spoken words, no lyrics.
```

脚本会固定携带：

```json
"is_instrumental": true
```

每本书只生成一首 BGM。禁止复制其他输出目录中的 BGM 伪装生成成功。
