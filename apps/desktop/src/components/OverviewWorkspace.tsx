export function OverviewWorkspace() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">OpsProbe Open Source Edition</p>
        <h1>Local-first infrastructure inspection for SMB teams.</h1>
        <p className="summary">
          `0.10.3` completes the pre-stable hardening line by making runtime recovery,
          restart behavior, and machine replacement trust more explicit.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Current Focus</h2>
          <ul>
            <li>Runtime status now includes explicit operator recovery actions</li>
            <li>Machine-move imports now report provenance and post-import trust steps</li>
            <li>Fourth `0.10.x` pre-stable hardening release</li>
          </ul>
        </article>

        <article className="card">
          <h2>Current Release</h2>
          <p className="version">v0.10.3</p>
          <ul>
            <li>Local service restart guidance is now explicit and testable</li>
            <li>Migration imports now surface source-machine and rebind trust signals</li>
            <li>Fourth `0.10.x` pre-stable hardening release</li>
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
    </>
  );
}
