import { buildEngine } from './engine';
import type { BatchRunResult, EndGameSummary, GameConfig } from './types';

export type BatchRunOptions = {
  onProgress?: (current: number, total: number) => void;
  signal?: { cancelled: boolean };
};

export type BatchRunOutput = {
  results: BatchRunResult[];
  lastSummary: EndGameSummary;
  lastEngine: ReturnType<typeof buildEngine>['engine'];
};

export async function runBatchGames(
  config: GameConfig,
  batchCount: number,
  options: BatchRunOptions = {},
): Promise<BatchRunOutput> {
  const results: BatchRunResult[] = [];
  let lastBuilt = buildEngine(config, { lite: true });
  let lastSummary = lastBuilt.engine.buildSummary();

  for (let index = 0; index < batchCount; index += 1) {
    if (options.signal?.cancelled) break;

    const runConfig = { ...config, seed: config.seed + index };
    const built = buildEngine(runConfig, { lite: true });
    built.engine.fastForwardToEnd({ stepSize: 0.25 });
    lastSummary = built.engine.buildSummary();
    lastBuilt = built;

    results.push({
      runIndex: index + 1,
      seed: runConfig.seed,
      winner: lastSummary.winner,
      standings: lastSummary.standings,
      totalEncounters: lastSummary.totalEncounters,
      elapsed: lastSummary.elapsed,
    });

    options.onProgress?.(index + 1, batchCount);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }

  return {
    results,
    lastSummary,
    lastEngine: lastBuilt.engine,
  };
}
