import { useSimulationStore } from '../state/useSimulationStore';

export function StandingsPanel() {
  const standings = useSimulationStore((state) => state.snapshot.standings);
  const uiVersion = useSimulationStore((state) => state.uiVersion);

  return (
    <section className="panel standings-panel" key={uiVersion}>
      <div className="panel-header">
        <p className="eyebrow">Live ladder</p>
        <h2>Standings</h2>
      </div>
      <ol className="standings-list">
        {standings.map((entry, index) => (
          <li className={`standing-row ${index === 0 ? 'leader' : ''}`} key={entry.name}>
            <span className="standing-rank">
              <span className="standing-index">{index + 1}</span>
              {entry.name}
            </span>
            <span className="standing-score" style={{ color: entry.color }}>
              {entry.score}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
