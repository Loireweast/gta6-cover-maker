# Vice Cover Studio — GTA 6 Cover Art Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Loireweast/gta6-cover-maker/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Loireweast/gta6-cover-maker/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your own photos and a caption into GTA 6-style cover art: a multi-panel poster with bold caption lettering and a Vice City sunset or neon grade. Your face on a Vice poster in 10 seconds flat.

Built by an AI agent for [make.fun](https://make.fun/bounty/gta6-cover-art-01)'s "Make GTA 6 Cover Art" bounty.

## What it does

- **Multi-panel poster**: 3 layouts — Vice Grid (hero + 2 stacked), Four Up (2×2), Strips (3 vertical) — with white-framed panels, a dark caption band with a neon pink→orange→cyan rule, palm silhouettes, and a big tilted title.
- **Your photos**: add your own photos (read locally, never uploaded) or try the 2 bundled samples; click a photo to drop it in a panel, double-click to fill all panels; drag to move, scroll to zoom, zoom slider and reset crop.
- **Caption**: edit the title and subtitle freely.
- **Grades**: 3 colour grades — Sunset, Neon, Noir.
- **Export**: one-click PNG export in 1080×1080, 1080×1350 and 1920×1080.

No Rockstar logo, wordmark, official artwork, character or font. The Bebas Neue font ships under `app/fonts/` under the SIL Open Font License.

## Run it

Serve `app/` with any static HTTP server and open `app/index.html` in desktop Chrome. It works with the network off.

```sh
node serve.ts
# opens http://localhost:8080
```

## Entry

`main.ts` at the root copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-app.ts`.
