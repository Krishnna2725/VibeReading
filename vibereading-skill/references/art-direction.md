# Art Direction Concept Workflow

Use one generated concept image to establish taste before code.

```text
Template decides image role.
Concept image gives taste and usable material.
Visual brief translates image into frontend decisions.
Code gives behavior.
```

The concept image is not a book cover, webpage mockup, app screen, or generic background.
Specific composition requirements belong to the selected template's `Image Role`.

## Use

Generating the concept image is required when the executing agent has image generation capability.
Do not skip it for speed.

Use text-only fallback only when the executing agent has no image generation capability:

```text
write vibereading-skill/output/[run-folder]/concept-prompt.md
create visual-brief.json as text-only fallback
set source = "text-only fallback"
do not pretend an image was actually seen
```

## Prompt A: Concept Image

Save or export the result as `vibereading-skill/output/[run-folder]/concept-image.png`.

Before writing the prompt:

1. Read the selected template's `Image Role`.
2. Decide whether the image is `worldLayer`, `physicalSurface`, `stageSpace`, or `textureSource`.
3. Choose one visual style family that fits both the book and the template.

Useful visual style families:

```text
minimalism / quiet negative space
constructivism / geometric composition
Swiss editorial / grid without readable text
ink-wash abstraction / paper, void, brush pressure
naturalism / living terrain and daylight
paper collage / handmade fragments
archival documentary / institutional material
data art / abstract systems and diagrams
stage lighting / theatrical darkness and blocking
brutalist graphic / heavy mass and hard contrast
folk pattern / textile and vernacular marks
surreal spatial design / mature dream logic
window landscape / glass view with interior edge
oracle spread / cards, cloth, symbolic geometry
lo-fi instrument / gauges, sonar, machine paper
light rehearsal / beams, cue darkness, work light
text architecture / corridors and typographic turns
domestic still life / room corner, shelf, object memory
route book / folded map, road, river, vehicle window
```

Prompt skeleton:

```text
Create an art direction concept image for an immersive reading companion experience inspired by the spirit of this book.

Book: [BOOK_TITLE] by [AUTHOR]
Selected interaction template: [TEMPLATE_ID]
Image role from template: [IMAGE_ROLE]

Book spirit:
[CORE_TENSION]
[DOMINANT_IMAGE]
[SPATIAL_METAPHOR]
[EMOTIONAL_TEMPERATURE]

Primary visual style family: [STYLE_FAMILY]
Brightness and tone: [BRIGHTNESS_RANGE]
Abstraction level: [ABSTRACTION_LEVEL]

This is not a book cover, webpage mockup, app screen, e-book reader, or landing page.
Do not include navigation bars, dashboards, panels, feature cards, visible UI controls, readable text, logos, labels, or typography.

Create a symbolic spatial environment or physical surface for a digital literary installation.
Follow the selected template's image-role composition requirements.
Leave usable negative space for frontend overlays.
Focus on atmosphere, lighting direction, material texture, color palette, spatial depth, symbolic tension, and mature art direction.

Avoid childish illustration, cute props, literal clip-art objects, oversized symbolic icons, obvious cover composition, generic fantasy/sci-fi/game UI, and clean SaaS product aesthetics.
Use the selected style family actively; do not collapse every book into a dark film still.
```

## Style Match Rule

The image and frontend must share the same art language.

```text
painterly / natural image -> soft masks, quiet paper controls, restrained borders
Swiss / data / instrument image -> crisp grids, thin marks, technical type, restrained contrast
ink / paper / ritual image -> paper fibers, folded marks, small symbols, low-motion glow
archive / collage image -> paper shadows, redactions, tabs, material seams
stage / rehearsal image -> light cones, cue marks, shadow fields, minimal props
```

Avoid mismatches such as photorealistic scenery with glossy app buttons, painterly rooms with neon dashboard controls, or minimal diagrams with heavy cinematic panels.

## Prompt B: Visual Brief

Use the concept image and selected template to create `vibereading-skill/output/[run-folder]/visual-brief.json`.
Do not describe the image generally; translate it into frontend decisions.

```json
{
  "source": "concept-image|text-only fallback",
  "styleFamily": {
    "name": "",
    "rationale": "",
    "brightnessRange": "light|mid|dark|mixed",
    "abstractionLevel": "abstract|semi-abstract|representational"
  },
  "coreAtmosphere": "",
  "palette": {
    "background": "",
    "surface": "",
    "accent": "",
    "text": "",
    "shadow": "",
    "light": ""
  },
  "lighting": { "direction": "", "contrast": "", "motion": "", "states": [] },
  "materials": [],
  "spatialDepth": { "foreground": "", "midground": "", "background": "", "negativeSpace": "" },
  "imageUse": {
    "role": "worldLayer|physicalSurface|stageSpace|textureSource",
    "compositionRequirements": "",
    "negativeSpacePlan": "",
    "frontendOverlayPlan": "",
    "styleMatchRule": ""
  },
  "symbolicObjects": [
    { "name": "", "role": "interactive|atmospheric|background", "frontendRepresentation": "", "avoidLiteralCopy": "" }
  ],
  "cssTranslation": { "largeForms": "", "textures": "", "motion": "", "smallSymbols": "" },
  "assetPolicy": {
    "useBitmapBackground": false,
    "allowSmallSvg": true,
    "forbidLargeSvgProps": true,
    "notes": ""
  },
  "layoutWarnings": [],
  "doNotCopyFromConcept": [],
  "implementationRisks": []
}
```

## Translation Rules

Preserve taste: style family, atmosphere, color, light, material, spatial depth, symbolic tension.
Do not preserve unbuildable details, exact object positions, literal large props, or camera framing as fixed webpage layout.

Large visual forms become CSS gradients, light fields, shadow masses, texture layers, blurred depth planes, procedural noise, or masked bitmap layers.
Small SVG/CSS symbols are allowed only for subtle traces such as stars, thread, scratches, water ripples, map marks, or signal nodes.

Set `assetPolicy.useBitmapBackground` true only when the selected template's `Image Role` makes the image a world layer or physical surface.
When true, the visual brief must define readable negative space, gradient masks, and where UI may sit.
When false, still use `concept-image.png` for palette, material, light masks, fragments, or texture.

Never use the pattern: "generate a background image -> paste generic controls on top."
