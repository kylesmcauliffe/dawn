import { useSimulationStore } from '../state/useSimulationStore';
import type { CameraMode, ViewMode } from '../simulation/types';

const VIEW_MODES: Array<{ id: ViewMode; label: string }> = [
  { id: 'live', label: 'Live' },
  { id: 'highlights', label: 'Highlights' },
  { id: 'chapters', label: 'Chapters' },
  { id: 'summary', label: 'Summary' },
];

const CAMERA_MODES: Array<{ id: CameraMode; label: string }> = [
  { id: 'auto', label: 'Auto follow' },
  { id: 'free', label: 'Free pan' },
  { id: 'overview', label: 'Overview' },
];

export function ViewControlsPanel() {
  const phase = useSimulationStore((state) => state.phase);
  const viewMode = useSimulationStore((state) => state.viewMode);
  const cameraMode = useSimulationStore((state) => state.cameraMode);
  const zoom = useSimulationStore((state) => state.zoom);
  const running = useSimulationStore((state) => state.running);
  const setViewMode = useSimulationStore((state) => state.setViewMode);
  const setCameraMode = useSimulationStore((state) => state.setCameraMode);
  const zoomIn = useSimulationStore((state) => state.zoomIn);
  const zoomOut = useSimulationStore((state) => state.zoomOut);
  const toggleRunning = useSimulationStore((state) => state.toggleRunning);
  const skipToEnd = useSimulationStore((state) => state.skipToEnd);
  const endRun = useSimulationStore((state) => state.endRun);
  const enterReview = useSimulationStore((state) => state.enterReview);

  return (
    <section className="panel view-panel">
      <div className="panel-header">
        <p className="eyebrow">Sandbox viewer</p>
        <h2>Watch & navigate</h2>
      </div>

      <div className="chip-group">
        <span className="speed-label">View mode</span>
        <div className="speed-options">
          {VIEW_MODES.map((mode) => (
            <button
              className={viewMode === mode.id ? 'speed-chip active' : 'speed-chip'}
              disabled={mode.id === 'live' && phase === 'setup'}
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              type="button"
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chip-group">
        <span className="speed-label">Camera</span>
        <div className="speed-options">
          {CAMERA_MODES.map((mode) => (
            <button
              className={cameraMode === mode.id ? 'speed-chip active' : 'speed-chip'}
              key={mode.id}
              onClick={() => setCameraMode(mode.id)}
              type="button"
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="zoom-row">
        <span className="speed-label">Zoom {Math.round(zoom * 100)}%</span>
        <div className="button-row">
          <button className="secondary-button" onClick={zoomOut} type="button">
            −
          </button>
          <button className="secondary-button" onClick={zoomIn} type="button">
            +
          </button>
        </div>
      </div>

      <div className="button-row">
        {phase === 'running' && (
          <>
            <button className="primary-button" onClick={toggleRunning} type="button">
              {running ? 'Pause' : 'Resume'}
            </button>
            <button className="secondary-button" onClick={skipToEnd} type="button">
              Skip to end
            </button>
            <button className="secondary-button" onClick={endRun} type="button">
              End now
            </button>
          </>
        )}
        {(phase === 'ended' || phase === 'reviewing') && (
          <button className="primary-button" onClick={enterReview} type="button">
            Open replay
          </button>
        )}
      </div>
    </section>
  );
}
