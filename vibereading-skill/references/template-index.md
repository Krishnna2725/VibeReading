# VibeReading Template Index

Use this file only to choose one primary template.
After choosing, read only the selected file in `references/templates/`.
Do not read the other template files.

The 8 templates are **interaction prototypes**, not visual skins and not fixed page shells.
`entry`, `exploration`, and `companion` remain minimum implementation state ids for validation, but the selected template defines the visible surface rhythm, world verbs, image role, unlock conditions, and companion appearance.

Choose by the reader's main action and the page terrain:

```text
Are they looking through weather, opening evidence, drawing symbols,
tuning an instrument, shaping light, walking text, or stopping along a route?
```

The selected template is the main source of creative freedom.
It should decide:

```text
world verb
image role
visual art bias
primary affordance set
progression mechanic
companion reveal rule
frontend feasibility limits
```

The shared protocol may still use a strong familiar rhythm, such as invitation -> engagement -> reading.
The template test is whether the reader's main action, image use, and sustained reading surface feel specific to the selected prototype.

## Selection Table

| id | file | interaction prototype | best for |
| --- | --- | --- | --- |
| `window` | `references/templates/window.md` | window observatory / weather room | nature, poetry, travel, rural literature, seasonal books, pages that benefit from generated scenery |
| `archive` | `references/templates/archive.md` | archive desk / document handling | history, investigations, social critique, testimony, family records, suspense |
| `oracle` | `references/templates/oracle.md` | oracle spread / symbolic reading | myth, poetry, fate, spirituality, psychology, symbolic works |
| `instrument` | `references/templates/instrument.md` | instrument receiver / signal and sample console | polyphony, media noise, city books, ecology, philosophy, science, systems |
| `rehearsal` | `references/templates/rehearsal.md` | light rehearsal room | theater, masks, character psychology, gothic mood, public/private tension |
| `labyrinth` | `references/templates/labyrinth.md` | text labyrinth / typographic passage | experimental fiction, philosophy, dreams, mystery, recursive texts |
| `route` | `references/templates/route.md` | route book / station path | travel, exile, migration, roads, rivers, pilgrimage, life stages |
| `vinyl` | `references/templates/vinyl.md` | vinyl record player / album cover | music history, jazz age, retro culture, memoirs, books centered around rhythm or aural memory |

## Choosing Rule

Choose the template whose interaction prototype best matches how the reader should approach the book.
Do not choose by surface imagery alone.

Bad:

```text
The book mentions countryside, therefore choose window.
```

Better:

```text
The reader should sit with weather and gradually find a quiet window for reading,
therefore choose window.
```

Bad:

```text
The book is philosophical, therefore choose instrument.
```

Better:

```text
The reader should scan relations and tune a conceptual system,
therefore choose instrument. If the reader should walk through difficult language instead,
choose labyrinth.
```

Use `template.secondary` only as a short label if a book genuinely has a second pressure.
Do not read a second template file unless the user explicitly asks for hybrid templates.
