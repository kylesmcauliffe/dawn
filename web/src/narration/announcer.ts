import type { Action, EventEntry, GameConfig, StrategyKey } from '../simulation/types';

export function narrateGameStart(config: GameConfig): string {
  const modeLabel =
    config.mode === 'timed_match'
      ? `a ${config.durationSec}s timed match`
      : config.mode === 'encounter_sprint'
        ? `a ${config.maxEncounters}-encounter sprint`
        : 'an open roam session';
  return `Welcome to the Dawn research sandbox. Starting ${modeLabel} with ${config.strategies.length} rule-based agents.`;
}

export function narrateEncounter(
  agentA: StrategyKey,
  agentB: StrategyKey,
  actionA: Action,
  actionB: Action,
  pointsA: number,
  pointsB: number,
): string {
  if (actionA === 'C' && actionB === 'C') {
    return `${agentA} and ${agentB} both cooperate — trust pays off (+${pointsA} each).`;
  }
  if (actionA === 'D' && actionB === 'D') {
    return `Double defection between ${agentA} and ${agentB}. Nobody wins big (+${pointsA}, +${pointsB}).`;
  }
  if (actionA === 'C' && actionB === 'D') {
    return `${agentB} exploits ${agentA}'s cooperation — classic sucker's payoff.`;
  }
  if (actionA === 'D' && actionB === 'C') {
    return `${agentA} defects on trusting ${agentB} and walks away with +${pointsA}.`;
  }
  return `${agentA} vs ${agentB}: ${actionA}/${actionB}.`;
}

export function narrateHighlight(event: EventEntry): string {
  const swing = Math.abs(event.pointsA - event.pointsB);
  if (swing >= 5) {
    return `Highlight: a ${swing}-point swing as ${event.agentA} (${event.actionA}) meets ${event.agentB} (${event.actionB}).`;
  }
  if (event.actionA === 'C' && event.actionB === 'C') {
    return `Highlight: rare mutual trust between ${event.agentA} and ${event.agentB}.`;
  }
  return `Key moment: ${event.text}`;
}

export function narrateGameEnd(winner: StrategyKey | null, totalEncounters: number, elapsed: number): string {
  const time = elapsed.toFixed(1);
  if (!winner) {
    return `Session complete after ${totalEncounters} encounters (${time}s). No clear winner — review the chapters.`;
  }
  return `Session complete. ${winner} leads after ${totalEncounters} encounters in ${time}s. Open the summary to compare against your hypothesis.`;
}

export function buildAnalysis(
  config: GameConfig,
  standings: Array<{ name: StrategyKey; score: number }>,
  highlights: EventEntry[],
): string {
  const winner = standings[0];
  const coopCount = highlights.filter((e) => e.actionA === 'C' && e.actionB === 'C').length;
  const defectCount = highlights.filter((e) => e.actionA === 'D' || e.actionB === 'D').length;
  const coopRate = highlights.length > 0 ? Math.round((coopCount / highlights.length) * 100) : 0;

  const lines = [
    `Economy "${config.economy}" produced ${highlights.length} notable encounters.`,
    `Cooperation appeared in ~${coopRate}% of highlights; defection featured in ${defectCount} key moments.`,
    winner ? `${winner.name} finished on top with ${winner.score} points.` : 'Scores were tightly clustered.',
  ];

  if (config.hypothesis.trim()) {
    lines.push(
      `Hypothesis: "${config.hypothesis.trim()}" — compare this prediction to the winner (${winner?.name ?? 'none'}) and cooperation rate.`,
    );
  } else {
    lines.push('Add a hypothesis before the next run to compare expected vs. actual outcomes.');
  }

  return lines.join(' ');
}

export function buildBatchComparison(runs: Array<{ winner: StrategyKey | null; standings: Array<{ name: StrategyKey; score: number }> }>): string {
  if (runs.length <= 1) return '';
  const wins = new Map<StrategyKey, number>();
  for (const run of runs) {
    if (run.winner) {
      wins.set(run.winner, (wins.get(run.winner) ?? 0) + 1);
    }
  }
  const sorted = [...wins.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return `Ran ${runs.length} games — no dominant winner across runs. Variance is high; try more encounters per game.`;
  }
  const [top, count] = sorted[0];
  return `Across ${runs.length} games, ${top} won ${count} time${count === 1 ? '' : 's'}. Use chapters in each session to see why outcomes diverged.`;
}
