import { AI_MODELS, ASSET_THEMES, DEFAULT_GAME_CONFIG, ECONOMIES, GAME_MODES } from '../config/defaults';
import { useSimulationStore } from '../state/useSimulationStore';
import type { GameModeId } from '../simulation/types';

export function ConfigPanel() {
  const config = useSimulationStore((state) => state.config);
  const phase = useSimulationStore((state) => state.phase);
  const setConfig = useSimulationStore((state) => state.setConfig);
  const startRun = useSimulationStore((state) => state.startRun);

  const locked = phase === 'running';

  return (
    <section className="panel config-panel">
      <div className="panel-header">
        <p className="eyebrow">Research setup</p>
        <h2>Configure run</h2>
      </div>
      <p className="panel-copy">
        Choose mode, economy, sandbox theme, and hypothesis. Then run live or batch-simulate for comparison.
      </p>

      <label className="field">
        <span className="field-label">Game mode</span>
        <select
          className="field-input"
          disabled={locked}
          onChange={(event) => setConfig({ mode: event.target.value as GameModeId })}
          value={config.mode}
        >
          {Object.entries(GAME_MODES).map(([id, mode]) => (
            <option key={id} value={id}>
              {mode.label}
            </option>
          ))}
        </select>
        <span className="field-hint">{GAME_MODES[config.mode].description}</span>
      </label>

      <label className="field">
        <span className="field-label">Economy</span>
        <select
          className="field-input"
          disabled={locked}
          onChange={(event) => setConfig({ economy: event.target.value as typeof config.economy })}
          value={config.economy}
        >
          {Object.entries(ECONOMIES).map(([id, economy]) => (
            <option key={id} value={id}>
              {economy.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">Sandbox theme</span>
        <select
          className="field-input"
          disabled={locked}
          onChange={(event) => setConfig({ assetTheme: event.target.value as typeof config.assetTheme })}
          value={config.assetTheme}
        >
          {Object.entries(ASSET_THEMES).map(([id, theme]) => (
            <option key={id} value={id}>
              {theme.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">AI model</span>
        <select
          className="field-input"
          disabled={locked}
          onChange={(event) => setConfig({ aiModel: event.target.value as typeof config.aiModel })}
          value={config.aiModel}
        >
          {Object.entries(AI_MODELS).map(([id, model]) => (
            <option disabled={!model.available} key={id} value={id}>
              {model.label}
            </option>
          ))}
        </select>
        <span className="field-hint">{AI_MODELS[config.aiModel].description}</span>
      </label>

      <label className="field">
        <span className="field-label">Hypothesis</span>
        <textarea
          className="field-input field-textarea"
          disabled={locked}
          onChange={(event) => setConfig({ hypothesis: event.target.value })}
          placeholder="e.g. Tit-for-Tat should dominate in a cooperation-bonus economy"
          rows={3}
          value={config.hypothesis}
        />
      </label>

      <div className="field-row">
        <label className="field compact">
          <span className="field-label">Duration (s)</span>
          <input
            className="field-input"
            disabled={locked || config.mode === 'encounter_sprint'}
            min={15}
            max={300}
            onChange={(event) => setConfig({ durationSec: Number(event.target.value) })}
            type="number"
            value={config.durationSec}
          />
        </label>
        <label className="field compact">
          <span className="field-label">Max encounters</span>
          <input
            className="field-input"
            disabled={locked}
            min={10}
            max={200}
            onChange={(event) => setConfig({ maxEncounters: Number(event.target.value) })}
            type="number"
            value={config.maxEncounters}
          />
        </label>
        <label className="field compact">
          <span className="field-label">Batch games</span>
          <input
            className="field-input"
            disabled={locked}
            max={5}
            min={1}
            onChange={(event) => setConfig({ batchCount: Number(event.target.value) })}
            type="number"
            value={config.batchCount}
          />
        </label>
      </div>

      <div className="button-row">
        <button className="primary-button" disabled={locked} onClick={startRun} type="button">
          {config.batchCount > 1 ? `Run ${config.batchCount} games` : 'Start live run'}
        </button>
        <button
          className="secondary-button"
          disabled={locked}
          onClick={() => setConfig(DEFAULT_GAME_CONFIG)}
          type="button"
        >
          Reset config
        </button>
      </div>
    </section>
  );
}
