import { useSimulationStore } from '../state/useSimulationStore';

export function EndGameSummaryModal() {
  const showSummary = useSimulationStore((state) => state.showSummary);
  const summary = useSimulationStore((state) => state.summary);
  const batchResults = useSimulationStore((state) => state.batchResults);
  const batchComparison = useSimulationStore((state) => state.batchComparison);
  const dismissSummary = useSimulationStore((state) => state.dismissSummary);
  const saveCurrentSession = useSimulationStore((state) => state.saveCurrentSession);
  const saveToLeaderboard = useSimulationStore((state) => state.saveToLeaderboard);
  const enterReview = useSimulationStore((state) => state.enterReview);

  if (!showSummary || !summary) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-labelledby="summary-title" className="modal summary-modal" role="dialog">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Run complete</p>
            <h2 id="summary-title">Research summary</h2>
          </div>
          <button className="icon-button" onClick={dismissSummary} type="button">
            ✕
          </button>
        </header>

        <div className="summary-grid">
          <div className="summary-card">
            <h3>Winner</h3>
            <p className="summary-winner">{summary.winner ?? 'Tie / unclear'}</p>
            <p className="summary-meta">
              {summary.totalEncounters} encounters · {summary.elapsed.toFixed(1)}s
            </p>
          </div>

          <div className="summary-card">
            <h3>Standings</h3>
            <ol className="standings-list compact">
              {summary.standings.map((entry) => (
                <li className="standing-row" key={entry.name}>
                  <span>{entry.name}</span>
                  <span style={{ color: entry.color }}>{entry.score}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {summary.hypothesis && (
          <div className="summary-block">
            <h3>Hypothesis</h3>
            <p>{summary.hypothesis}</p>
          </div>
        )}

        <div className="summary-block">
          <h3>Analysis</h3>
          <p>{summary.analysis}</p>
        </div>

        {batchResults.length > 1 && (
          <div className="summary-block">
            <h3>Batch comparison</h3>
            <p>{batchComparison}</p>
            <ul className="batch-list">
              {batchResults.map((run) => (
                <li key={run.runIndex}>
                  Game {run.runIndex} (seed {run.seed}): {run.winner ?? 'no winner'} — {run.totalEncounters}{' '}
                  encounters
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.highlights.length > 0 && (
          <div className="summary-block">
            <h3>Highlights</h3>
            <ul className="batch-list">
              {summary.highlights.slice(0, 6).map((event) => (
                <li key={event.id}>
                  {event.timestamp.toFixed(1)}s — {event.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="button-row">
          <button
            className="primary-button"
            onClick={() => {
              saveCurrentSession(`Run ${new Date().toLocaleString()}`);
              dismissSummary();
            }}
            type="button"
          >
            Save session
          </button>
          <button className="secondary-button" onClick={saveToLeaderboard} type="button">
            Add to leaderboard
          </button>
          <button
            className="secondary-button"
            onClick={() => {
              enterReview();
              dismissSummary();
            }}
            type="button"
          >
            Review replay
          </button>
        </div>
      </section>
    </div>
  );
}
