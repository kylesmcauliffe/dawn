import { useSimulationStore } from '../state/useSimulationStore';
import { ECONOMIES, GAME_MODES } from '../config/defaults';

export function LeaderboardPanel() {
  const leaderboard = useSimulationStore((state) => state.leaderboard);

  return (
    <section className="panel leaderboard-panel">
      <div className="panel-header">
        <p className="eyebrow">Demo leaderboard</p>
        <h2>Past runs</h2>
      </div>
      {leaderboard.length === 0 ? (
        <p className="panel-copy">Finish a run and tap “Add to leaderboard” to pin results here (local demo).</p>
      ) : (
        <ul className="leaderboard-list">
          {leaderboard.map((entry) => (
            <li className="leaderboard-item" key={entry.id}>
              <div className="leaderboard-top">
                <strong>{entry.winner ?? 'No winner'}</strong>
                <span>{entry.topScore} pts</span>
              </div>
              <p className="leaderboard-meta">
                {GAME_MODES[entry.mode].label} · {ECONOMIES[entry.economy].label}
              </p>
              <p className="leaderboard-meta">
                {entry.totalEncounters} encounters · {entry.elapsed.toFixed(1)}s
              </p>
              {entry.hypothesis && <p className="leaderboard-hypothesis">“{entry.hypothesis}”</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
