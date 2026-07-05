# Dawn

Dawn is a web-first strategy society simulator built with React, Phaser, TypeScript, and Zustand.

Classic prisoner's dilemma agents roam a shared world, collide, choose to cooperate or defect, and update the standings live in the browser.

## Stack

- React + Vite + TypeScript
- Phaser 3 for the game world
- Zustand for shared simulation state
- Netlify for deployment

## Features

- **Strategy tournament** — Tit-for-Tat, Grudger, Pavlov, Always Defect, Always Cooperate, Generous Tit-for-Tat, and Random
- **Smooth watch mode** — fixed-timestep simulation, interpolated agent movement, and eased camera follow on encounters
- **Live standings & play-by-play** — sidebar ladder and encounter feed
- **Record & replay** — capture a run as JSON, download it, and scrub through it later

## Local development

```bash
cd web
npm install
npm run dev
```

## Production build

```bash
cd web
npm run build
```

## Deploy

Netlify is configured via the root `netlify.toml` to build from `web/` and publish `web/dist`.

## Record & replay

1. Click **Start recording** while a live sim is running.
2. Click **Stop recording**, then **Download replay** to save a `.json` file.
3. Click **Load replay** to watch the saved run with pause, speed control, and scrubbing.

Replay files store agent positions and events at 20 Hz — enough to reconstruct movement and standings for research or teaching demos.
