import { useSimulationStore } from '../state/useSimulationStore';

export function ReplayPanel() {
  const chapters = useSimulationStore((state) => state.chapters);
  const replayFrames = useSimulationStore((state) => state.replayFrames);
  const replayIndex = useSimulationStore((state) => state.replayIndex);
  const replayPlaying = useSimulationStore((state) => state.replayPlaying);
  const viewMode = useSimulationStore((state) => state.viewMode);
  const jumpToChapter = useSimulationStore((state) => state.jumpToChapter);
  const setReplayIndex = useSimulationStore((state) => state.setReplayIndex);
  const toggleReplayPlaying = useSimulationStore((state) => state.toggleReplayPlaying);

  const visibleChapters =
    viewMode === 'highlights' ? chapters.filter((chapter) => chapter.highlight) : chapters;

  const currentFrame = replayFrames[replayIndex];
  const maxIndex = Math.max(0, replayFrames.length - 1);

  return (
    <section className="panel replay-panel">
      <div className="panel-header">
        <p className="eyebrow">Timeline</p>
        <h2>Chapters & replay</h2>
      </div>

      {replayFrames.length === 0 ? (
        <p className="panel-copy">Start a run to record chapters and replay frames.</p>
      ) : (
        <>
          <div className="replay-scrubber">
            <input
              className="scrubber-input"
              max={maxIndex}
              min={0}
              onChange={(event) => setReplayIndex(Number(event.target.value))}
              type="range"
              value={replayIndex}
            />
            <div className="replay-meta">
              <span>{currentFrame ? `${currentFrame.elapsed.toFixed(1)}s` : '0s'}</span>
              <button className="speed-chip" onClick={toggleReplayPlaying} type="button">
                {replayPlaying ? 'Pause replay' : 'Play replay'}
              </button>
            </div>
          </div>

          <div className="chapter-list">
            {visibleChapters.slice(0, 20).map((chapter) => (
              <button
                className={chapter.highlight ? 'chapter-item highlight' : 'chapter-item'}
                key={chapter.id}
                onClick={() => jumpToChapter(chapter.id)}
                type="button"
              >
                <span className="chapter-title">{chapter.title}</span>
                <span className="chapter-time">{chapter.timestamp.toFixed(1)}s</span>
                <span className="chapter-summary">{chapter.summary}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
