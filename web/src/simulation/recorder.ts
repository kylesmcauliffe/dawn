import type { ReplayFrame, ReplayRecording, StrategyKey } from './types';

const REPLAY_VERSION = 1 as const;
const FRAME_INTERVAL = 0.05;

export class SimulationRecorder {
  private frames: ReplayFrame[] = [];
  private nextCaptureAt = 0;
  private active = false;

  start() {
    this.frames = [];
    this.nextCaptureAt = 0;
    this.active = true;
  }

  stop() {
    this.active = false;
  }

  isActive() {
    return this.active;
  }

  capture(elapsed: number, frame: ReplayFrame, force = false) {
    if (!this.active) return;
    if (!force && elapsed < this.nextCaptureAt) return;
    this.frames.push(frame);
    this.nextCaptureAt = elapsed + FRAME_INTERVAL;
  }

  finalize(seed: number, strategies: StrategyKey[]): ReplayRecording {
    return {
      version: REPLAY_VERSION,
      seed,
      strategies,
      recordedAt: new Date().toISOString(),
      frames: this.frames,
    };
  }

  frameCount() {
    return this.frames.length;
  }
}

export function downloadRecording(recording: ReplayRecording, filename = 'dawn-replay.json') {
  const blob = new Blob([JSON.stringify(recording, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseRecording(raw: string): ReplayRecording {
  const parsed = JSON.parse(raw) as ReplayRecording;
  if (parsed.version !== REPLAY_VERSION || !Array.isArray(parsed.frames) || parsed.frames.length === 0) {
    throw new Error('Unsupported or empty replay file.');
  }
  return parsed;
}

export function interpolateFrames(frames: ReplayFrame[], elapsed: number): ReplayFrame {
  if (frames.length === 0) {
    throw new Error('Cannot interpolate an empty replay.');
  }

  const first = frames[0];
  if (elapsed <= first.elapsed) {
    return first;
  }

  const last = frames.at(-1)!;
  if (elapsed >= last.elapsed) {
    return last;
  }

  let left = 0;
  let right = frames.length - 1;
  while (left < right - 1) {
    const mid = Math.floor((left + right) / 2);
    if (frames[mid].elapsed <= elapsed) {
      left = mid;
    } else {
      right = mid;
    }
  }

  const from = frames[left];
  const to = frames[right];
  const span = to.elapsed - from.elapsed;
  const alpha = span > 0 ? (elapsed - from.elapsed) / span : 0;

  return {
    elapsed,
    events: to.events,
    agents: from.agents.map((agent, index) => {
      const next = to.agents[index];
      if (!next) return agent;
      return {
        ...next,
        x: agent.x + (next.x - agent.x) * alpha,
        y: agent.y + (next.y - agent.y) * alpha,
        vx: agent.vx + (next.vx - agent.vx) * alpha,
        vy: agent.vy + (next.vy - agent.vy) * alpha,
        score: next.score,
        bubbleTimer: next.bubbleTimer,
        lastAction: next.lastAction,
        lastPoints: next.lastPoints,
        mode: next.mode,
        facing: next.facing,
      };
    }),
  };
}
