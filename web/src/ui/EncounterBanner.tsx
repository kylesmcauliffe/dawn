import { useSimulationStore } from '../state/useSimulationStore';

export function EncounterBanner() {
  const activeEncounters = useSimulationStore((state) => state.snapshot.activeEncounters);
  const agents = useSimulationStore((state) => state.snapshot.agents);

  const live = activeEncounters[0];
  if (!live) return null;

  const agentA = agents.find((agent) => agent.id === live.agentA);
  const agentB = agents.find((agent) => agent.id === live.agentB);
  if (!agentA || !agentB) return null;

  return (
    <div aria-live="polite" className="encounter-banner">
      <div className="encounter-banner-inner encounter-live">
        <p className="encounter-title">⚔ Wild encounter!</p>
        <div className="encounter-versus">
          <div className="encounter-trainer">
            <span className="encounter-swatch" style={{ backgroundColor: agentA.color }} />
            <span className="encounter-name">{agentA.name}</span>
            <span className={`encounter-move ${live.actionA === 'C' ? 'coop' : 'def'}`}>
              {live.actionA === 'C' ? 'COOPERATE' : 'DEFECT'}
            </span>
          </div>
          <span className="encounter-vs">VS</span>
          <div className="encounter-trainer">
            <span className="encounter-swatch" style={{ backgroundColor: agentB.color }} />
            <span className="encounter-name">{agentB.name}</span>
            <span className={`encounter-move ${live.actionB === 'C' ? 'coop' : 'def'}`}>
              {live.actionB === 'C' ? 'COOPERATE' : 'DEFECT'}
            </span>
          </div>
        </div>
        <span aria-hidden="true" className="encounter-cursor" />
      </div>
    </div>
  );
}
