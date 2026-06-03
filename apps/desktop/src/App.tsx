import { useEffect, useState } from "react";
import { builtInLinuxChecks } from "@opsprobe/checks";
import { createLinuxHostTemplate, type Asset, type InspectionRun, type InspectionTask } from "@opsprobe/core";
import { MockRunnerAdapter, runInspection } from "@opsprobe/runner";
import "./App.css";

const sampleAsset: Asset = {
  id: "asset-linux-001",
  name: "opsprobe-demo-host",
  kind: "linux-host",
  protocol: "ssh",
  host: "10.0.0.12",
  port: 22,
  tags: ["demo", "linux"],
  credential: {
    method: "private-key",
    username: "root",
    secretRef: "local://secrets/demo-root-key",
  },
  createdAt: "2026-06-03T00:00:00.000Z",
  updatedAt: "2026-06-03T00:00:00.000Z",
};

const template = createLinuxHostTemplate(builtInLinuxChecks);

const task: InspectionTask = {
  id: "task-manual-001",
  assetId: sampleAsset.id,
  templateId: template.id,
  trigger: "manual",
  createdAt: "2026-06-03T00:00:00.000Z",
  updatedAt: "2026-06-03T00:00:00.000Z",
};

function App() {
  const [inspectionRun, setInspectionRun] = useState<InspectionRun | null>(null);

  useEffect(() => {
    const adapter = new MockRunnerAdapter();

    void runInspection(
      {
        asset: sampleAsset,
        task,
        template,
        checks: builtInLinuxChecks,
      },
      adapter,
    ).then(setInspectionRun);
  }, []);

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">OpsProbe Open Source Edition</p>
        <h1>Local-first infrastructure inspection for SMB teams.</h1>
        <p className="summary">
          `0.2.0` is now wired around shared inspection models, a check contract,
          and a reusable runner skeleton. The desktop view below is consuming the
          same packages future SSH execution will use.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Current Focus</h2>
          <ul>
            <li>Shared domain models in `@opsprobe/core`</li>
            <li>Reusable check interface in `@opsprobe/checks`</li>
            <li>Runner skeleton in `@opsprobe/runner`</li>
          </ul>
        </article>

        <article className="card">
          <h2>Next Milestone</h2>
          <p className="version">v0.2.0</p>
          <ul>
            <li>Real SSH connection testing</li>
            <li>Linux host check execution</li>
            <li>Result normalization for local reports</li>
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

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.2.0 Preview</p>
            <h2>Inspection Runner Output</h2>
          </div>
          {inspectionRun ? (
            <div className="summary-strip">
              <span>Total {inspectionRun.summary.total}</span>
              <span>Pass {inspectionRun.summary.passed}</span>
              <span>Warn {inspectionRun.summary.warning}</span>
              <span>Critical {inspectionRun.summary.critical}</span>
            </div>
          ) : null}
        </div>

        <div className="asset-banner">
          <strong>{sampleAsset.name}</strong>
          <span>{sampleAsset.host}:{sampleAsset.port}</span>
          <span>{template.name}</span>
        </div>

        <div className="results-list">
          {inspectionRun?.results.map((result) => (
            <article className="result-card" key={result.checkId}>
              <div className="result-header">
                <div>
                  <h3>{result.title}</h3>
                  <p>{result.summary}</p>
                </div>
                <span className={`badge badge-${result.status}`}>{result.status}</span>
              </div>

              <ul className="evidence-list">
                {result.evidence.map((item) => (
                  <li key={`${result.checkId}-${item.label}`}>
                    <strong>{item.label}:</strong> {item.value}
                  </li>
                ))}
              </ul>

              <p className="remediation">
                <strong>Remediation:</strong> {result.remediation}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
