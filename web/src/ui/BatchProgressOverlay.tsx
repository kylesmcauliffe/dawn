import { useSimulationStore } from '../state/useSimulationStore';

export function BatchProgressOverlay() {
  const batchRunning = useSimulationStore((state) => state.batchRunning);
  const batchProgress = useSimulationStore((state) => state.batchProgress);
  const cancelBatchRun = useSimulationStore((state) => state.cancelBatchRun);

  if (!batchRunning) return null;

  const pct = batchProgress.total > 0 ? Math.round((batchProgress.current / batchProgress.total) * 100) : 0;

  return (
    <div className="modal-backdrop batch-backdrop" role="presentation">
      <section aria-labelledby="batch-title" className="modal batch-modal" role="dialog">
        <p className="eyebrow">Batch simulation</p>
        <h2 id="batch-title">Running games…</h2>
        <p className="panel-copy">{batchProgress.label}</p>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="batch-meta">
          Game {batchProgress.current} of {batchProgress.total} · {pct}%
        </p>
        <button className="secondary-button" onClick={cancelBatchRun} type="button">
          Cancel
        </button>
      </section>
    </div>
  );
}
