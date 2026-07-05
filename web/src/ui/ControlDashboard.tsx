import type { ReactNode } from 'react';

import { useSimulationStore } from '../state/useSimulationStore';

const SPEEDS = [0.5, 1, 2, 3];

function formatElapsed(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ScreenHud() {
  const running = useSimulationStore((state) => state.running);
  const mode = useSimulationStore((state) => state.mode);
  const recording = useSimulationStore((state) => state.recording);
  const elapsed = useSimulationStore((state) => state.snapshot.elapsed);
  const replayElapsed = useSimulationStore((state) => state.replayElapsed);

  const displayElapsed = mode === 'replay' ? replayElapsed : elapsed;

  return (
    <div className="screen-hud">
      <div className="screen-hud-brand">
        <span className="logo-star">★</span>
        <span>Dawn</span>
      </div>
      <div className="screen-hud-stats">
        <span className={`hud-dot ${running ? 'on' : ''}`} />
        <span className="hud-time">{formatElapsed(displayElapsed)}</span>
        {recording ? <span className="hud-badge rec">REC</span> : null}
        {mode === 'replay' ? <span className="hud-badge replay">RPL</span> : null}
      </div>
    </div>
  );
}

type MenuTab = 'field' | 'rankings' | 'journal' | 'lab';

type ControlDashboardProps = {
  tab: MenuTab;
  onTabChange: (tab: MenuTab) => void;
  children: ReactNode;
};

const TABS: Array<{ id: MenuTab; label: string; icon: string }> = [
  { id: 'field', label: 'Field', icon: '🌿' },
  { id: 'rankings', label: 'Dex', icon: '📊' },
  { id: 'journal', label: 'Log', icon: '📖' },
  { id: 'lab', label: 'Lab', icon: '🔬' },
];

export function ControlDashboard({ tab, onTabChange, children }: ControlDashboardProps) {
  const running = useSimulationStore((state) => state.running);
  const speed = useSimulationStore((state) => state.speed);
  const mode = useSimulationStore((state) => state.mode);
  const recording = useSimulationStore((state) => state.recording);
  const toggleRunning = useSimulationStore((state) => state.toggleRunning);
  const setSpeed = useSimulationStore((state) => state.setSpeed);
  const startRecording = useSimulationStore((state) => state.startRecording);
  const stopRecording = useSimulationStore((state) => state.stopRecording);

  const cycleSpeed = () => {
    const index = SPEEDS.indexOf(speed);
    const next = SPEEDS[(index + 1) % SPEEDS.length];
    setSpeed(next);
  };

  const toggleRecord = () => {
    if (mode !== 'live') return;
    if (recording) stopRecording();
    else startRecording();
  };

  return (
    <footer className="gb-dashboard">
      <nav aria-label="Game menu" className="gb-tabs">
        {TABS.map((item) => (
          <button
            aria-current={tab === item.id ? 'page' : undefined}
            className={tab === item.id ? 'gb-tab active' : 'gb-tab'}
            key={item.id}
            onClick={() => onTabChange(item.id)}
            type="button"
          >
            <span className="gb-tab-icon">{item.icon}</span>
            <span className="gb-tab-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="gb-panel-scroll">{children}</div>

      <div className="gb-control-deck">
        <div className="gb-dpad" aria-hidden="true">
          <span className="dpad-up" />
          <span className="dpad-mid" />
          <span className="dpad-down" />
        </div>

        <div className="gb-center-controls">
          <button className="gb-btn select" onClick={cycleSpeed} type="button">
            SELECT · {speed}x
          </button>
          <button className="gb-btn start" onClick={toggleRunning} type="button">
            {running ? 'START · Pause' : 'START · Run'}
          </button>
        </div>

        <div className="gb-face-buttons">
          <button
            className="gb-btn btn-b"
            disabled={mode === 'replay'}
            onClick={toggleRecord}
            type="button"
          >
            B · {recording ? 'Stop' : 'Rec'}
          </button>
          <button className="gb-btn btn-a primary" onClick={toggleRunning} type="button">
            A · {running ? '⏸' : '▶'}
          </button>
        </div>
      </div>
    </footer>
  );
}
