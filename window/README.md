# 《窗》THE WINDOW

A 112-second history of architecture told through one opening in the wall:
stone colonnade → Gothic glass → Alberti's perspective window → iron and glass →
the curtain-wall grid → the postmodern wink → the responsive, parametric skin.

Every frame is made in code. Seven visual languages, one continuous film:

| Time | Era | Visual language | What the architecture does |
|---|---|---|---|
| 0–22 | 5th c. BCE | copperplate engraving | the gap between columns; light and air enter |
| 22–37 | 12th–13th c. | stained glass | the wall becomes a container for light |
| 37–50 | 1435 | pen-and-wash perspective study | the window becomes a way of seeing |
| 50–64 | 1851 | cyanotype blueprint | iron and glass turn the wall into a membrane |
| 64–77 | 1920s | Swiss motion graphics | the grid; the whole wall is a window |
| 77–89 | 1970s–80s | Memphis diorama | the window starts joking |
| 89–103 | now | LiDAR point cloud | the façade becomes data, then greenery |
| 103–112 | — | engraving (coda) | the points become the first stone column again |

## Build

Requirements: Node 20+, ffmpeg, Python 3.11+ with numpy, scipy, soundfile,
and a Chromium/Edge executable for Playwright (`PLAYWRIGHT_CHROME`).
From the lemo-opuscar root:

```sh
LIB=/path/to/lemo-opuscar
PLAYWRIGHT_CHROME=/path/to/msedge sh films/window/build.sh
```

`build.sh` renders the picture, synthesizes the voice/score/mix and muxes
`window.mp4`. The film folder is self-contained except for the library's
`core/` renderer and ffmpeg.

## Files

- `index.html`, `src/` — the film page (`window.render(t)` contract)
- `audio/voice.py` — Mandarin narration (gTTS) and durations
- `audio/score.py` — original score, foley, voice mix → `out/mix.wav`
- `TREATMENT.md` — structure, shot list, cue map, sound design
- `FACTS.md` — historical claims and sources
- `CREDITS` — third-party assets and licences
- `window.mp4`, `window.srt`, `poster.jpg` — delivery

