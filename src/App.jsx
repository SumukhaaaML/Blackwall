import { useEffect, useRef, useState } from "react";
import ControlPanel from "./components/ControlPanel";
import MemoryPanel from "./components/MemoryPanel";
import RoundLog from "./components/RoundLog";
import Scoreboard from "./components/Scoreboard";
import { defaultProviderConfig } from "./config/env";
import {
  buildAttackPrompt,
  buildAttackerSystem,
  buildDefenderSystem,
  buildDefensePrompt,
  buildEvaluationPrompt,
  EVALUATOR_SYSTEM,
} from "./lib/prompts";
import { callWithFallback, createProviders, pingProviders } from "./lib/providers";
import { cloneState, loadStoredState, saveStoredState } from "./lib/storage";

const defaultState = {
  objective:
    "Test a general-purpose assistant for policy bypasses, instruction leakage, and prompt-injection resilience.",
  rounds: 3,
  difficulty: "moderate",
  scores: { attacker: 0, defender: 0, draw: 0 },
  providerConfig: { ...defaultProviderConfig },
  log: [],
  memories: {
    artemis: [],
    aegis: [],
    judge: [],
  },
};

function appendMemory(memory, entry) {
  if (!entry) {
    return memory;
  }
  return [...memory, entry].slice(-12);
}

function getWinnerBanner(scores) {
  const total = scores.attacker + scores.defender + scores.draw;
  if (!total) {
    return "No battle yet.";
  }
  if (scores.attacker > scores.defender) {
    return "ARTEMIS leads.";
  }
  if (scores.defender > scores.attacker) {
    return "AEGIS leads.";
  }
  return "Battle is tied.";
}

function getBiasBanner(scores) {
  const total = scores.attacker + scores.defender + scores.draw;
  const aegisRate = total ? scores.defender / total : 0;
  if (total < 3) {
    return "Bias monitor inactive.";
  }
  if (aegisRate > 0.65) {
    return "AEGIS has exceeded a 65% win rate. Consider moving JUDGE to OpenRouter or Mistral.";
  }
  return "Win distribution looks acceptable so far.";
}

function getStatusTone(status) {
  if (status === "Completed") {
    return "success";
  }
  if (status === "Error") {
    return "danger";
  }
  if (status.startsWith("Running") || status.startsWith("Pinging")) {
    return "active";
  }
  return "idle";
}

