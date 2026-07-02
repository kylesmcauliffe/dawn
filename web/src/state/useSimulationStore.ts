import { create } from 'zustand';

import { DEFAULT_GAME_CONFIG, GAME_MODES } from '../config/defaults';
import { buildBatchComparison } from '../narration/announcer';
import {
  deleteSession,
  loadLeaderboard,
  loadSessions,
  pushLeaderboard,
  saveSession,
} from '../persistence/localStorage';
import { buildEngine } from '../simulation/engine';
import type {
  BatchRunResult,
  CameraMode,
  Chapter,
  EndGameSummary,
  GameConfig,
  LeaderboardEntry,
  NarrationEntry,
  ReplayFrame,
  SavedSession,
  SimulationPhase,
  ViewMode,
} from '../simulation/types';

type SimulationState = {
  engine: ReturnType<typeof buildEngine>['engine'];
  snapshot: ReturnType<typeof buildEngine>['snapshot'];
  config: GameConfig;
  phase: SimulationPhase;
  running: boolean;
  speed: number;
  viewMode: ViewMode;
  cameraMode: CameraMode;
  zoom: number;
  replayFrames: ReplayFrame[];
  chapters: Chapter[];
  narrations: NarrationEntry[];
  summary: EndGameSummary | null;
  batchResults: BatchRunResult[];
  batchComparison: string;
  replayIndex: number;
  replayPlaying: boolean;
  savedSessions: SavedSession[];
  leaderboard: LeaderboardEntry[];
  showSummary: boolean;
  step: (dt: number) => void;
  toggleRunning: () => void;
  setSpeed: (speed: number) => void;
  setConfig: (partial: Partial<GameConfig>) => void;
  setViewMode: (mode: ViewMode) => void;
  setCameraMode: (mode: CameraMode) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  startRun: () => void;
  endRun: () => void;
  skipToEnd: () => void;
  enterReview: () => void;
  setReplayIndex: (index: number) => void;
  jumpToChapter: (chapterId: string) => void;
  toggleReplayPlaying: () => void;
  stepReplay: (dt: number) => void;
  dismissSummary: () => void;
  saveCurrentSession: (name: string) => void;
  loadSession: (id: string) => void;
  removeSession: (id: string) => void;
  saveToLeaderboard: () => void;
};

function applyModeDefaults(config: GameConfig): GameConfig {
  const mode = GAME_MODES[config.mode];
  return {
    ...config,
    durationSec: mode.defaultDurationSec,
    maxEncounters: mode.defaultMaxEncounters,
  };
}

function createLeaderboardEntry(summary: EndGameSummary): LeaderboardEntry {
  return {
    id: `lb-${Date.now()}`,
    savedAt: new Date().toISOString(),
    mode: summary.config.mode,
    economy: summary.config.economy,
    winner: summary.winner,
    topScore: summary.standings[0]?.score ?? 0,
    totalEncounters: summary.totalEncounters,
    elapsed: summary.elapsed,
    hypothesis: summary.hypothesis,
  };
}

const initialConfig = DEFAULT_GAME_CONFIG;
const initial = buildEngine(initialConfig);

