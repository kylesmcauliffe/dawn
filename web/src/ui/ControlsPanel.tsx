import { useSimulationStore } from '../state/useSimulationStore';

const SPEEDS = [0.5, 1, 1.5, 2, 3];

export function ControlsPanel() {
  const phase = useSimulationStore((state) => state.phase);
  const running = useSimulationStore((state) => state.running);
  const speed = useSimulationStore((state) => state.speed);
  const snapshot = useSimulationStore((state) => state.snapshot);
  const config = useSimulationStore((state) => state.config);
  const setSpeed = useSimulationStore((state) => state.setSpeed);

  const statusLabel =
    phase === 'setup'
      ? 'Ready to configure'
      : phase === 'running'
        ? running
          ? 'Live simulation'
          : 'Paused'
        : phase === 'reviewing'
          ? 'Reviewing replay'
          : 'Run ended';

  return (
    <section className="panel controls-panel">
      <div className="panel-header">
        <p className="eyebrow">Run status</p>
        <h2>{statusLabel}</h2>
      </div>
      <div className="status-metrics">
        <div className="metric">
          <span className="metric-label">Elapsed</span>
          <span className="metric-value">{snapshot.elapsed.toFixed(1)}s</span>
        </div>
        <div className="metric">
          <span className="metric-label">Encounters</span>
          <span className="metric-value">
            {snapshot.encounterCount}
            {config.mode !== 'encounter_sprint' ? '' : ` / ${config.maxEncounters}`}
          </span>
        </div>
      </div>
      {phase === 'running' && (
        <div className="speed-group">
          <span className="speed-label">Playback speed</span>
          <div className="speed-options">
            {SPEEDS.map((value) => (
              <button
                className={value === speed ? 'speed-chip active' : 'speed-chip'}
                key={value}
                onClick={() => setSpeed(value)}
                type="button"
              >
                {value}x
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
