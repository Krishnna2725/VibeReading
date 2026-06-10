# 精简 SpaceSpec 结构

只记录会真实改变生成体验的决策。JSON 字段名保持稳定，字段内容使用中文。

```json
{
  "book": {
    "title": "",
    "author": "",
    "coreTension": "",
    "dominantImage": "",
    "spatialMetaphor": ""
  },
  "template": {
    "primary": "window|archive|oracle|instrument|rehearsal|vinyl|labyrinth|route",
    "file": "references/templates/[template-id].md",
    "fit": ""
  },
  "world": {
    "initialSituation": "",
    "conceptImageRole": "worldLayer|physicalSurface|stageSpace|textureSource",
    "conceptImageUse": "",
    "palette": {
      "background": "",
      "surface": "",
      "accent": "",
      "text": "",
      "shadow": "",
      "light": ""
    },
    "materials": [],
    "weather": {
      "kind": "rain|snow|fog|wind|dust|ash|pollen|dew|heat-haze|storm-light|other",
      "visualBehavior": "",
      "stateResponse": ""
    }
  },
  "experience": {
    "signatureMechanic": {
      "name": "",
      "topology": "continuum|sequence|network|combination|spatial-composition|branching-path|cyclical",
      "playerAction": "",
      "stateMutation": "",
      "completionCondition": "",
      "companionTransformation": "",
      "antiRepetitionRule": ""
    }
  },
  "interaction": {
    "states": [
      {"id": "entry", "situation": "", "worldMutation": ""},
      {"id": "exploration", "situation": "", "worldMutation": ""},
      {"id": "companion", "situation": "", "worldMutation": ""}
    ],
    "anchors": [
      {"id": "", "label": "", "role": "", "action": "", "feedback": ""}
    ],
    "relations": [
      {"from": "", "to": "", "rule": "", "feedback": "", "changes": ""}
    ],
    "manualAtmosphereControl": {
      "label": "",
      "action": "",
      "visibleChange": ""
    }
  },
  "reading": {
    "tools": ["notes|timer|stage-navigation|focus|ambience-control"],
    "stages": [
      {"label": "", "subtitle": "", "light": "", "sound": "", "hint": ""}
    ],
    "fragments": [
      {"title": "", "body": ""}
    ]
  },
  "implementation": {
    "renderingMode": "dom|canvas-enhanced|three-diegetic",
    "threeWorldAction": "",
    "fallback": "",
    "mobileAdaptation": "",
    "accessibility": ""
  },
  "audio": {
    "ambience": [{"id": "", "file": ""}],
    "ui": [{"id": "", "file": ""}]
  },
  "avoid": []
}
```

规则：

- `anchors`：2-5 个。
- `relations`：至少 1 条；`archive` 至少 2 条。
- `states`：必须包含精确 ID `entry`、`exploration`、`companion`。
- `reading.tools`：选择 2-4 项。
- `reading.stages`：2-6 个。
- 仅当使用 `three-diegetic` 时填写 `threeWorldAction`。
- 所有音频路径必须存在于 `audio-manifest.json`。
