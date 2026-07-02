import { useSimulationStore } from '../state/useSimulationStore';

export function StandingsPanel() {
  const standings = useSimulationStore((state) => state.snapshot.standings);
  const phase = useSimulationStore((state) => state.phase);
  const summary = useSimulationStore((state) => state.summary);

  const title = phase === 'ended' || phase === 'reviewing' ? 'Final standings' : 'Live standings';

  return (
    <section className="panel standings-panel">
      <div className="panel-header">
        <p className="eyebrow">{phase === 'running' ? 'Live ladder' : 'Results'}</p>
        <h2>{title}</h2>
      </div>
      <ol className="standings-list">
        {standings.map((entry, index) => (
          <li className="standing-row" key={entry.name}>
            <span className="standing-rank">
              {index + 1}. {entry.name}
            </span>
            <span className="standing-score" style={{ color: entry.color }}>
              {entry.score}
            </span>
          </li>
        ))}
      </ol>
      {summary?.winner && (phase === 'ended' || phase === 'reviewing') && (
        <p className="panel-copy winner-note">Leader: {summary.winner}</p>
      )}
    </section>
  );
}
