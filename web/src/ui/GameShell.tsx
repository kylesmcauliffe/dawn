import { useEffect, useState } from 'react';

import { GameCanvas } from '../game/GameCanvas';
import { useSimulationStore } from '../state/useSimulationStore';
import { EncounterBanner } from './EncounterBanner';
import { FieldToolbar } from './FieldToolbar';
import { JournalPanel } from './JournalPanel';
import { LabPanel } from './LabPanel';
import { RankingsPanel } from './RankingsPanel';

type MenuTab = 'field' | 'rankings' | 'journal' | 'lab';

const TABS: Array<{ id: MenuTab; label: string; icon: string; hint: string }> = [
  { id: 'field', label: 'Field', icon: '🌿', hint: 'Watch the meadow' },
  { id: 'rankings', label: 'Dex', icon: '📊', hint: 'Standings & strategies' },
  { id: 'journal', label: 'Journal', icon: '📖', hint: 'Encounter log' },
  { id: 'lab', label: 'Lab', icon: '🔬', hint: 'Record & replay' },
];

export function GameShell() {
  const [tab, setTab] = useState<MenuTab>('field');
  const [booted, setBooted] = useState(false);
  const toggleRunning = useSimulationStore((state) => state.toggleRunning);
  const startRecording = useSimulationStore((state) => state.startRecording);
  const stopRecording = useSimulationStore((state) => state.stopRecording);
  const recording = useSimulationStore((state) => state.recording);
  const mode = useSimulationStore((state) => state.mode);

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
    <div className="pokemon-shell">
      {!booted ? (
        <div className="title-screen">
          <div className="title-screen-inner">
            <p className="title-brand">Artometrics presents</p>
            <h1>Dawn</h1>
            <p className="title-tagline">Strategy agents roam a living world.<br />Watch game theory play out.</p>
            <button className="rpg-button primary title-start" onClick={() => setBooted(true)} type="button">
              ▶ Press Start
            </button>
          </div>
        </div>
      ) : null}

      <header className="game-topbar">
        <div className="game-logo">
          <span className="logo-star">★</span>
          <span>Dawn</span>
        </div>
        <p className="game-subtitle">Strategy Tournament · Route 1 Meadow</p>
      </header>

      <div className="game-layout">
        <section className="game-viewport-col">
          <div className="game-bezel">
            <div className="game-bezel-screen">
              <GameCanvas />
              <EncounterBanner />
            </div>
          </div>
          <FieldToolbar />
        </section>

        <aside className="game-menu-col">
          <nav aria-label="Game menu" className="game-tabs">
            {TABS.map((item) => (
              <button
                aria-current={tab === item.id ? 'page' : undefined}
                className={tab === item.id ? 'game-tab active' : 'game-tab'}
                key={item.id}
                onClick={() => setTab(item.id)}
                title={item.hint}
                type="button"
              >
                <span className="tab-icon">{item.icon}</span>
                <span className="tab-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="game-panel-slot">
            {tab === 'field' && (
              <section className="rpg-panel field-guide">
                <header className="rpg-panel-head">
                  <h2>Field Guide</h2>
                  <p>What you&apos;re watching</p>
                </header>
                <p className="field-guide-copy">
                  Seven classic prisoners&apos; dilemma strategies wander the meadow as pixel trainers.
                  When two meet, they choose <strong>Cooperate</strong> or <strong>Defect</strong> — payoffs update the live Dex.
                </p>
                <ul className="field-guide-list">
                  <li>Camera follows encounters automatically</li>
                  <li>Open <strong>Dex</strong> for standings + strategy info</li>
                  <li>Use <strong>Lab</strong> to record a run for class or research</li>
                </ul>
              </section>
            )}
            {tab === 'rankings' && <RankingsPanel />}
            {tab === 'journal' && <JournalPanel />}
            {tab === 'lab' && <LabPanel />}
          </div>
        </aside>
      </div>
    </div>
  );
}
