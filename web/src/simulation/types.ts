export type StrategyKey =
  | 'TitForTat'
  | 'AlwaysDefect'
  | 'AlwaysCooperate'
  | 'Grudger'
  | 'Pavlov'
  | 'GenerousTitForTat'
  | 'Random';

export type Action = 'C' | 'D';
export type AgentMode = 'roaming' | 'interacting' | 'cooldown';

export type GameModeId = 'classic_roam' | 'timed_match' | 'encounter_sprint';
export type EconomyId = 'classic_pd' | 'harsh_defection' | 'cooperation_bonus';
export type AssetThemeId = 'outdoor_meadow' | 'research_lab' | 'pixel_arcade';
export type AiModelId = 'rule_based' | 'gpt4o' | 'claude' | 'gemini';

export type SimulationPhase = 'setup' | 'running' | 'ended' | 'reviewing';
export type ViewMode = 'live' | 'highlights' | 'chapters' | 'summary';
export type CameraMode = 'auto' | 'free' | 'overview';

export interface PayoffMatrix {
  mutualCoop: number;
  exploited: number;
  exploit: number;
  mutualDefect: number;
}

export interface GameConfig {
  mode: GameModeId;
  economy: EconomyId;
  assetTheme: AssetThemeId;
  aiModel: AiModelId;
  strategies: StrategyKey[];
  seed: number;
  durationSec: number;
  maxEncounters: number;
  hypothesis: string;
  batchCount: number;
}

export interface AgentSnapshot {
  id: string;
  name: StrategyKey;
  color: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  mode: AgentMode;
  facing: 'up' | 'down' | 'left' | 'right';
  score: number;
  lastAction: Action | null;
  lastPoints: number;
  bubbleTimer: number;
}

export interface EventEntry {
  id: string;
  text: string;
  timestamp: number;
  encounterIndex: number;
  agentA: StrategyKey;
  agentB: StrategyKey;
  actionA: Action;
  actionB: Action;
  pointsA: number;
  pointsB: number;
  highlight: boolean;
}

export interface EncounterSnapshot {
  id: string;
  agentA: string;
  agentB: string;
  actionA: Action;
  actionB: Action;
  timer: number;
}

export interface Chapter {
  id: string;
  index: number;
  title: string;
  timestamp: number;
  encounterId: string;
  highlight: boolean;
  summary: string;
  replayFrameIndex: number;
}

export interface ReplayFrame {
  elapsed: number;
  agents: AgentSnapshot[];
  activeEncounters: EncounterSnapshot[];
}

export interface NarrationEntry {
  id: string;
  text: string;
  timestamp: number;
  priority: 'low' | 'normal' | 'highlight';
}

export interface SimulationSnapshot {
  elapsed: number;
  agents: AgentSnapshot[];
  standings: Array<{ name: StrategyKey; score: number; color: string }>;
  events: EventEntry[];
  activeEncounters: EncounterSnapshot[];
  encounterCount: number;
  finished: boolean;
  finishReason: 'time' | 'encounters' | 'manual' | null;
}

export interface EndGameSummary {
  config: GameConfig;
  winner: StrategyKey | null;
  standings: Array<{ name: StrategyKey; score: number; color: string }>;
  totalEncounters: number;
  elapsed: number;
  highlights: EventEntry[];
  hypothesis: string;
  analysis: string;
  chapters: Chapter[];
}

export interface LeaderboardEntry {
  id: string;
  savedAt: string;
  mode: GameModeId;
  economy: EconomyId;
  winner: StrategyKey | null;
  topScore: number;
  totalEncounters: number;
  elapsed: number;
  hypothesis: string;
}

export interface SavedSession {
  version: 1;
  id: string;
  name: string;
  savedAt: string;
  config: GameConfig;
  summary: EndGameSummary;
  replayFrames: ReplayFrame[];
  chapters: Chapter[];
  narrations: NarrationEntry[];
}

export interface BatchRunResult {
  runIndex: number;
  seed: number;
  winner: StrategyKey | null;
  standings: Array<{ name: StrategyKey; score: number; color: string }>;
  totalEncounters: number;
  elapsed: number;
}