export const useSimulationStore = create<SimulationState>((set, get) => ({
  engine: initial.engine,
  snapshot: initial.snapshot,
  config: initialConfig,
  phase: 'setup',
  running: false,
  speed: 1,
  viewMode: 'live',
  cameraMode: 'auto',
  zoom: 1,
  replayFrames: initial.engine.getReplayFrames(),
  chapters: initial.engine.getChapters(),
  narrations: initial.engine.getNarrations(),
  summary: null,
  batchResults: [],
  batchComparison: '',
  replayIndex: 0,
  replayPlaying: false,
  savedSessions: loadSessions(),
  leaderboard: loadLeaderboard(),
  showSummary: false,

  step: (dt) =>
    set((state) => {
      if (state.phase !== 'running' || !state.running || state.viewMode !== 'live') {
        return state;
      }
      const snapshot = state.engine.step(dt * state.speed);
      if (snapshot.finished) {
        const summary = state.engine.buildSummary();
        return {
          snapshot,
          phase: 'ended',
          running: false,
          summary,
          showSummary: true,
          replayFrames: state.engine.getReplayFrames(),
          chapters: state.engine.getChapters(),
          narrations: state.engine.getNarrations(),
        };
      }
      return {
        snapshot,
        replayFrames: state.engine.getReplayFrames(),
        chapters: state.engine.getChapters(),
        narrations: state.engine.getNarrations(),
      };
    }),

  toggleRunning: () => {
    const state = get();
    if (state.phase === 'ended' || state.phase === 'reviewing') return;
    set({ running: !state.running });
  },

  setSpeed: (speed) => set({ speed }),

  setConfig: (partial) =>
    set((state) => {
      const next = { ...state.config, ...partial };
      const withMode = partial.mode ? applyModeDefaults(next) : next;
      return { config: withMode };
    }),

  setViewMode: (mode) => {
    const state = get();
    if (mode === 'summary') {
      set({ viewMode: mode, showSummary: true, running: false });
      return;
    }
    if (mode === 'highlights' || mode === 'chapters') {
      const highlights = state.chapters.filter((chapter) => chapter.highlight);
      const target = highlights[0] ?? state.chapters[0];
      set({
        viewMode: mode,
        phase: 'reviewing',
        running: false,
        replayIndex: target?.replayFrameIndex ?? state.replayIndex,
        replayPlaying: false,
      });
      return;
    }
    set({ viewMode: mode, phase: state.phase === 'reviewing' ? 'ended' : state.phase });
  },

  setCameraMode: (mode) => set({ cameraMode: mode }),

  setZoom: (zoom) => set({ zoom: Math.max(0.4, Math.min(2.5, zoom)) }),

  zoomIn: () => set((state) => ({ zoom: Math.min(2.5, state.zoom + 0.15) })),

  zoomOut: () => set((state) => ({ zoom: Math.max(0.4, state.zoom - 0.15) })),

  startRun: () => {
    const state = get();
    const batchCount = Math.max(1, Math.min(5, state.config.batchCount));

    if (batchCount === 1) {
      const built = buildEngine(state.config);
      set({
        engine: built.engine,
        snapshot: built.snapshot,
        phase: 'running',
        running: true,
        viewMode: 'live',
        replayIndex: 0,
        replayPlaying: false,
        summary: null,
        showSummary: false,
        batchResults: [],
        batchComparison: '',
        replayFrames: built.engine.getReplayFrames(),
        chapters: built.engine.getChapters(),
        narrations: built.engine.getNarrations(),
      });
      return;
    }

    const batchResults: BatchRunResult[] = [];
    let lastBuilt = buildEngine(state.config);

    for (let index = 0; index < batchCount; index += 1) {
      const runConfig = { ...state.config, seed: state.config.seed + index };
      const built = buildEngine(runConfig);
      built.engine.fastForwardToEnd();
      const summary = built.engine.buildSummary();
      batchResults.push({
        runIndex: index + 1,
        seed: runConfig.seed,
        winner: summary.winner,
        standings: summary.standings,
        totalEncounters: summary.totalEncounters,
        elapsed: summary.elapsed,
      });
      lastBuilt = built;
    }

    const lastSummary = lastBuilt.engine.buildSummary();
    set({
      engine: lastBuilt.engine,
      snapshot: lastBuilt.engine.snapshot(),
      phase: 'ended',
      running: false,
      viewMode: 'summary',
      summary: lastSummary,
      showSummary: true,
      batchResults,
      batchComparison: buildBatchComparison(batchResults),
      replayFrames: lastBuilt.engine.getReplayFrames(),
      chapters: lastBuilt.engine.getChapters(),
      narrations: lastBuilt.engine.getNarrations(),
      replayIndex: lastBuilt.engine.getReplayFrames().length - 1,
    });
  },

  endRun: () => {
    const state = get();
    const summary = state.engine.buildSummary();
    set({
      phase: 'ended',
      running: false,
      summary,
      showSummary: true,
      snapshot: state.engine.snapshot(),
      replayFrames: state.engine.getReplayFrames(),
      chapters: state.engine.getChapters(),
      narrations: state.engine.getNarrations(),
    });
  },

  skipToEnd: () => {
    const state = get();
    state.engine.fastForwardToEnd();
    const summary = state.engine.buildSummary();
    set({
      phase: 'ended',
      running: false,
      summary,
      showSummary: true,
      snapshot: state.engine.snapshot(),
      replayFrames: state.engine.getReplayFrames(),
      chapters: state.engine.getChapters(),
      narrations: state.engine.getNarrations(),
      replayIndex: state.engine.getReplayFrames().length - 1,
    });
  },

  enterReview: () =>
    set({
      phase: 'reviewing',
      running: false,
      viewMode: 'chapters',
      replayPlaying: false,
    }),

  setReplayIndex: (index) =>
    set((state) => ({
      replayIndex: Math.max(0, Math.min(state.replayFrames.length - 1, index)),
      replayPlaying: false,
    })),

  jumpToChapter: (chapterId) => {
    const state = get();
    const chapter = state.chapters.find((item) => item.id === chapterId);
    if (!chapter) return;
    set({
      phase: 'reviewing',
      running: false,
      viewMode: 'chapters',
      replayIndex: chapter.replayFrameIndex,
      replayPlaying: false,
    });
  },

  toggleReplayPlaying: () => set((state) => ({ replayPlaying: !state.replayPlaying })),

  stepReplay: (dt) =>
    set((state) => {
      if (!state.replayPlaying || state.replayFrames.length === 0) return state;
      const advance = Math.max(1, Math.floor(dt * 12));
      const next = Math.min(state.replayFrames.length - 1, state.replayIndex + advance);
      if (next === state.replayIndex) {
        return { replayPlaying: false };
      }
      return { replayIndex: next };
    }),

  dismissSummary: () => set({ showSummary: false }),

  saveCurrentSession: (name) => {
    const state = get();
    if (!state.summary) return;
    const session: SavedSession = {
      version: 1,
      id: `sess-${Date.now()}`,
      name: name.trim() || `Run ${new Date().toLocaleString()}`,
      savedAt: new Date().toISOString(),
      config: state.config,
      summary: state.summary,
      replayFrames: state.replayFrames,
      chapters: state.chapters,
      narrations: state.narrations,
    };
    const savedSessions = saveSession(session);
    set({ savedSessions });
  },

  loadSession: (id) => {
    const session = get().savedSessions.find((item) => item.id === id);
    if (!session) return;
    const built = buildEngine(session.config);
    set({
      engine: built.engine,
      config: session.config,
      snapshot: built.engine.snapshot(),
      phase: 'reviewing',
      running: false,
      viewMode: 'chapters',
      summary: session.summary,
      replayFrames: session.replayFrames,
      chapters: session.chapters,
      narrations: session.narrations,
      replayIndex: 0,
      replayPlaying: false,
      showSummary: false,
      batchResults: [],
      batchComparison: '',
    });
  },

  removeSession: (id) => {
    const savedSessions = deleteSession(id);
    set({ savedSessions });
  },

  saveToLeaderboard: () => {
    const state = get();
    if (!state.summary) return;
    const leaderboard = pushLeaderboard(createLeaderboardEntry(state.summary));
    set({ leaderboard });
  },
}));

export function getActiveReplayFrame(state: SimulationState) {
  if (state.phase === 'reviewing' || state.viewMode === 'chapters' || state.viewMode === 'highlights') {
    return state.replayFrames[state.replayIndex] ?? null;
  }
  return null;
}
