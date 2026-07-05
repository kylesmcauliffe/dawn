import { useRef } from 'react';

import { loadReplayFromFile, useSimulationStore } from '../state/useSimulationStore';

export function LabPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mode = useSimulationStore((state) => state.mode);
  const recording = useSimulationStore((state) => state.recording);
  const replay = useSimulationStore((state) => state.replay);
  const replayElapsed = useSimulationStore((state) => state.replayElapsed);
  const reset = useSimulationStore((state) => state.reset);
  const startRecording = useSimulationStore((state) => state.startRecording);
  const stopRecording = useSimulationStore((state) => state.stopRecording);
  const downloadRecording = useSimulationStore((state) => state.downloadRecording);
  const loadReplay = useSimulationStore((state) => state.loadReplay);
  const exitReplay = useSimulationStore((state) => state.exitReplay);
  const setReplayElapsed = useSimulationStore((state) => state.setReplayElapsed);

  const replayDuration = replay?.frames.at(-1)?.elapsed ?? 0;

  return (
    <section className="rpg-panel">
      <header className="rpg-panel-head">
        <h2>Research Lab</h2>
        <p>Record runs, replay them, reset the world</p>
      </header>

      <div className="lab-section">
        <h3>World</h3>
        <div className="lab-actions">
          <button className="rpg-button" disabled={mode === 'replay'} onClick={() => reset()} type="button">
            New tournament
          </button>
        </div>
      </div>

      <div className="lab-section">
        <h3>Recording</h3>
        <p className="lab-copy">Capture a full run as JSON — share it, replay it, cite it in a paper.</p>
        <div className="lab-actions">
          {mode === 'live' && !recording ? (
            <button className="rpg-button primary" onClick={startRecording} type="button">
              ● Start recording
            </button>
          ) : null}
          {recording ? (
            <>
              <button className="rpg-button" onClick={stopRecording} type="button">
                Stop
              </button>
              <button className="rpg-button" onClick={downloadRecording} type="button">
                Download .json
              </button>
            </>
          ) : null}
          <button className="rpg-button" onClick={() => fileInputRef.current?.click()} type="button">
            Load replay
          </button>
        </div>
      </div>

      {mode === 'replay' && replay ? (
        <div className="lab-section">
          <h3>Replay scrubber</h3>
          <input
            className="replay-scrubber"
            max={replayDuration}
            min={0}
            onChange={(event) => setReplayElapsed(Number(event.target.value))}
            step={0.05}
            type="range"
            value={replayElapsed}
          />
          <button className="rpg-button" onClick={exitReplay} type="button">
            Exit replay
          </button>
        </div>
      ) : null}

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

      <div className="lab-section lab-tips">
        <h3>Controls</h3>
        <ul>
          <li><kbd>Space</kbd> Pause / resume</li>
          <li><kbd>1</kbd>–<kbd>4</kbd> Switch menu tabs</li>
          <li><kbd>R</kbd> Toggle recording (live mode)</li>
        </ul>
      </div>
    </section>
  );
}
