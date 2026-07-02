import {
  buildAnalysis,
  narrateEncounter,
  narrateGameEnd,
  narrateGameStart,
  narrateHighlight,
} from '../narration/announcer';
import { ECONOMIES } from '../config/defaults';
import { pickAction, scoreRound, STRATEGY_COLORS } from './strategies';
import type {
  Action,
  AgentMode,
  AgentSnapshot,
  Chapter,
  EncounterSnapshot,
  EndGameSummary,
  EventEntry,
  GameConfig,
  NarrationEntry,
  ReplayFrame,
  SimulationSnapshot,
} from './types';

const VIEWPORT_WIDTH = 980;
const VIEWPORT_HEIGHT = 720;
const ENCOUNTER_DISTANCE = 82;
const ROAM_SPEED = 72;
const INTERACTION_SECONDS = 0.42;
const BUBBLE_SECONDS = 0.72;
const COOLDOWN_SECONDS = 0.24;
const SEPARATION_DISTANCE = 54;
const PATH_MARGIN = 110;
const FRAME_INTERVAL = 0.35;

type AgentState = AgentSnapshot & {
  speed: number;
  cooldown: number;
  encounterId: string | null;
  historySelf: Map<string, Action[]>;
  historyOther: Map<string, Action[]>;
};

type EncounterState = EncounterSnapshot & {
  pointsA: number;
  pointsB: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function facingFromVelocity(vx: number, vy: number): AgentSnapshot['facing'] {
  if (Math.abs(vx) > Math.abs(vy)) {
    return vx >= 0 ? 'right' : 'left';
  }
  return vy >= 0 ? 'down' : 'up';
}

function isHighlight(pointsA: number, pointsB: number, actionA: Action, actionB: Action): boolean {
  return Math.abs(pointsA - pointsB) >= 4 || (actionA === 'C' && actionB === 'C') || (actionA === 'D' && actionB === 'D');
}

export class BrowserSimulation {
  private readonly random: () => number;
  private readonly agents: AgentState[];
  private readonly config: GameConfig;
  private readonly worldWidth: number;
  private readonly worldHeight: number;
  private readonly events: EventEntry[] = [];
  private readonly encounters = new Map<string, EncounterState>();
  private readonly replayFrames: ReplayFrame[] = [];
  private readonly chapters: Chapter[] = [];
  private readonly narrations: NarrationEntry[] = [];
  private elapsed = 0;
  private eventId = 0;
  private encounterId = 0;
  private encounterCount = 0;
  private narrationId = 0;
  private frameTimer = 0;
  private finished = false;
  private finishReason: SimulationSnapshot['finishReason'] = null;

  constructor(config: GameConfig) {
    this.config = config;
    this.random = mulberry32(config.seed);
    const isIndoor = config.assetTheme !== 'outdoor_meadow';
    this.worldWidth = isIndoor ? 1600 : 2200;
    this.worldHeight = isIndoor ? 1000 : 1400;

    this.agents = config.strategies.map((name, index) => {
      const angle = (Math.PI * 2 * index) / config.strategies.length;
      const centerX = this.worldWidth / 2 + Math.cos(angle) * (isIndoor ? 220 : 290);
      const centerY = this.worldHeight / 2 + Math.sin(angle) * (isIndoor ? 160 : 210);
      const target = this.makeTarget();
      return {
        id: `agent-${index}`,
        name,
        color: STRATEGY_COLORS[name],
        x: centerX,
        y: centerY,
        targetX: target.x,
        targetY: target.y,
        vx: 0,
        vy: 0,
        mode: 'roaming' as AgentMode,
        facing: 'down' as const,
        score: 0,
        lastAction: null,
        lastPoints: 0,
        bubbleTimer: 0,
        speed: ROAM_SPEED + this.random() * 20,
        cooldown: this.random() * 0.4,
        encounterId: null,
        historySelf: new Map(),
        historyOther: new Map(),
      };
    });

    this.pushNarration(narrateGameStart(config), 0, 'highlight');
    this.recordFrame();
  }

  getConfig() {
    return this.config;
  }

  getWorldSize() {
    return {
      width: this.worldWidth,
      height: this.worldHeight,
      viewportWidth: VIEWPORT_WIDTH,
      viewportHeight: VIEWPORT_HEIGHT,
    };
  }

  getReplayFrames() {
    return this.replayFrames;
  }

  getChapters() {
    return this.chapters;
  }

  getNarrations() {
    return this.narrations;
  }

  getAllEvents() {
    return this.events;
  }

  isFinished() {
    return this.finished;
  }

  step(dt: number) {
    if (this.finished) {
      return this.snapshot();
    }

    const scaledDt = dt;
    this.elapsed += scaledDt;
    this.frameTimer += scaledDt;
    this.updateEncounters(scaledDt);
    this.updateAgents(scaledDt);
    this.seekEncounters();

    if (this.frameTimer >= FRAME_INTERVAL) {
      this.frameTimer = 0;
      this.recordFrame();
    }

    this.checkFinish();
    return this.snapshot();
  }

  fastForwardToEnd() {
    let guard = 0;
    while (!this.finished && guard < 20000) {
      this.step(0.05);
      guard += 1;
    }
    this.recordFrame();
    return this.snapshot();
  }

  buildSummary(): EndGameSummary {
    const standings = this.snapshot().standings;
    const highlights = this.events.filter((event) => event.highlight);
    const winner = standings[0]?.score > (standings[1]?.score ?? -1) ? standings[0].name : null;
    const analysis = buildAnalysis(this.config, standings, highlights);

    if (!this.finished) {
      this.finished = true;
      this.finishReason = 'manual';
      this.pushNarration(narrateGameEnd(winner, this.encounterCount, this.elapsed), this.elapsed, 'highlight');
      this.recordFrame();
    }

    return {
      config: this.config,
      winner,
      standings,
      totalEncounters: this.encounterCount,
      elapsed: this.elapsed,
      highlights,
      hypothesis: this.config.hypothesis,
      analysis,
      chapters: this.chapters,
    };
  }

  snapshot(): SimulationSnapshot {
    return {
      elapsed: this.elapsed,
      agents: this.agents.map(({ speed, cooldown, encounterId, historySelf, historyOther, ...agent }) => agent),
      standings: [...this.agents]
        .sort((a, b) => b.score - a.score)
        .map((agent) => ({ name: agent.name, score: agent.score, color: agent.color })),
      events: this.events.slice(0, 50),
      activeEncounters: [...this.encounters.values()].map(({ pointsA, pointsB, ...encounter }) => encounter),
      encounterCount: this.encounterCount,
      finished: this.finished,
      finishReason: this.finishReason,
    };
  }

  private getPayoffs() {
    return ECONOMIES[this.config.economy].payoffs;
  }

  private makeTarget() {
    return {
      x: PATH_MARGIN + this.random() * (this.worldWidth - PATH_MARGIN * 2),
      y: PATH_MARGIN + this.random() * (this.worldHeight - PATH_MARGIN * 2),
    };
  }

  private recordFrame() {
    const snap = this.snapshot();
    this.replayFrames.push({
      elapsed: snap.elapsed,
      agents: snap.agents.map((agent) => ({ ...agent })),
      activeEncounters: snap.activeEncounters.map((encounter) => ({ ...encounter })),
    });
  }

  private pushNarration(text: string, timestamp: number, priority: NarrationEntry['priority'] = 'normal') {
    this.narrations.unshift({
      id: `nar-${this.narrationId++}`,
      text,
      timestamp,
      priority,
    });
    this.narrations.splice(40);
  }

  private checkFinish() {
    if (this.finished) return;

    const timeUp =
      (this.config.mode === 'timed_match' || this.config.mode === 'classic_roam') &&
      this.elapsed >= this.config.durationSec;
    const encountersUp = this.encounterCount >= this.config.maxEncounters;

    if (timeUp || encountersUp) {
      this.finished = true;
      this.finishReason = encountersUp && this.config.mode === 'encounter_sprint' ? 'encounters' : 'time';
      const winner = this.snapshot().standings[0]?.name ?? null;
      this.pushNarration(narrateGameEnd(winner, this.encounterCount, this.elapsed), this.elapsed, 'highlight');
      this.recordFrame();
    }
  }

  private updateEncounters(dt: number) {
    for (const [id, encounter] of [...this.encounters.entries()]) {
      encounter.timer -= dt;
      const agentA = this.agentById(encounter.agentA);
      const agentB = this.agentById(encounter.agentB);
      if (!agentA || !agentB) continue;

      if (encounter.timer <= 0) {
        this.endEncounter(id, agentA, agentB);
      }
    }
  }

  private updateAgents(dt: number) {
    for (const agent of this.agents) {
      agent.bubbleTimer = Math.max(0, agent.bubbleTimer - dt);
      if (agent.bubbleTimer === 0) {
        agent.lastAction = null;
        agent.lastPoints = 0;
      }

      if (agent.cooldown > 0) {
        agent.cooldown = Math.max(0, agent.cooldown - dt);
        if (agent.cooldown === 0 && agent.mode === 'cooldown') {
          agent.mode = 'roaming';
        }
      }

      if (agent.mode !== 'roaming') {
        agent.vx *= 0.8;
        agent.vy *= 0.8;
        continue;
      }

      const dx = agent.targetX - agent.x;
      const dy = agent.targetY - agent.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 24) {
        const target = this.makeTarget();
        agent.targetX = target.x;
        agent.targetY = target.y;
      }

      const directionX = distance > 0 ? dx / Math.max(distance, 1) : 0;
      const directionY = distance > 0 ? dy / Math.max(distance, 1) : 0;
      const repel = this.computeRepel(agent);
      agent.vx = (directionX + repel.x * 1.35) * agent.speed;
      agent.vy = (directionY + repel.y * 1.35) * agent.speed;

      agent.x = clamp(agent.x + agent.vx * dt, PATH_MARGIN, this.worldWidth - PATH_MARGIN);
      agent.y = clamp(agent.y + agent.vy * dt, PATH_MARGIN, this.worldHeight - PATH_MARGIN);
      agent.facing = facingFromVelocity(agent.vx, agent.vy);
    }
  }

  private computeRepel(agent: AgentState) {
    let x = 0;
    let y = 0;
    for (const other of this.agents) {
      if (other.id === agent.id) continue;
      const dx = agent.x - other.x;
      const dy = agent.y - other.y;
      const distance = Math.hypot(dx, dy);
      if (distance === 0 || distance > SEPARATION_DISTANCE) continue;
      const force = (SEPARATION_DISTANCE - distance) / SEPARATION_DISTANCE;
      x += (dx / distance) * force;
      y += (dy / distance) * force;
    }
    return { x, y };
  }

  private seekEncounters() {
    for (let index = 0; index < this.agents.length; index += 1) {
      const agentA = this.agents[index];
      if (agentA.mode !== 'roaming' || agentA.cooldown > 0) continue;
      for (let offset = index + 1; offset < this.agents.length; offset += 1) {
        const agentB = this.agents[offset];
        if (agentB.mode !== 'roaming' || agentB.cooldown > 0) continue;
        const distance = Math.hypot(agentA.x - agentB.x, agentA.y - agentB.y);
        if (distance > ENCOUNTER_DISTANCE) continue;
        this.startEncounter(agentA, agentB);
      }
    }
  }

  private startEncounter(agentA: AgentState, agentB: AgentState) {
    if (agentA.encounterId || agentB.encounterId) return;
    const payoffs = this.getPayoffs();
    const selfHistoryA = agentA.historySelf.get(agentB.id) ?? [];
    const otherHistoryA = agentA.historyOther.get(agentB.id) ?? [];
    const selfHistoryB = agentB.historySelf.get(agentA.id) ?? [];
    const otherHistoryB = agentB.historyOther.get(agentA.id) ?? [];

    const actionA = pickAction(agentA.name, otherHistoryA, selfHistoryA, this.random, payoffs);
    const actionB = pickAction(agentB.name, otherHistoryB, selfHistoryB, this.random, payoffs);
    selfHistoryA.push(actionA);
    otherHistoryA.push(actionB);
    selfHistoryB.push(actionB);
    otherHistoryB.push(actionA);
    agentA.historySelf.set(agentB.id, selfHistoryA);
    agentA.historyOther.set(agentB.id, otherHistoryA);
    agentB.historySelf.set(agentA.id, selfHistoryB);
    agentB.historyOther.set(agentA.id, otherHistoryB);

    const [pointsA, pointsB] = scoreRound(actionA, actionB, payoffs);
    agentA.score += pointsA;
    agentB.score += pointsB;
    agentA.lastAction = actionA;
    agentB.lastAction = actionB;
    agentA.lastPoints = pointsA;
    agentB.lastPoints = pointsB;
    agentA.bubbleTimer = BUBBLE_SECONDS;
    agentB.bubbleTimer = BUBBLE_SECONDS;

    const id = `enc-${this.encounterId++}`;
    agentA.encounterId = id;
    agentB.encounterId = id;
    agentA.mode = 'interacting';
    agentB.mode = 'interacting';
    agentA.vx = 0;
    agentA.vy = 0;
    agentB.vx = 0;
    agentB.vy = 0;
    agentA.facing = agentA.x < agentB.x ? 'right' : 'left';
    agentB.facing = agentB.x < agentA.x ? 'right' : 'left';

    this.encounters.set(id, {
      id,
      agentA: agentA.id,
      agentB: agentB.id,
      actionA,
      actionB,
      timer: INTERACTION_SECONDS,
      pointsA,
      pointsB,
    });

    this.encounterCount += 1;
    const highlight = isHighlight(pointsA, pointsB, actionA, actionB);
    const text = `${agentA.name} ${actionA} (${pointsA}) vs ${agentB.name} ${actionB} (${pointsB})`;
    const event: EventEntry = {
      id: `evt-${this.eventId++}`,
      text,
      timestamp: this.elapsed,
      encounterIndex: this.encounterCount,
      agentA: agentA.name,
      agentB: agentB.name,
      actionA,
      actionB,
      pointsA,
      pointsB,
      highlight,
    };
    this.events.unshift(event);

    const narration = narrateEncounter(agentA.name, agentB.name, actionA, actionB, pointsA, pointsB);
    this.pushNarration(narration, this.elapsed, highlight ? 'highlight' : 'normal');
    if (highlight) {
      this.pushNarration(narrateHighlight(event), this.elapsed, 'highlight');
    }

    const frameIndex = this.replayFrames.length;
    this.recordFrame();
    this.chapters.unshift({
      id: `ch-${this.encounterCount}`,
      index: this.encounterCount,
      title: `Encounter ${this.encounterCount}`,
      timestamp: this.elapsed,
      encounterId: id,
      highlight,
      summary: text,
      replayFrameIndex: frameIndex,
    });
  }

  private endEncounter(id: string, agentA: AgentState, agentB: AgentState) {
    this.encounters.delete(id);
    agentA.encounterId = null;
    agentB.encounterId = null;
    agentA.mode = 'cooldown';
    agentB.mode = 'cooldown';
    agentA.cooldown = COOLDOWN_SECONDS;
    agentB.cooldown = COOLDOWN_SECONDS;
    const targetA = this.makeTarget();
    const targetB = this.makeTarget();
    agentA.targetX = targetA.x;
    agentA.targetY = targetA.y;
    agentB.targetX = targetB.x;
    agentB.targetY = targetB.y;
  }

  private agentById(id: string) {
    return this.agents.find((agent) => agent.id === id);
  }
}

export function buildEngine(config: GameConfig) {
  const engine = new BrowserSimulation(config);
  return { engine, snapshot: engine.snapshot() };
}
