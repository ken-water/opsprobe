import "./App.css";

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">OpsProbe Open Source Edition</p>
        <h1>Local-first infrastructure inspection for SMB teams.</h1>
        <p className="summary">
          The `0.1.0` release establishes the desktop foundation for automated
          Linux host inspections, local reporting, and reusable inspection
          modules.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Current Focus</h2>
          <ul>
            <li>Tauri desktop shell</li>
            <li>Workspace and package layout</li>
            <li>MVP scope and release planning</li>
          </ul>
        </article>

        <article className="card">
          <h2>Next Milestone</h2>
          <p className="version">v0.2.0</p>
          <ul>
            <li>SSH connection test</li>
            <li>Inspection runner skeleton</li>
            <li>Built-in Linux host checks</li>
          </ul>
        </article>

        <article className="card">
          <h2>Architecture Modules</h2>
          <ul>
            <li>@opsprobe/core</li>
            <li>@opsprobe/runner</li>
            <li>@opsprobe/checks</li>
            <li>@opsprobe/report</li>
          </ul>
        </article>

        <article className="card support-card">
          <h2>Support OpsProbe</h2>
          <p>
            If this project saves you time, you can buy me a coffee and help fund
            the next inspection features.
          </p>
          <a
            className="support-link"
            href="https://github.com/sponsors/ken-water"
            target="_blank"
            rel="noreferrer"
          >
            Buy Me a Coffee
          </a>
        </article>
      </section>
    </main>
  );
}

export default App;
