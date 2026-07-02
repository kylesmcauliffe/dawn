import './App.css';
import { GameCanvas } from './game/GameCanvas';
import { AnnouncerOverlay } from './ui/AnnouncerOverlay';
import { AnnouncerPanel } from './ui/AnnouncerPanel';
import { ConfigPanel } from './ui/ConfigPanel';
import { ControlsPanel } from './ui/ControlsPanel';
import { EndGameSummaryModal } from './ui/EndGameSummaryModal';
import { EventFeed } from './ui/EventFeed';
import { LeaderboardPanel } from './ui/LeaderboardPanel';
import { ReplayPanel } from './ui/ReplayPanel';
import { SessionPanel } from './ui/SessionPanel';
import { StandingsPanel } from './ui/StandingsPanel';
import { ViewControlsPanel } from './ui/ViewControlsPanel';

function App() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <ConfigPanel />
        <ViewControlsPanel />
        <ControlsPanel />
        <AnnouncerPanel />
        <StandingsPanel />
        <ReplayPanel />
        <EventFeed />
        <SessionPanel />
        <LeaderboardPanel />
      </aside>
      <section className="stage">
        <header className="stage-header">
          <div>
            <p className="eyebrow">Artometrics</p>
            <h1>Dawn</h1>
          </div>
          <p className="stage-copy">
            A research sandbox for strategy societies — configure a run, watch agents in a themed room, skip to highlights,
            review chapters, and compare results against your hypothesis.
          </p>
        </header>
        <div className="canvas-wrap">
          <GameCanvas />
          <AnnouncerOverlay />
        </div>
      </section>
      <EndGameSummaryModal />
    </main>
  );
}

export default App;
