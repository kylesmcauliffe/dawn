import { useSimulationStore } from '../state/useSimulationStore';

export function SessionPanel() {
  const savedSessions = useSimulationStore((state) => state.savedSessions);
  const loadSession = useSimulationStore((state) => state.loadSession);
  const removeSession = useSimulationStore((state) => state.removeSession);

  return (
    <section className="panel session-panel">
      <div className="panel-header">
        <p className="eyebrow">Saved locally</p>
        <h2>Sessions</h2>
      </div>
      {savedSessions.length === 0 ? (
        <p className="panel-copy">Save a completed run to reload its config, summary, and replay later.</p>
      ) : (
        <ul className="session-list">
          {savedSessions.map((session) => (
            <li className="session-item" key={session.id}>
              <div>
                <strong>{session.name}</strong>
                <p className="session-meta">
                  {new Date(session.savedAt).toLocaleString()} · {session.summary.winner ?? 'no winner'}
                </p>
              </div>
              <div className="session-actions">
                <button className="speed-chip" onClick={() => loadSession(session.id)} type="button">
                  Load
                </button>
                <button className="speed-chip" onClick={() => removeSession(session.id)} type="button">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
