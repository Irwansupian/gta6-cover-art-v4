# Vice Panel Studio

[![Competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01) [![Rank](https://make.fun/badge/gta6-cover-art-01/Irwansupian/gta6-cover-art-v4/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard) [![Reward](https://make.fun/badge/gta6-cover-art-01/Irwansupian/gta6-cover-art-v4/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Vice Panel Studio is a GTA-style cover art maker that runs entirely in the
browser. You compose a video-game cover from slanted comic panels — three
layouts (Slash Trio, Quad Grid, Hero + Strip) — fill each panel with a photo
or a procedurally painted scene (sunset, night city, retro palms), give every
panel its own colour grade (gold heat, teal wash, magenta pop, violet dusk,
mono, noir), then finish it with a big Anton display title, a Pacifico
subtitle, a rating badge (RP / M / 18 / AO) and a title-seeded barcode. One
click exports the finished 1080 × 1350 cover as a PNG.

The app is plain static HTML, CSS and JavaScript under `app/` — no build
step, no dependencies, no network. The two display fonts are bundled locally
under `app/fonts/` (Anton and Pacifico, both SIL Open Font License), and the
two sample photographs under `app/samples/` ship with the entry.

## Run it

Preview the app locally (serves `app/` on http://localhost:8080):

```
node serve.ts
```

Assemble the hand-in folder the way the grader receives it — this mirrors
`app/` and `screenshots/` into the output directory and writes
`dossier.json` there using the vendored library in `vendor/makefun-app.ts`:

```
node main.ts                                  # writes to /output
MAKEFUN_OUTPUT_DIR=out node main.ts           # writes to ./out instead
```

## Layout of this repository

- `app/` — the cover maker itself (`index.html`, `style.css`, `src/main.js`
  for the editor, `src/panels.js` for layouts, scenes and grades)
- `screenshots/` — four renders of the finished app
- `main.ts` — the hand-in program described above
- `serve.ts` — a tiny local static server for previewing the app
- `vendor/makefun-app.ts` — make.fun's dossier library, vendored

Entered by @irwansupian with referral https://make.fun/r/ynek51tm
