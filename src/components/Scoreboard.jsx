export default function Scoreboard({ scores, roundCount, rounds, winnerBanner, biasBanner }) {
  return (
    <section className="panel scoreboard-panel">
      <div className="panel-terminal-bar">
        <span>score.kernel</span>
        <span>{roundCount}/{rounds}</span>
      </div>
      <div className="panel-header">
        <h2>Scoreboard</h2>
        <span className="muted">Round pressure map</span>
      </div>

      <div className="score-grid">
        <article className="score-card attacker-card">
          <span>ARTEMIS</span>
          <strong>{scores.attacker}</strong>
        </article>
        <article className="score-card defender-card">
          <span>AEGIS</span>
          <strong>{scores.defender}</strong>
        </article>
        <article className="score-card draw-card">
          <span>Draws</span>
          <strong>{scores.draw}</strong>
        </article>
      </div>

      <div className="score-details">
        <p className="primary-readout">{winnerBanner}</p>
        <p className="muted scanline-copy">{biasBanner}</p>
      </div>
    </section>
  );
}
