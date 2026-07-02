import { useSimulationStore } from '../state/useSimulationStore';

export function AnnouncerPanel() {
  const narrations = useSimulationStore((state) => state.narrations);

  return (
    <section className="panel announcer-panel">
      <div className="panel-header">
        <p className="eyebrow">Announcer</p>
        <h2>Live narration</h2>
      </div>
      <div className="announcer-feed">
        {narrations.length === 0 ? (
          <p className="panel-copy">The announcer will walk you through encounters as they happen.</p>
        ) : (
          narrations.slice(0, 8).map((entry) => (
            <article
              className={entry.priority === 'highlight' ? 'announcer-line highlight' : 'announcer-line'}
              key={entry.id}
            >
              <span className="announcer-time">{entry.timestamp.toFixed(1)}s</span>
              <p>{entry.text}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
