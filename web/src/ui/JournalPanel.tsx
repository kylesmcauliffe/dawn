import { useSimulationStore } from '../state/useSimulationStore';

export function JournalPanel() {
  const events = useSimulationStore((state) => state.snapshot.events);
  const uiVersion = useSimulationStore((state) => state.uiVersion);

  return (
    <section className="rpg-panel" key={uiVersion}>
      <header className="rpg-panel-head">
        <h2>Field Journal</h2>
        <p>Every encounter, logged in order</p>
      </header>
      <div className="journal-list">
        {events.length === 0 ? (
          <p className="journal-empty">No encounters yet. Send the agents out into the meadow…</p>
        ) : (
          events.map((event, index) => (
            <article className="journal-entry" key={event.id}>
              <span className="journal-index">#{events.length - index}</span>
              <p>{event.text.replace(/ vs /g, ' × ')}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
