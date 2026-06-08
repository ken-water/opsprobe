interface OverviewWorkspaceProps {
  completedSetupSteps: number;
  totalSetupSteps: number;
  warningCount: number;
  blockingCount: number;
  assetCount: number;
  scheduleCount: number;
  historyCount: number;
  serviceStatus: string;
}

export function OverviewWorkspace({
  completedSetupSteps,
  totalSetupSteps,
  warningCount,
  blockingCount,
  assetCount,
  scheduleCount,
  historyCount,
  serviceStatus,
}: OverviewWorkspaceProps) {
  return (
    <>
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Overview Workspace</p>
          <h1>Local-first infrastructure inspection for SMB teams.</h1>
          <p className="summary">
            Turn host checks, service checks, and remediation guidance into a desktop operator workflow
            instead of a browser-like report page.
          </p>
        </div>

        <div className="dashboard-status-card">
          <span className="status-label">Runtime</span>
          <strong>{serviceStatus}</strong>
          <p>Local desktop runtime, scheduling, and reporting stay on the operator machine.</p>
        </div>
      </section>

      <section className="dashboard-metrics">
        <article className="metric-card">
          <span className="metric-label">Setup Progress</span>
          <strong>{completedSetupSteps}/{totalSetupSteps}</strong>
          <p>Initial desktop environment checks completed.</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Warnings</span>
          <strong>{warningCount}</strong>
          <p>Environment and inspection items needing attention.</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Blocking</span>
          <strong>{blockingCount}</strong>
          <p>Items stopping reliable inspection or reporting.</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Saved Assets</span>
          <strong>{assetCount}</strong>
          <p>Reusable hosts and service targets already captured.</p>
        </article>
      </section>

      <section className="dashboard-layout">
        <article className="card">
          <h2>Operations Snapshot</h2>
          <div className="ops-snapshot-grid">
            <div className="snapshot-tile">
              <span className="snapshot-label">Schedules</span>
              <strong>{scheduleCount}</strong>
            </div>
            <div className="snapshot-tile">
              <span className="snapshot-label">Run History</span>
              <strong>{historyCount}</strong>
            </div>
            <div className="snapshot-tile">
              <span className="snapshot-label">Service State</span>
              <strong>{serviceStatus}</strong>
            </div>
            <div className="snapshot-tile">
              <span className="snapshot-label">Edition</span>
              <strong>Community</strong>
            </div>
          </div>
        </article>

        <article className="card">
          <h2>Current Focus</h2>
          <ul>
            <li>Runtime status includes explicit operator recovery actions.</li>
            <li>Machine migration now surfaces provenance and trust steps.</li>
            <li>Desktop workspace has been split into focused operator modules.</li>
          </ul>
        </article>

        <article className="card support-card">
          <h2>Support OpsProbe</h2>
          <p>If this project saves you time, you can buy me a coffee and help fund the next inspection features.</p>
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
