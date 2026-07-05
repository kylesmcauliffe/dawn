import { useSimulationStore } from '../state/useSimulationStore';

export function EventFeed() {
  const events = useSimulationStore((state) => state.snapshot.events);
  const uiVersion = useSimulationStore((state) => state.uiVersion);

  return (
    <section className="panel feed-panel" key={uiVersion}>
      <div className="panel-header">
        <p className="eyebrow">In-world encounters</p>
        <h2>Play-by-play</h2>
      </div>
      <div className="feed-list">
        {events.length === 0 ? (
          <p className="feed-empty">Encounters will appear here as agents meet.</p>
        ) : (
          events.map((event) => (
            <article className="feed-item" key={event.id}>
              {event.text}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
