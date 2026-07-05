# Dawn

Dawn is a web-first strategy society simulator built with React, Phaser, TypeScript, and Zustand.

Classic prisoner's dilemma agents roam a Pokémon-style pixel meadow, collide, choose to cooperate or defect, and update the standings live in the browser.

## Stack

- React + Vite + TypeScript
- Phaser 3 for the tile-based game world
- Zustand for shared simulation state
- Netlify for deployment

## Features

- **Strategy tournament** — Tit-for-Tat, Grudger, Pavlov, Always Defect, Always Cooperate, Generous Tit-for-Tat, and Random
- **Pokémon-style presentation** — Game Boy palette, pixel fonts, tile meadow, chibi walk cycles, RPG dialog boxes
- **Tab navigation** — Field (watch), Dex (standings + strategy info), Journal (encounter log), Lab (record/replay)
- **Smooth watch mode** — fixed-timestep simulation, interpolated movement, eased camera on encounters
- **Record & replay** — capture a run as JSON, download it, and scrub through it later

## Local development

```bash
cd web
npm install
npm run dev
```

## Controls

| Key | Action |
|-----|--------|
| `Space` | Pause / resume |
| `1`–`4` | Switch menu tabs |
| `R` | Toggle recording (live mode) |

## Production build

```bash
cd web
npm run build
```

## Deploy

Netlify is configured via the root `netlify.toml` to build from `web/` and publish `web/dist`.

## Record & replay

1. Open the **Lab** tab and click **Start recording**.
2. Click **Stop**, then **Download .json** to save the run.
3. Click **Load replay** to watch with pause, speed control, and scrubbing.

Replay files store agent positions and events at 20 Hz — enough to reconstruct movement and standings for research or teaching demos.
