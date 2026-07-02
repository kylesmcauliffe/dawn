import type {
  AiModelId,
  AssetThemeId,
  EconomyId,
  GameConfig,
  GameModeId,
  PayoffMatrix,
} from '../simulation/types';
import { STRATEGY_ORDER } from '../simulation/strategies';

export const GAME_MODES: Record<
  GameModeId,
  { label: string; description: string; defaultDurationSec: number; defaultMaxEncounters: number }
> = {
  classic_roam: {
    label: 'Classic Roam',
    description: 'Open-ended roaming until you stop or hit the encounter cap.',
    defaultDurationSec: 90,
    defaultMaxEncounters: 80,
  },
  timed_match: {
    label: 'Timed Match',
    description: 'Run for a fixed duration, then freeze and summarize.',
    defaultDurationSec: 60,
    defaultMaxEncounters: 999,
  },
  encounter_sprint: {
    label: 'Encounter Sprint',
    description: 'End as soon as the encounter quota is reached.',
    defaultDurationSec: 300,
    defaultMaxEncounters: 40,
  },
};

export const ECONOMIES: Record<EconomyId, { label: string; description: string; payoffs: PayoffMatrix }> = {
  classic_pd: {
    label: 'Classic PD',
    description: 'Standard prisoner’s dilemma payoffs (3/5/1).',
    payoffs: { mutualCoop: 3, exploited: 0, exploit: 5, mutualDefect: 1 },
  },
  harsh_defection: {
    label: 'Harsh Defection',
    description: 'Defection pays more; mutual cooperation is weaker.',
    payoffs: { mutualCoop: 2, exploited: 0, exploit: 7, mutualDefect: 1 },
  },
  cooperation_bonus: {
    label: 'Cooperation Bonus',
    description: 'Mutual cooperation is richly rewarded.',
    payoffs: { mutualCoop: 5, exploited: 1, exploit: 4, mutualDefect: 0 },
  },
};

export const ASSET_THEMES: Record<AssetThemeId, { label: string; description: string }> = {
  outdoor_meadow: {
    label: 'Outdoor Meadow',
    description: 'Open paths, trees, and grass — the original Dawn look.',
  },
  research_lab: {
    label: 'Research Lab',
    description: 'Indoor observation room with desks, monitors, and tile floor.',
  },
  pixel_arcade: {
    label: 'Pixel Arcade',
    description: 'Retro game lounge with neon trim and chunky pixel furniture.',
  },
};

export const AI_MODELS: Record<AiModelId, { label: string; description: string; available: boolean }> = {
  rule_based: {
    label: 'Rule-based (built-in)',
    description: 'Classic strategy agents — Tit-for-Tat, Grudger, Pavlov, and more.',
    available: true,
  },
  gpt4o: {
    label: 'GPT-4o (coming soon)',
    description: 'Placeholder for LLM-driven agents via AI Gateway.',
    available: false,
  },
  claude: {
    label: 'Claude (coming soon)',
    description: 'Placeholder for Anthropic model agents.',
    available: false,
  },
  gemini: {
    label: 'Gemini (coming soon)',
    description: 'Placeholder for Google model agents.',
    available: false,
  },
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
  mode: 'timed_match',
  economy: 'classic_pd',
  assetTheme: 'research_lab',
  aiModel: 'rule_based',
  strategies: [...STRATEGY_ORDER],
  seed: 7,
  durationSec: GAME_MODES.timed_match.defaultDurationSec,
  maxEncounters: GAME_MODES.timed_match.defaultMaxEncounters,
  hypothesis: '',
  batchCount: 1,
};
