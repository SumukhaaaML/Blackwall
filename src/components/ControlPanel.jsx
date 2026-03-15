import { providerOptions } from "../config/env";

function ProviderSelect({ id, label, value, onChange, disabled }) {
  return (
    <label>
      {label}
      <select id={id} value={value} onChange={onChange} disabled={disabled}>
        {providerOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ControlPanel({
  battleConfig,
  setBattleConfig,
  running,
  onPing,
  onRun,
  onReset,
}) {
  return (
    <section className="panel config-panel">
      <div className="panel-terminal-bar">
        <span>control.matrix</span>
        <span>{running ? "locked" : "interactive"}</span>
      </div>
      <div className="panel-header">
        <h2>Battle Setup</h2>
        <button className="ghost-button" type="button" onClick={onReset}>
          Reset State
        </button>
      </div>
      <p className="muted">
        Provider defaults come from <code>.env</code>. Use Reset State to reload them after
        changing defaults.
      </p>

      <label>
        Objective
        <textarea
          rows="5"
          value={battleConfig.objective}
          onChange={(event) =>
            setBattleConfig((current) => ({ ...current, objective: event.target.value }))
          }
          placeholder="Describe the target system or policy boundary to test."
        />
      </label>

      <div className="two-column">
        <label>
          Rounds
          <input
            type="number"
            min="1"
            max="12"
            value={battleConfig.rounds}
            onChange={(event) =>
              setBattleConfig((current) => ({
                ...current,
                rounds: Number(event.target.value) || 1,
              }))
            }
          />
        </label>

        <label>
          Difficulty
          <select
            value={battleConfig.difficulty}
            onChange={(event) =>
              setBattleConfig((current) => ({ ...current, difficulty: event.target.value }))
            }
          >
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
            <option value="extreme">Extreme</option>
          </select>
        </label>
      </div>

      <div className="provider-grid">
        <ProviderSelect
          id="attacker-provider"
          label="Attacker"
          value={battleConfig.providerConfig.attacker}
          disabled={running}
          onChange={(event) =>
            setBattleConfig((current) => ({
              ...current,
              providerConfig: { ...current.providerConfig, attacker: event.target.value },
            }))
          }
        />
        <ProviderSelect
          id="defender-provider"
          label="Defender"
          value={battleConfig.providerConfig.defender}
          disabled={running}
          onChange={(event) =>
            setBattleConfig((current) => ({
              ...current,
              providerConfig: { ...current.providerConfig, defender: event.target.value },
            }))
          }
        />
        <ProviderSelect
          id="evaluator-provider"
          label="Evaluator"
          value={battleConfig.providerConfig.evaluator}
          disabled={running}
          onChange={(event) =>
            setBattleConfig((current) => ({
              ...current,
              providerConfig: { ...current.providerConfig, evaluator: event.target.value },
            }))
          }
        />
      </div>

      <details className="env-panel">
        <summary>Environment Configuration</summary>
        <div className="env-copy">
          <p>
            API keys and model overrides are now read from <code>.env</code>. Update the file and
            restart Vite after changes.
          </p>
          <pre>{`VITE_GROQ_API_KEY=...
VITE_GOOGLE_API_KEY=...
VITE_OPENROUTER_API_KEY=...
VITE_DEFAULT_ATTACKER=groq
VITE_DEFAULT_DEFENDER=gemini
VITE_DEFAULT_EVALUATOR=gemini`}</pre>
        </div>
      </details>

      <div className="action-row">
        <button type="button" onClick={onPing} disabled={running}>
          Ping Providers
        </button>
        <button className="primary-button" type="button" onClick={onRun} disabled={running}>
          Run Battle
        </button>
      </div>
    </section>
  );
}
