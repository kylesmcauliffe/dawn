import { useSimulationStore } from '../state/useSimulationStore';

const SPEEDS = [0.5, 1, 1.5, 2, 3];

function formatElapsed(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function FieldToolbar() {
  const running = useSimulationStore((state) => state.running);
  const speed = useSimulationStore((state) => state.speed);
  const mode = useSimulationStore((state) => state.mode);
  const recording = useSimulationStore((state) => state.recording);
  const elapsed = useSimulationStore((state) => state.snapshot.elapsed);
  const replayElapsed = useSimulationStore((state) => state.replayElapsed);
  const toggleRunning = useSimulationStore((state) => state.toggleRunning);
  const setSpeed = useSimulationStore((state) => state.setSpeed);

  const displayElapsed = mode === 'replay' ? replayElapsed : elapsed;

  return (
    <div className="field-toolbar">
      <button className="rpg-button primary" onClick={toggleRunning} type="button">
        {running ? '⏸ Pause' : '▶ Run'}
      </button>
      <div className="speed-picker">
        {SPEEDS.map((value) => (
          <button
            className={value === speed ? 'rpg-chip active' : 'rpg-chip'}
            key={value}
            onClick={() => setSpeed(value)}
            type="button"
          >
            {value}x
          </button>
        ))}
      </div>
      <div className="field-status">
        <span className={`field-dot ${running ? 'on' : ''}`} />
        <span>{formatElapsed(displayElapsed)}</span>
        {recording ? <span className="field-rec">● REC</span> : null}
        {mode === 'replay' ? <span className="field-rec replay">REPLAY</span> : null}
      </div>
    </div>
  );
}
