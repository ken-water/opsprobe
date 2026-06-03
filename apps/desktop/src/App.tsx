import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { builtInLinuxChecks } from "@opsprobe/checks";
import { createLinuxHostTemplate, type Asset, type InspectionRun, type InspectionTask } from "@opsprobe/core";
import {
  MockRunnerAdapter,
  runInspection,
  type SshConnectionTestInput,
  type SshConnectionTestResult,
} from "@opsprobe/runner";
import "./App.css";

const initialAsset: Asset = {
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
    secretRef: "/home/user/.ssh/id_rsa",
  },
  createdAt: "2026-06-03T00:00:00.000Z",
  updatedAt: "2026-06-03T00:00:00.000Z",
};

const template = createLinuxHostTemplate(builtInLinuxChecks);

function App() {
  const [asset, setAsset] = useState<Asset>(initialAsset);
  const [inspectionRun, setInspectionRun] = useState<InspectionRun | null>(null);
  const [sshResult, setSshResult] = useState<SshConnectionTestResult | null>(null);
  const [isTestingSsh, setIsTestingSsh] = useState(false);
  const [isRefreshingPreview, setIsRefreshingPreview] = useState(false);

  const task: InspectionTask = {
    id: "task-manual-001",
    assetId: asset.id,
    templateId: template.id,
    trigger: "manual",
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };

  const sshInput: SshConnectionTestInput = {
    host: asset.host,
    port: asset.port,
    username: asset.credential.username,
    authMethod: asset.credential.method,
    secretRef: asset.credential.secretRef,
  };

  useEffect(() => {
    void refreshInspectionPreview();
  }, []);

  function patchAsset(patch: Partial<Asset>) {
    setAsset((current) => ({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  }

  function patchCredential(patch: Partial<Asset["credential"]>) {
    setAsset((current) => ({
      ...current,
      credential: {
        ...current.credential,
        ...patch,
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  async function refreshInspectionPreview() {
    setIsRefreshingPreview(true);
    const adapter = new MockRunnerAdapter();

    try {
      const run = await runInspection(
        {
          asset,
          task,
          template,
          checks: builtInLinuxChecks,
        },
        adapter,
      );
      setInspectionRun(run);
    } finally {
      setIsRefreshingPreview(false);
    }
  }

  async function handleSshTest() {
    setIsTestingSsh(true);
    setSshResult(null);

    try {
      const result = await invoke<SshConnectionTestResult>("test_ssh_connection", {
        input: sshInput,
      });
      setSshResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "SSH test failed.";
      setSshResult({
        ok: false,
        message,
      });
    } finally {
      setIsTestingSsh(false);
    }
  }

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
            <h2>Linux Host Asset</h2>
          </div>
        </div>

        <div className="ssh-grid">
          <label>
            <span>Asset Name</span>
            <input
              value={asset.name}
              onChange={(event) => patchAsset({ name: event.target.value })}
              placeholder="opsprobe-demo-host"
            />
          </label>

          <label>
            <span>Host</span>
            <input
              value={asset.host}
              onChange={(event) => patchAsset({ host: event.target.value })}
              placeholder="10.0.0.12"
            />
          </label>

          <label>
            <span>Port</span>
            <input
              type="number"
              value={asset.port}
              onChange={(event) => patchAsset({ port: Number(event.target.value) || 22 })}
              placeholder="22"
            />
          </label>

          <label>
            <span>Username</span>
            <input
              value={asset.credential.username}
              onChange={(event) => patchCredential({ username: event.target.value })}
              placeholder="root"
            />
          </label>

          <label>
            <span>Auth Method</span>
            <select
              value={asset.credential.method}
              onChange={(event) =>
                patchCredential({
                  method: event.target.value as SshConnectionTestInput["authMethod"],
                })
              }
            >
              <option value="private-key">private-key</option>
              <option value="password">password</option>
            </select>
          </label>

          <label>
            <span>Tags</span>
            <input
              value={asset.tags.join(", ")}
              onChange={(event) =>
                patchAsset({
                  tags: event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                })
              }
              placeholder="demo, linux"
            />
          </label>
        </div>

        <label className="field-block">
          <span>
            {asset.credential.method === "private-key" ? "Private Key Path" : "Password Secret"}
          </span>
          <input
            value={asset.credential.secretRef}
            onChange={(event) => patchCredential({ secretRef: event.target.value })}
            placeholder={
              asset.credential.method === "private-key"
                ? "/home/user/.ssh/id_rsa"
                : "Password mode will be added after the first SSH workflow lands."
            }
          />
        </label>

        <div className="ssh-actions">
          <button className="primary-button" onClick={() => void handleSshTest()} type="button">
            {isTestingSsh ? "Testing..." : "Test SSH Connection"}
          </button>
          <button
            className="secondary-button"
            onClick={() => void refreshInspectionPreview()}
            type="button"
          >
            {isRefreshingPreview ? "Refreshing..." : "Refresh Inspection Preview"}
          </button>
          <p className="helper-text">
            Asset fields are shared by the SSH test and the inspection runner preview.
          </p>
        </div>

        {sshResult ? (
          <p className={`connection-result ${sshResult.ok ? "result-ok" : "result-error"}`}>
            {sshResult.message}
          </p>
        ) : null}
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
          <strong>{asset.name}</strong>
          <span>
            {asset.host}:{asset.port}
          </span>
          <span>{template.name}</span>
          <span>{asset.tags.join(", ") || "no tags"}</span>
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
