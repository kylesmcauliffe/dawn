import { useState } from 'react';

import { STRATEGY_COLORS, STRATEGY_INFO, STRATEGY_ORDER } from '../simulation/strategies';
import type { StrategyKey } from '../simulation/types';
import { useSimulationStore } from '../state/useSimulationStore';

type RankingsPanelProps = {
  compact?: boolean;
};

export function RankingsPanel({ compact = false }: RankingsPanelProps) {
  const standings = useSimulationStore((state) => state.snapshot.standings);
  const uiVersion = useSimulationStore((state) => state.uiVersion);
  const [selected, setSelected] = useState<StrategyKey | null>(null);

  const active = selected ?? standings[0]?.name ?? STRATEGY_ORDER[0];
  const info = STRATEGY_INFO[active];

  return (
    <section className={`rpg-panel ${compact ? 'compact' : ''}`} key={uiVersion}>
      <header className="rpg-panel-head">
        <h2>Strategy Dex</h2>
        {!compact ? <p>Live tournament standings</p> : null}
      </header>

      <ol className="dex-list">
        {standings.map((entry, index) => (
          <li key={entry.name}>
            <button
              className={`dex-row ${index === 0 ? 'leader' : ''} ${active === entry.name ? 'selected' : ''}`}
              onClick={() => setSelected(entry.name)}
              type="button"
            >
              <span className="dex-rank">#{index + 1}</span>
              <span className="dex-swatch" style={{ backgroundColor: entry.color }} />
              <span className="dex-name">{entry.name}</span>
              <span className="dex-score">{entry.score}</span>
            </button>
          </li>
        ))}
      </ol>

      <article className="dex-detail">
        <div className="dex-detail-head">
          <span className="dex-detail-swatch" style={{ backgroundColor: STRATEGY_COLORS[active] }} />
          <div>
            <h3>{active}</h3>
            <p>
              {info.nickname} · {info.type}
            </p>
          </div>
        </div>
        <p className="dex-tagline">{info.tagline}</p>
        {!compact ? <p className="dex-description">{info.description}</p> : null}
      </article>
    </section>
  );
}
