# Music Generation

Each book uses exactly one BGM track.

The BGM must be instrumental:

```json
{ "is_instrumental": true }
```

The prompt must also say:

```text
Strictly instrumental, no vocals, no singing, no spoken words, no lyrics.
```

## Workflow

Use the deterministic helper instead of making the agent wait on the API manually:

```bash
python scripts/bgm-gen.py start --output-dir "output/<task-folder>" --prompt-file "output/<task-folder>/prompts/bgm.txt"
```

The script owns polling and local file placement. The agent should later check:

```bash
python scripts/bgm-gen.py status --output-dir "output/<task-folder>"
```

Do not mark BGM as `skipped` because generation is slow or the API call is unfamiliar.

Allowed final states:

```text
generated
reused
failed
```

When BGM is reused from a prior output, set `bgm-meta.json` to:

```json
{ "status": "reused", "reused_from": "<source output path or identifier>" }
```

The source field must be non-empty for auditability.

If BGM fails, the page must still play ambience after user clicks Start.

## Prompt Content

Write a short music prompt with:

- book mood;
- tempo and density;
- instrumentation;
- emotional restraint;
- no lyrics/no voice instruction;
- `is_instrumental: true`.

Do not request multiple chapter tracks.
Do not create an album or record collection unless the user explicitly asks.
