import type { Asset, InspectionRun } from "@opsprobe/core";
import type { SshConnectionTestInput, SshConnectionTestResult } from "@opsprobe/runner";
import { DesktopEmptyState, DesktopSectionHeader, formatStatusLabel } from "./DesktopUI";

interface TemplateOption {
  id: string;
  name: string;
}

interface RunnerWorkspaceProps {
  asset: Asset;
  builtInTemplates: TemplateOption[];
  selectedTemplateId: string;
  activeTemplate: { name: string; description?: string };
  activeChecksCount: number;
  inspectionRun: InspectionRun | null;
  isTestingSsh: boolean;
  isRefreshingPreview: boolean;
  sshResult: SshConnectionTestResult | null;
  onPatchAsset: (patch: Partial<Asset>) => void;
  onPatchCredential: (patch: Partial<Asset["credential"]>) => void;
  onSelectTemplate: (templateId: string) => void;
  onTestSsh: () => void;
  onRefreshInspectionPreview: () => void;
}

export function RunnerWorkspace({
  asset,
  builtInTemplates,
  selectedTemplateId,
  activeTemplate,
  activeChecksCount,
  inspectionRun,
  isTestingSsh,
  isRefreshingPreview,
  sshResult,
  onPatchAsset,
  onPatchCredential,
  onSelectTemplate,
  onTestSsh,
  onRefreshInspectionPreview,
}: RunnerWorkspaceProps) {
  const connectionReady =
    asset.host.trim().length > 0 &&
    asset.credential.username.trim().length > 0 &&
    asset.credential.secretRef.trim().length > 0;

  return (
    <section className="run-panel">
      <DesktopSectionHeader
        eyebrow="Inspection Flow"
        title="Start Inspection"
        subtitle="Validate SSH access, choose the template, and preview normalized check output before running repeatable inspections."
        meta={
          <div className="summary-strip">
            <span>{activeChecksCount} checks in current template</span>
          </div>
        }
      />

      <div className="workflow-stack">
        <section className="workflow-step-card">
          <div className="workflow-step-header">
            <div>
              <span className="workflow-step-index">Step 1</span>
              <strong>Target And Access</strong>
            </div>
            <span className={`badge badge-${connectionReady ? "pass" : "warning"}`}>
              {connectionReady ? "ready" : "incomplete"}
            </span>
          </div>

          <section className="form-section">
            <div className="form-section-header">
              <strong>Connection Target</strong>
              <span>{asset.host}:{asset.port}</span>
            </div>
            <div className="ssh-grid">
              <label>
                <span>Asset Name</span>
                <input
                  value={asset.name}
                  onChange={(event) => onPatchAsset({ name: event.target.value })}
                  placeholder="opsprobe-demo-host"
                />
              </label>
              <label>
                <span>Host</span>
                <input
                  value={asset.host}
                  onChange={(event) => onPatchAsset({ host: event.target.value })}
                  placeholder="10.0.0.12"
                />
              </label>
              <label>
                <span>Port</span>
                <input
                  type="number"
                  value={asset.port}
                  onChange={(event) => onPatchAsset({ port: Number(event.target.value) || 22 })}
                  placeholder="22"
                />
              </label>
              <label>
                <span>Username</span>
                <input
                  value={asset.credential.username}
                  onChange={(event) => onPatchCredential({ username: event.target.value })}
                  placeholder="root"
                />
              </label>
              <label>
                <span>Auth Method</span>
                <select
                  value={asset.credential.method}
                  onChange={(event) =>
                    onPatchCredential({
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
                    onPatchAsset({
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
          </section>

          {sshResult ? (
            <p className={`connection-result ${sshResult.ok ? "result-ok" : "result-error"}`}>
              {sshResult.message}
            </p>
          ) : (
            <p className="helper-text">Fill the target and credential fields, then verify the SSH path before previewing checks.</p>
          )}
        </section>

        <section className="workflow-step-card">
          <div className="workflow-step-header">
            <div>
              <span className="workflow-step-index">Step 2</span>
              <strong>Template And Preview</strong>
            </div>
            <span className="badge badge-unknown">{activeChecksCount} checks</span>
          </div>

          <section className="form-section">
            <div className="form-section-header">
              <strong>Check Scope</strong>
              <span>{activeChecksCount} checks</span>
            </div>
            <div className="ssh-grid">
              <label>
                <span>Inspection Template</span>
                <select
                  value={selectedTemplateId}
                  onChange={(event) => onSelectTemplate(event.target.value)}
                >
                  {builtInTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-block field-block-inline">
                <span>
                  {asset.credential.method === "private-key" ? "Private Key Path" : "Password Secret"}
                </span>
                <input
                  type={asset.credential.method === "password" ? "password" : "text"}
                  value={asset.credential.secretRef}
                  onChange={(event) => onPatchCredential({ secretRef: event.target.value })}
                  placeholder={
                    asset.credential.method === "private-key"
                      ? "/home/user/.ssh/id_rsa"
                      : "Enter the SSH password used for this host."
                  }
                />
              </label>
            </div>
            <div className="inline-note">
              <strong>{formatStatusLabel(asset.credential.method)} mode</strong>
              <span>{activeTemplate.description ?? "No template description provided."}</span>
            </div>
          </section>

          <div className="service-actions">
            <button className="primary-button" onClick={onTestSsh} type="button">
              {isTestingSsh ? "Testing..." : "Test SSH Connection"}
            </button>
            <button className="secondary-button" onClick={onRefreshInspectionPreview} type="button">
              {isRefreshingPreview ? "Refreshing..." : "Preview Inspection Results"}
            </button>
          </div>

          <p className="helper-text">
            Asset fields are shared by the SSH test and inspection preview. Password mode requires `sshpass` on the local machine.
          </p>
        </section>

        <section className="workflow-step-card runner-results-panel">
          <div className="workflow-step-header">
            <div>
              <span className="workflow-step-index">Step 3</span>
              <strong>Preview Output</strong>
            </div>
            <span className="badge badge-unknown">{inspectionRun ? "available" : "waiting"}</span>
          </div>
          <div className="assets-panel-header">
            <strong>Inspection Preview</strong>
            <span>{inspectionRun ? inspectionRun.summary.total : 0} checks</span>
          </div>

          {inspectionRun ? (
            <>
              <div className="summary-strip">
                <span>Total {inspectionRun.summary.total}</span>
                <span>Pass {inspectionRun.summary.passed}</span>
                <span>Warn {inspectionRun.summary.warning}</span>
                <span>Critical {inspectionRun.summary.critical}</span>
              </div>

              <div className="asset-banner">
                <strong>{asset.name}</strong>
                <span>{asset.host}:{asset.port}</span>
                <span>{activeTemplate.name}</span>
                <span>{asset.tags.join(", ") || "No tags"}</span>
              </div>

              <div className="results-list">
                {inspectionRun.results.map((result) => (
                  <article className="result-card" key={result.checkId}>
                    <div className="result-header">
                      <div>
                        <h3>{result.title}</h3>
                        <p>{result.summary}</p>
                      </div>
                      <span className={`badge badge-${result.status}`}>{formatStatusLabel(result.status)}</span>
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
            </>
          ) : (
            <DesktopEmptyState
              title="No Preview Yet"
              detail="Run a manual preview to inspect normalized results before handing execution to the local service."
            />
          )}
        </section>
      </div>
    </section>
  );
}
