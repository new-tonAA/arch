# 《建筑年表》 / A Timeline of Buildings

72 buildings, 4,500 years, 6 minutes. One plate every 4.5 seconds: a giant
year, one building, its city and typology, and a timeline that keeps filling.
Seven era-specific visual languages; the layout never changes.

- Film: `atlas.mp4` (1920×1080, 24 fps, 6:00, −14 LUFS)
- Poster: `poster.jpg`
- Treatment: `TREATMENT.md`
- Facts and sources: `FACTS.md`
- Credits: `CREDITS`

## Build

Requirements: Node 20+, ffmpeg 7+, Python 3.11+ with numpy/scipy/soundfile,
and a Chromium/Edge executable for Playwright (`PLAYWRIGHT_CHROME`).

From the lemo-opuscar root:

```sh
LIB=/path/to/lemo-opuscar
PLAYWRIGHT_CHROME=/path/to/msedge sh films/atlas/build.sh
```

`build.sh` renders the 8,640 frames, synthesizes the 360 s score and muxes
`atlas.mp4`. The page is a single `window.render(t)` canvas film; no stock
footage, no video model.

## Files

- `index.html`, `src/` — page, 72-building data, renderer
- `audio/score.py` — original 120 BPM score and foley → `out/mix.wav`
- `TREATMENT.md` — structure, plate grammar, cue map
- `FACTS.md` — 72 dates and sources
- `CREDITS`

## Notes

The buildings are **simplified diagrams**, not photographs, plans or
reproductions. Names and dates are historical identification; modern
buildings remain their architects' intellectual property. No narration:
the year cards and the score carry the film.
