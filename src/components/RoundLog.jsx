function extractDisplayValue(entry, preferredKey) {
  return entry?.[preferredKey] || entry?.raw || "No data.";
}

export default function RoundLog({ rounds }) {
  return (
    <section className="panel">
      <div className="panel-terminal-bar">
        <span>round.trace</span>
        <span>reverse-chronological</span>
      </div>
      <div className="panel-header">
        <h2>Round Log</h2>
        <span className="muted">Attack / defense / judgment packets</span>
      </div>

      <div className="round-log">
        {rounds.length === 0 ? (
          <article className="round-card empty-card">
            <p>No rounds executed yet.</p>
          </article>
        ) : (
          rounds
            .slice()
            .reverse()
            .map((round) => (
              <article className="round-card" key={round.timestamp}>
                <header>
                  <div>
                    <strong className="round-title">Round {round.round}</strong>
                    <p className="round-meta">{round.timestamp}</p>
                  </div>
                  <span className="round-winner">{round.evaluation?.winner || "Unknown"}</span>
                </header>

                <section className="round-section attack-section">
                  <h4>Attack</h4>
                  <p>{extractDisplayValue(round.attack, "attack")}</p>
                </section>

                <section className="round-section defense-section">
                  <h4>Defense</h4>
                  <p>{extractDisplayValue(round.defense, "defense")}</p>
                </section>

                <section className="round-section judgment-section">
                  <h4>Judgment</h4>
                  <p>{extractDisplayValue(round.evaluation, "reasoning")}</p>
                </section>
              </article>
            ))
        )}
      </div>
    </section>
  );
}
