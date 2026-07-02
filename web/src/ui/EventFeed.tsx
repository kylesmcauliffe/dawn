import { useSimulationStore } from '../state/useSimulationStore';

export function EventFeed() {
  const events = useSimulationStore((state) => state.snapshot.events);
  const jumpToChapter = useSimulationStore((state) => state.jumpToChapter);
  const chapters = useSimulationStore((state) => state.chapters);

  return (
    <section className="panel feed-panel">
      <div className="panel-header">
        <p className="eyebrow">In-world encounters</p>
        <h2>Play-by-play</h2>
      </div>
      <div className="feed-list">
        {events.length === 0 ? (
          <p className="panel-copy">Encounters will appear here as agents meet in the sandbox.</p>
        ) : (
          events.map((event) => {
            const chapter = chapters.find((item) => item.index === event.encounterIndex);
            return (
              <button
                className={event.highlight ? 'feed-item highlight clickable' : 'feed-item clickable'}
                key={event.id}
                onClick={() => chapter && jumpToChapter(chapter.id)}
                type="button"
              >
                <span className="feed-time">{event.timestamp.toFixed(1)}s</span>
                {event.text}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
