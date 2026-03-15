function summarizeMemory(items) {
  if (!items.length) {
    return "No memory recorded.";
  }

  return items
    .slice(-5)
    .map((entry, index) => `${index + 1}. ${entry}`)
    .join("\n");
}

export default function MemoryPanel({ memories }) {
  return (
    <section className="panel">
      <div className="panel-terminal-bar">
        <span>memory.archive</span>
        <span>persistent</span>
      </div>
      <div className="panel-header">
        <h2>Persistent Memory</h2>
        <span className="muted">Saved in localStorage</span>
      </div>

      <div className="memory-grid">
        <article className="memory-card">
          <h3>ARTEMIS</h3>
          <span className="memory-subtitle">offensive adaptation ledger</span>
          <pre>{summarizeMemory(memories.artemis)}</pre>
        </article>
        <article className="memory-card">
          <h3>AEGIS</h3>
          <span className="memory-subtitle">defensive hardening ledger</span>
          <pre>{summarizeMemory(memories.aegis)}</pre>
        </article>
        <article className="memory-card">
          <h3>JUDGE</h3>
          <span className="memory-subtitle">evaluation rationale ledger</span>
          <pre>{summarizeMemory(memories.judge)}</pre>
        </article>
      </div>
    </section>
  );
}
