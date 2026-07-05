import { useEffect, useState } from 'react';

import { GameCanvas } from '../game/GameCanvas';
import { useSimulationStore } from '../state/useSimulationStore';
import { ControlDashboard, ScreenHud } from './ControlDashboard';
import { EncounterBanner } from './EncounterBanner';
import { JournalPanel } from './JournalPanel';
import { LabPanel } from './LabPanel';
import { RankingsPanel } from './RankingsPanel';

type MenuTab = 'field' | 'rankings' | 'journal' | 'lab';

export function GameShell() {
  const [tab, setTab] = useState<MenuTab>('field');
  const [booted, setBooted] = useState(false);
  const toggleRunning = useSimulationStore((state) => state.toggleRunning);
  const startRecording = useSimulationStore((state) => state.startRecording);
  const stopRecording = useSimulationStore((state) => state.stopRecording);
  const recording = useSimulationStore((state) => state.recording);
  const mode = useSimulationStore((state) => state.mode);
  const events = useSimulationStore((state) => state.snapshot.events);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

      if (event.code === 'Space') {
        event.preventDefault();
        toggleRunning();
      }
      if (event.key === '1') setTab('field');
      if (event.key === '2') setTab('rankings');
      if (event.key === '3') setTab('journal');
      if (event.key === '4') setTab('lab');
      if (event.key.toLowerCase() === 'r' && mode === 'live') {
        if (recording) stopRecording();
        else startRecording();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleRunning, startRecording, stopRecording, recording, mode]);

  return (
    <div className="gb-device">
      {!booted ? (
        <div className="title-screen">
          <div className="title-screen-inner">
            <p className="title-brand">Artometrics presents</p>
            <h1>Dawn</h1>
            <p className="title-tagline">
              Strategy agents roam a living world.
              <br />
              Watch game theory play out.
            </p>
            <button className="rpg-button primary title-start" onClick={() => setBooted(true)} type="button">
              ▶ Press Start
            </button>
          </div>
        </div>
      ) : null}

      <section aria-label="Game screen" className="gb-top-screen">
        <ScreenHud />
        <div className="game-bezel">
          <div className="game-bezel-screen">
            <GameCanvas />
            <EncounterBanner />
          </div>
        </div>
      </section>

      <ControlDashboard onTabChange={setTab} tab={tab}>
        {tab === 'field' && (
          <section className="rpg-panel compact field-guide">
            <header className="rpg-panel-head">
              <h2>Route 1 Meadow</h2>
              <p>Agents collide → cooperate or defect → scores update live</p>
            </header>
            {events.length > 0 ? (
              <div className="field-recent">
                <p className="field-recent-label">Latest encounters</p>
                {events.slice(0, 3).map((event) => (
                  <p className="field-recent-item" key={event.id}>
                    {event.text.replace(/ vs /g, ' × ')}
                  </p>
                ))}
              </div>
            ) : (
              <p className="field-guide-copy">Waiting for the first encounter…</p>
            )}
          </section>
        )}
        {tab === 'rankings' && <RankingsPanel compact />}
        {tab === 'journal' && <JournalPanel compact />}
        {tab === 'lab' && <LabPanel compact />}
      </ControlDashboard>
    </div>
  );
}
