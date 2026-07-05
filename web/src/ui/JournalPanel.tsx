import { useSimulationStore } from '../state/useSimulationStore';

type JournalPanelProps = {
  compact?: boolean;
};

export function JournalPanel({ compact = false }: JournalPanelProps) {
  const events = useSimulationStore((state) => state.snapshot.events);
  const uiVersion = useSimulationStore((state) => state.uiVersion);

  return (
    <section className={`rpg-panel ${compact ? 'compact' : ''}`} key={uiVersion}>
      <header className="rpg-panel-head">
        <h2>Field Journal</h2>
        {!compact ? <p>Every encounter, logged in order</p> : null}
      </header>
      <div className="journal-list">
        {events.length === 0 ? (
          <p className="journal-empty">No encounters yet.</p>
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
