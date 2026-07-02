import { useSimulationStore } from '../state/useSimulationStore';

export function AnnouncerOverlay() {
  const narrations = useSimulationStore((state) => state.narrations);
  const phase = useSimulationStore((state) => state.phase);
  const latest = narrations[0];

  if (!latest || phase === 'setup') return null;

  return (
    <div className={`announcer-overlay ${latest.priority === 'highlight' ? 'highlight' : ''}`}>
      <p className="announcer-overlay-label">Announcer</p>
      <p className="announcer-overlay-text">{latest.text}</p>
    </div>
  );
}
