# Dawn

Dawn is a web-first prisoner's dilemma society simulator (React + Vite + TypeScript + Phaser + Zustand). The entire app lives in `web/`. There is no backend, database, or environment variables.

## Cursor Cloud specific instructions

- All commands run from `web/` (not the repo root). Dependencies are installed there by the update script.
- Single service: the Vite dev server. Start it with `npm run dev` in `web/` (serves on http://localhost:5173). This is the whole product — no auxiliary services.
- Standard scripts are in `web/package.json`: `dev`, `build` (`tsc -b && vite build`), `lint` (`oxlint`), `preview`.
- There is no automated test suite; verify changes by running the dev server and interacting with the simulator UI (Pause/Resume, speed chips, Reset world).
- `npm run lint` emits `no-unused-vars` warnings in `src/simulation/engine.ts` but exits 0 — these are pre-existing and not failures.