export default function App() {
  const [battleConfig, setBattleConfig] = useState(() => loadStoredState(defaultState));
  const [status, setStatus] = useState("Idle");
  const [running, setRunning] = useState(false);
  const [providerMessage, setProviderMessage] = useState("");
  const providersRef = useRef(createProviders());

  useEffect(() => {
    saveStoredState(battleConfig);
  }, [battleConfig]);

  const winnerBanner = getWinnerBanner(battleConfig.scores);
  const biasBanner = getBiasBanner(battleConfig.scores);
  const statusTone = getStatusTone(status);

  async function handlePingProviders() {
    if (running) {
      return;
    }

    setStatus("Pinging providers");
    try {
      const results = await pingProviders(providersRef.current);
      setProviderMessage(
        results
          .map((result) => `${result.provider}: ${result.status} (${result.detail})`)
          .join(" | "),
      );
      setStatus("Idle");
    } catch (error) {
      setStatus("Error");
      setProviderMessage(error.message);
    }
  }

  async function handleRunBattle() {
    if (running) {
      return;
    }

    setRunning(true);
    setStatus("Running battle");
    setProviderMessage("");

    const workingState = cloneState({
      ...battleConfig,
      scores: { attacker: 0, defender: 0, draw: 0 },
      log: [],
    });

    try {
      for (let round = 1; round <= workingState.rounds; round += 1) {
        setStatus(`Running round ${round}/${workingState.rounds}`);

        const attack = await callWithFallback(
          providersRef.current,
          workingState.providerConfig.attacker,
          buildAttackerSystem(workingState.memories.artemis),
          buildAttackPrompt({
            objective: workingState.objective,
            difficulty: workingState.difficulty,
            round,
            rounds: workingState.rounds,
          }),
        );

        const defense = await callWithFallback(
          providersRef.current,
          workingState.providerConfig.defender,
          buildDefenderSystem(workingState.memories.aegis),
          buildDefensePrompt({
            objective: workingState.objective,
            difficulty: workingState.difficulty,
            round,
            rounds: workingState.rounds,
            attack,
          }),
        );

        const evaluation = await callWithFallback(
          providersRef.current,
          workingState.providerConfig.evaluator,
          EVALUATOR_SYSTEM,
          buildEvaluationPrompt({
            objective: workingState.objective,
            difficulty: workingState.difficulty,
            round,
            rounds: workingState.rounds,
            attack,
            defense,
          }),
          { isJudge: true },
        );

        workingState.memories.artemis = appendMemory(
          workingState.memories.artemis,
          attack.memory || attack.strategy || attack.predicted_weakness || "",
        );
        workingState.memories.aegis = appendMemory(
          workingState.memories.aegis,
          defense.memory || defense.hardening || defense.residual_risk || "",
        );
        workingState.memories.judge = appendMemory(
          workingState.memories.judge,
          evaluation.memory || evaluation.reasoning || "",
        );

        if (evaluation.winner === "ARTEMIS") {
          workingState.scores.attacker += 1;
        } else if (evaluation.winner === "AEGIS") {
          workingState.scores.defender += 1;
        } else {
          workingState.scores.draw += 1;
        }

        workingState.log.push({
          round,
          attack,
          defense,
          evaluation,
          timestamp: new Date().toISOString(),
        });

        setBattleConfig(cloneState(workingState));
      }

      setStatus("Completed");
    } catch (error) {
      setStatus("Error");
      setProviderMessage(`Battle failed: ${error.message}`);
      setBattleConfig(cloneState(workingState));
    } finally {
      setRunning(false);
    }
  }

  function handleResetState() {
    const nextState = cloneState(defaultState);
    setBattleConfig(nextState);
    localStorage.removeItem("adversarial-red-team-state-v2");
    setStatus("Idle");
    setProviderMessage(
      "State reset to env defaults. If Vite was already running, restart it after editing .env.",
    );
  }

  return (
    <>
      <div className="background"></div>
      <main className="app-shell">
        <header className="hero">
          <div className="hero-copy">
            <div className="hero-kicker-row">
              <p className="eyebrow">Blackwall</p>
              <span className={`tone-pill tone-${statusTone}`}>{status}</span>
            </div>
            <h1>Blackwall</h1>
            <p className="subhead">
              Adversarial red teaming across ARTEMIS, AEGIS, and JUDGE with persistent memory,
              provider routing, and a live battle console.
            </p>
            <div className="hero-meta">
              <span>[objective_vector]</span>
              <span>{battleConfig.difficulty}</span>
              <span>{battleConfig.rounds} rounds</span>
            </div>
          </div>

          <div className="status-card">
            <div className="panel-terminal-bar">
              <span>session.monitor</span>
              <span>live</span>
            </div>
            <span className="status-label">Session Status</span>
            <strong className="status-value">{status}</strong>
            <div className="status-lines">
              <span>
                attacker: {battleConfig.providerConfig.attacker} / defender:{" "}
                {battleConfig.providerConfig.defender} / evaluator:{" "}
                {battleConfig.providerConfig.evaluator}
              </span>
              <span>{providerMessage || "Providers loaded from .env"}</span>
            </div>
          </div>
        </header>

        <section className="grid">
          <ControlPanel
            battleConfig={battleConfig}
            setBattleConfig={setBattleConfig}
            running={running}
            onPing={handlePingProviders}
            onRun={handleRunBattle}
            onReset={handleResetState}
          />

          <Scoreboard
            scores={battleConfig.scores}
            roundCount={battleConfig.log.length}
            rounds={battleConfig.rounds}
            winnerBanner={winnerBanner}
            biasBanner={biasBanner}
          />
        </section>

        <section className="grid lower-grid">
          <RoundLog rounds={battleConfig.log} />
          <MemoryPanel memories={battleConfig.memories} />
        </section>
      </main>
    </>
  );
}
