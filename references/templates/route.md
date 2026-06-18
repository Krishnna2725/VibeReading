# Route

## Role

Use a route, map, road, river, rail line, or station sequence as the reader's companion.
The reader moves, stops, marks, and rests.

## Best For

Travel, wandering, growth, exile, searching, roads, rivers, migration, memory across places, and books whose structure feels like a path.

## Stable Object Skeleton

Create a strong route object:

```text
.vr-scene                          (full viewport, 16:9)
  .vr-route-canvas                  (SVG or p5 route drawing area)
    .vr-route-path                  (main path line, SVG <path> or canvas stroke)
    .vr-route-stations              (stage stops as nodes along the path)
    .vr-route-marker                (current position indicator)
  .vr-route-companion               (ticket, signpost, map legend, or compass)
  .vr-weather-layer                 (wind, rain, cloud shadow — pointer-events: none)
  [data-vr-stage]                   (station highlight, segment glow)
  .vr-guide (data-vr-guide)         (pre-reading guide overlay)
```

The route must be legible at 16:9. The path should read as a continuous line, not scattered points. Do not bury it behind generic cards.

## Production Mode

Usually one generated route/travel image plus foreground DOM/SVG/p5 route graphics.
If no image is generated, build the route with CSS/SVG/p5.

## Stage Switching

Stages are stops, segments, bends, river reaches, stations, or checkpoints.
Switching stages may:

- move the current marker;
- light the next stop;
- draw a path segment;
- change weather, light, or surrounding texture;
- show one short travel note, then fade it.

Do not simulate exact reading progress. Stages are atmosphere and companion cues.

## Companion Control

The control must be a route object. Controls are always visible as part of the route scene — do not collapse or hide them behind a toggle:

- ticket stub;
- signpost;
- station board;
- map legend;
- compass plate;
- small field notebook.

Required functions:

- replay guide;
- stage/stop switcher;
- weather strength;
- sound;
- timer/pomodoro as rest-stop timer.

No generic panel pasted over the route.

## Weather / Atmosphere

Route weather may be:

- wind across dust;
- rain on road;
- river ripple;
- station light haze;
- snow over tracks;
- heat shimmer;
- moving cloud shadow.

Each stage should shift the sense of place or weather.

## Entry Guide

The guide feels like starting a journey.

- Text appears near station, path, ticket, window edge, or roadside light.
- First action may reveal a distant light, draw the first route line, or glow the first stop.
- Continue clicks move the route slightly, change light, or mark a station.
- Exit leaves a clean route with a small companion entry.

## Visual Anti-Patterns

UI control vocabulary for route:

- Controls styled as travel objects: ticket stubs, stamps, signpost tabs, compass dial
- Continuous values: worn dial or compass needle
- Discrete states: stamp mark, ticket punch, signpost flip
- Timer: field notebook counter, rest-stop clock

Avoid:

- a generic map with no focal path;
- many floating labels;
- stage cards that cover the route;
- route text that spoils later plot;
- dashboard-style controls.
