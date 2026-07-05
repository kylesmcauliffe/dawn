import './App.css';
import { GameCanvas } from './game/GameCanvas';
import { ControlsPanel } from './ui/ControlsPanel';
import { EventFeed } from './ui/EventFeed';
import { StandingsPanel } from './ui/StandingsPanel';

function App() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <ControlsPanel />
        <StandingsPanel />
        <EventFeed />
      </aside>
      <section className="stage">
        <header className="stage-header">
          <div>
            <p className="eyebrow">Artometrics</p>
            <h1>Dawn</h1>
          </div>
          <p className="stage-copy">
            Watch classic prisoners’ dilemma strategies collide in a living top-down world — smooth enough to follow, recordable enough to study.
          </p>
        </header>
        <GameCanvas />
      </section>
    </main>
  );
}

export default App;
