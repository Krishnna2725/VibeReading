# SpaceSpec JSON Schema

VibeReading SpaceSpec 的严格 JSON 输出结构。Prompt 1 生成时以此为唯一输出格式，所有字段必须填写，没有合适值时写空字符串 `""` 或空数组 `[]`。

```json
{
  "book": { "title": "", "author": "", "language": "zh" },
  "template": {
    "primary": "",
    "file": "references/templates/[template-id].md",
    "fit": "",
    "secondary": ""
  },
  "artDirection": {
    "conceptImage": "concept-image.png",
    "conceptPrompt": "",
    "visualBrief": "visual-brief.json",
    "styleFamily": "",
    "brightnessRange": "light|mid|dark|mixed",
    "abstractionLevel": "abstract|semi-abstract|representational",
    "tastePrinciple": "",
    "imageRole": "worldLayer|physicalSurface|stageSpace|textureSource",
    "frontendUse": ""
  },
  "spirit": {
    "coreTension": "",
    "emotionalTemperature": [],
    "dominantImage": "",
    "spatialMetaphor": "",
    "avoid": []
  },
  "visual": {
    "atmosphere": "",
    "palette": {
      "background": "",
      "surface": "",
      "accent": "",
      "text": "",
      "shadow": "",
      "light": ""
    },
    "materials": []
  },
  "atmosphericEngine": {
    "persistentLayers": [
      {"id": "", "type": "light|shadow|texture|weather|depth|signal|cursor|grain", "behavior": "", "implementationHint": ""}
    ],
    "reactivity": "",
    "backgroundContinuity": "",
    "mustNotBecome": []
  },
  "composition": {
    "openingFrame": "",
    "viewportScale": "intimate|balanced|monumental",
    "primaryAnchor": "",
    "titleTreatment": "centered|offset|peripheral|embedded|delayed",
    "negativeSpace": "",
    "density": "sparse|restrained|layered",
    "entryMotion": "",
    "entryInteraction": "",
    "uiPresence": "hidden|hinted|embedded|docked|staged",
    "transitionStyle": "",
    "antiPattern": []
  },
  "sceneChoreography": {
    "sceneStates": [
      {"id": "entry", "camera": "", "backgroundShift": "", "contentMotion": ""},
      {"id": "exploration", "camera": "", "backgroundShift": "", "contentMotion": ""},
      {"id": "companion", "camera": "", "backgroundShift": "", "contentMotion": ""}
    ],
    "transitionGrammar": "",
    "continuityRule": ""
  },
  "interaction": {
    "mode": "non-scrolling spatial installation",
    "acts": [
      {"id": "entry", "label": "开篇", "purpose": "", "visualState": "", "interactionGoal": ""},
      {"id": "exploration", "label": "探索", "purpose": "", "visualState": "", "interactionGoal": ""},
      {"id": "companion", "label": "陪伴", "purpose": "", "visualState": "", "interactionGoal": ""}
    ],
    "interactionAnchors": [
      {"id": "", "label": "", "kind": "object|region|dialogue|card|dial|stop|light|signal|text|gesture", "worldRole": "", "affordance": "", "action": "", "reveals": "", "surfaceBehavior": "", "spatialIntegration": ""}
    ],
    "atmosphereControls": [
      {"id": "", "label": "", "type": "light|sound|weather|tone", "worldRole": "", "states": []}
    ],
    "companionMode": {
      "entry": "",
      "surfaceForm": "",
      "lowDistractionBehavior": "",
      "persistentControls": []
    }
  },
  "reading": {
    "stages": [{"ordinal": "", "label": "", "subtitle": "", "light": "", "sound": "", "hint": ""}],
    "fragments": [{"title": "", "body": "", "hint": ""}]
  },
  "audio": {
    "sounds": [{"id": "", "label": "", "file": ""}],
    "uiSounds": [{"id": "", "label": "", "file": ""}]
  },
  "companion": {
    "timerLabel": "阅读时长",
    "noteLabel": "边注",
    "focusLabel": "专注"
  }
}
```
