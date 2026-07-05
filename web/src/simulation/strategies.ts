import type { Action, StrategyKey } from './types';

export const STRATEGY_ORDER: StrategyKey[] = [
  'TitForTat',
  'Grudger',
  'Pavlov',
  'AlwaysDefect',
  'AlwaysCooperate',
  'GenerousTitForTat',
  'Random',
];

export const STRATEGY_COLORS: Record<StrategyKey, string> = {
  TitForTat: '#72A8F8',
  Grudger: '#B877F4',
  Pavlov: '#F0B75E',
  AlwaysDefect: '#EF7C72',
  AlwaysCooperate: '#78D391',
  GenerousTitForTat: '#7AD5D0',
  Random: '#C8CDD7',
};

export const STRATEGY_INFO: Record<
  StrategyKey,
  { nickname: string; tagline: string; description: string; type: string }
> = {
  TitForTat: {
    nickname: 'TFT',
    tagline: 'Mirror, then trust.',
    type: 'Balanced',
    description: 'Starts friendly. Copies whatever the opponent did last round.',
  },
  Grudger: {
    nickname: 'GRUDGE',
    tagline: 'Forgive never.',
    type: 'Punisher',
    description: 'Cooperates until betrayed once — then defects forever.',
  },
  Pavlov: {
    nickname: 'PAVLOV',
    tagline: 'Win, repeat. Lose, switch.',
    type: 'Adaptive',
    description: 'Repeats a move if it paid off well; otherwise flips strategy.',
  },
  AlwaysDefect: {
    nickname: 'HAWK',
    tagline: 'Take the points.',
    type: 'Aggressive',
    description: 'Always defects. Maximizes short-term gain against cooperators.',
  },
  AlwaysCooperate: {
    nickname: 'DOVE',
    tagline: 'Peace everywhere.',
    type: 'Friendly',
    description: 'Always cooperates. Thrives in mutual-trust environments.',
  },
  GenerousTitForTat: {
    nickname: 'GTFT',
    tagline: 'Mostly mirror, sometimes forgive.',
    type: 'Forgiving',
    description: 'Like Tit-for-Tat, but occasionally forgives a defection.',
  },
  Random: {
    nickname: 'WILD',
    tagline: 'Chaos agent.',
    type: 'Chaotic',
    description: 'Flips a coin each round. Unpredictable baseline.',
  },
};

export function pickAction(
  strategy: StrategyKey,
  opponentHistory: Action[],
  selfHistory: Action[],
  random: () => number,
): Action {
  switch (strategy) {
    case 'AlwaysCooperate':
      return 'C';
    case 'AlwaysDefect':
      return 'D';
    case 'TitForTat':
      return opponentHistory.at(-1) ?? 'C';
    case 'Grudger':
      return opponentHistory.includes('D') ? 'D' : 'C';
    case 'Pavlov': {
      if (selfHistory.length === 0 || opponentHistory.length === 0) {
        return 'C';
      }
      const mine = selfHistory.at(-1)!;
      const theirs = opponentHistory.at(-1)!;
      const payoff = scoreRound(mine, theirs)[0];
      return payoff >= 3 ? mine : mine === 'C' ? 'D' : 'C';
    }
    case 'GenerousTitForTat': {
      const last = opponentHistory.at(-1);
      if (!last) {
        return 'C';
      }
      if (last === 'D' && random() < 0.15) {
        return 'C';
      }
      return last;
    }
    case 'Random':
      return random() < 0.5 ? 'C' : 'D';
    default:
      return 'C';
  }
}

export function scoreRound(a: Action, b: Action): [number, number] {
  if (a === 'C' && b === 'C') return [3, 3];
  if (a === 'C' && b === 'D') return [0, 5];
  if (a === 'D' && b === 'C') return [5, 0];
  return [1, 1];
}
