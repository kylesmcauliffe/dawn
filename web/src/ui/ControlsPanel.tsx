import { useRef } from 'react';

import { loadReplayFromFile, useSimulationStore } from '../state/useSimulationStore';

const SPEEDS = [0.5, 1, 1.5, 2, 3];

function formatElapsed(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ControlsPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const running = useSimulationStore((state) => state.running);
  const speed = useSimulationStore((state) => state.speed);
  const mode = useSimulationStore((state) => state.mode);
  const recording = useSimulationStore((state) => state.recording);
  const replay = useSimulationStore((state) => state.replay);
  const replayElapsed = useSimulationStore((state) => state.replayElapsed);
  const elapsed = useSimulationStore((state) => state.snapshot.elapsed);
  const toggleRunning = useSimulationStore((state) => state.toggleRunning);
  const setSpeed = useSimulationStore((state) => state.setSpeed);
  const reset = useSimulationStore((state) => state.reset);
  const startRecording = useSimulationStore((state) => state.startRecording);
  const stopRecording = useSimulationStore((state) => state.stopRecording);
  const downloadRecording = useSimulationStore((state) => state.downloadRecording);
  const loadReplay = useSimulationStore((state) => state.loadReplay);
  const exitReplay = useSimulationStore((state) => state.exitReplay);
  const setReplayElapsed = useSimulationStore((state) => state.setReplayElapsed);

  const replayDuration = replay?.frames.at(-1)?.elapsed ?? 0;
  const displayElapsed = mode === 'replay' ? replayElapsed : elapsed;

  return (
    <section className="panel controls-panel">
      <div className="panel-header">
        <p className="eyebrow">{mode === 'replay' ? 'Replay mode' : 'Strategy tournament'}</p>
        <h2>Dawn</h2>
      </div>
      <p className="panel-copy">
        {mode === 'replay'
          ? 'Scrub or play back a recorded run. Standings and encounters update from the saved timeline.'
          : 'Agents roam continuously, resolve prisoner’s dilemma encounters in-browser, and update the standings with no backend.'}
      </p>

      <div className="status-row">
        <span className={`status-pill ${running ? 'live' : 'paused'}`}>{running ? 'Running' : 'Paused'}</span>
        <span className="elapsed-label">{formatElapsed(displayElapsed)}</span>
        {recording ? <span className="status-pill recording">Recording</span> : null}
      </div>

      <div className="button-row">
        <button className="primary-button" onClick={toggleRunning} type="button">
          {running ? 'Pause sim' : 'Resume sim'}
        </button>
        <button
          className="secondary-button"
          disabled={mode === 'replay'}
          onClick={() => reset()}
          type="button"
        >
          Reset world
        </button>
      </div>

      {mode === 'live' ? (
        <div className="button-row">
          {!recording ? (
            <button className="secondary-button" onClick={startRecording} type="button">
              Start recording
            </button>
          ) : (
            <>
              <button className="secondary-button" onClick={stopRecording} type="button">
                Stop recording
              </button>
              <button className="secondary-button" onClick={downloadRecording} type="button">
                Download replay
              </button>
            </>
          )}
          <button className="secondary-button" onClick={() => fileInputRef.current?.click()} type="button">
            Load replay
          </button>
        </div>
      ) : (
        <div className="replay-controls">
          <input
            className="replay-scrubber"
            max={replayDuration}
            min={0}
            onChange={(event) => setReplayElapsed(Number(event.target.value))}
            step={0.05}
            type="range"
            value={replayElapsed}
          />
          <button className="secondary-button" onClick={exitReplay} type="button">
            Exit replay
          </button>
        </div>
      )}

      <input
        accept="application/json,.json"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          try {
            const recording = await loadReplayFromFile(file);
            loadReplay(recording);
          } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Could not load replay file.');
          }
        }}
        ref={fileInputRef}
        type="file"
      />

      <div className="speed-group">
        <span className="speed-label">Speed</span>
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
    </section>
  );
}
