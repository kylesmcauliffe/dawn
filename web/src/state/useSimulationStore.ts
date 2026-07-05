import { create } from 'zustand';

import { BrowserSimulation } from '../simulation/engine';
import { downloadRecording, interpolateFrames, parseRecording, SimulationRecorder } from '../simulation/recorder';
import { STRATEGY_ORDER } from '../simulation/strategies';
import type { ReplayRecording, SimulationSnapshot, StrategyKey } from '../simulation/types';

type AppMode = 'live' | 'replay';

type SimulationState = {
  engine: BrowserSimulation;
  snapshot: SimulationSnapshot;
  running: boolean;
  speed: number;
  mode: AppMode;
  recorder: SimulationRecorder;
  recording: boolean;
  replay: ReplayRecording | null;
  replayElapsed: number;
  uiVersion: number;
  uiAccumulator: number;
  step: (dt: number) => void;
  toggleRunning: () => void;
  setSpeed: (speed: number) => void;
  reset: (strategies?: StrategyKey[]) => void;
  startRecording: () => void;
  stopRecording: () => void;
  downloadRecording: () => void;
  loadReplay: (recording: ReplayRecording) => void;
  exitReplay: () => void;
  setReplayElapsed: (elapsed: number) => void;
  syncUi: (force?: boolean) => void;
};

const UI_REFRESH_SECONDS = 0.12;

function buildEngine(strategies: StrategyKey[] = STRATEGY_ORDER, seed = 7) {
  const engine = new BrowserSimulation(strategies, seed);
  return { engine, snapshot: engine.snapshot() };
}

function snapshotFromReplay(replay: ReplayRecording, elapsed: number): SimulationSnapshot {
  const frame = interpolateFrames(replay.frames, elapsed);
  const standings = [...frame.agents]
    .sort((a, b) => b.score - a.score)
    .map((agent) => ({ name: agent.name, score: agent.score, color: agent.color }));

  return {
    elapsed: frame.elapsed,
    agents: frame.agents,
    standings,
    events: frame.events,
    activeEncounters: [],
  };
}

const initial = buildEngine();

export const useSimulationStore = create<SimulationState>((set, get) => ({
  engine: initial.engine,
  snapshot: initial.snapshot,
  running: true,
  speed: 1,
  mode: 'live',
  recorder: new SimulationRecorder(),
  recording: false,
  replay: null,
  replayElapsed: 0,
  uiVersion: 0,
  uiAccumulator: 0,
  step: (dt) => {
    const state = get();
    if (!state.running) return;

    if (state.mode === 'replay' && state.replay) {
      const duration = state.replay.frames.at(-1)?.elapsed ?? 0;
      const nextElapsed = Math.min(duration, state.replayElapsed + dt * state.speed);
      set({
        replayElapsed: nextElapsed,
        snapshot: snapshotFromReplay(state.replay, nextElapsed),
        uiVersion: state.uiVersion + 1,
        running: nextElapsed < duration,
      });
      return;
    }

    state.engine.step(dt * state.speed);

    if (state.recording) {
      const snapshot = state.engine.snapshot();
      state.recorder.capture(snapshot.elapsed, {
        elapsed: snapshot.elapsed,
        agents: snapshot.agents,
        events: snapshot.events,
      });
    }

    const nextAccumulator = state.uiAccumulator + dt;
    if (state.engine.isDirty() && nextAccumulator >= UI_REFRESH_SECONDS) {
      state.engine.consumeDirty();
      set({
        snapshot: state.engine.snapshot(),
        uiVersion: state.uiVersion + 1,
        uiAccumulator: 0,
      });
    } else {
      set({ uiAccumulator: nextAccumulator });
    }
  },
  toggleRunning: () => set((state) => ({ running: !state.running })),
  setSpeed: (speed) => set({ speed }),
  reset: (strategies = STRATEGY_ORDER) => {
    const next = buildEngine(strategies, Math.floor(Math.random() * 1_000_000));
    set({
      engine: next.engine,
      snapshot: next.snapshot,
      running: true,
      mode: 'live',
      replay: null,
      replayElapsed: 0,
      recording: false,
      uiAccumulator: 0,
      uiVersion: get().uiVersion + 1,
    });
    get().recorder.stop();
  },
  startRecording: () => {
    const state = get();
    state.recorder.start();
    const snapshot = state.engine.snapshot();
    state.recorder.capture(
      snapshot.elapsed,
      {
        elapsed: snapshot.elapsed,
        agents: snapshot.agents,
        events: snapshot.events,
      },
      true,
    );
    set({ recording: true });
  },
  stopRecording: () => {
    get().recorder.stop();
    set({ recording: false });
  },
  downloadRecording: () => {
    const state = get();
    const recording = state.recorder.finalize(state.engine.getSeed(), state.engine.getStrategies());
    downloadRecording(recording);
  },
  loadReplay: (recording) => {
    get().recorder.stop();
    set({
      mode: 'replay',
      replay: recording,
      replayElapsed: 0,
      recording: false,
      running: true,
      snapshot: snapshotFromReplay(recording, 0),
      uiVersion: get().uiVersion + 1,
      uiAccumulator: 0,
    });
  },
  exitReplay: () => {
    const next = buildEngine(STRATEGY_ORDER, Math.floor(Math.random() * 1_000_000));
    set({
      mode: 'live',
      replay: null,
      replayElapsed: 0,
      engine: next.engine,
      snapshot: next.snapshot,
      running: true,
      uiAccumulator: 0,
      uiVersion: get().uiVersion + 1,
    });
  },
  setReplayElapsed: (elapsed) => {
    const replay = get().replay;
    if (!replay) return;
    set({
      replayElapsed: elapsed,
      snapshot: snapshotFromReplay(replay, elapsed),
      uiVersion: get().uiVersion + 1,
    });
  },
  syncUi: (force = false) =>
    set((state) => {
      if (!force && !state.engine.consumeDirty()) {
        return state;
      }
      return {
        snapshot: state.engine.snapshot(),
        uiVersion: state.uiVersion + 1,
        uiAccumulator: 0,
      };
    }),
}));

export async function loadReplayFromFile(file: File) {
  const text = await file.text();
  return parseRecording(text);
}
