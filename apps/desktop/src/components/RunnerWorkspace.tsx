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
  sshTroubleshooting: string[];
  onPatchAsset: (patch: Partial<Asset>) => void;
  onPatchCredential: (patch: Partial<Asset["credential"]>) => void;
  onSelectTemplate: (templateId: string) => void;
  onTestSsh: () => void;
  onRefreshInspectionPreview: () => void;
  onOpenAssets: () => void;
  onOpenResults: () => void;
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
  sshTroubleshooting,
  onPatchAsset,
  onPatchCredential,
  onSelectTemplate,
  onTestSsh,
  onRefreshInspectionPreview,
  onOpenAssets,
  onOpenResults,
}: RunnerWorkspaceProps) {
  const connectionReady =
    asset.host.trim().length > 0 &&
    asset.credential.username.trim().length > 0 &&
    asset.credential.secretRef.trim().length > 0;
  const connectionVerified = sshResult?.ok === true;
  const hasPreviewResult = inspectionRun !== null;
  const firstInspectionComplete = connectionVerified && hasPreviewResult;
  const sshFailureMessage = sshResult?.ok === false ? sshResult.message.toLowerCase() : "";
  const showRepairGuide = sshResult?.ok === false && sshTroubleshooting.length > 0;
  const canSwitchToPrivateKey = sshFailureMessage.includes("sshpass") || sshFailureMessage.includes("password");
  const canSwitchToPassword =
    sshFailureMessage.includes("permission denied") ||
    sshFailureMessage.includes("private key") ||
    sshFailureMessage.includes("authorized key");
  const canResetPort = sshFailureMessage.includes("connection refused") && asset.port !== 22;
  const failureLabel =
    sshFailureMessage.includes("permission denied")
      ? "Authentication failed"
      : sshFailureMessage.includes("connection refused")
        ? "Port refused"
        : sshFailureMessage.includes("timed out") || sshFailureMessage.includes("operation timed out")
          ? "Network timeout"
          : sshFailureMessage.includes("could not resolve hostname") || sshFailureMessage.includes("name or service not known")
            ? "Hostname resolution failed"
            : sshFailureMessage.includes("sshpass")
              ? "Local dependency missing"
              : "SSH path needs repair";
  const connectionSummary = `${asset.credential.username || "user"} @ ${asset.host || "host"}:${asset.port}`;
  const nextActionLabel = !connectionReady
    ? "Fill the target fields first"
    : !connectionVerified
      ? "Test SSH now"
      : !hasPreviewResult
        ? "Run the first preview now"
        : "First inspection complete";
  const primaryActionLabel = !connectionReady
    ? "Complete Required Fields"
    : !connectionVerified
      ? isTestingSsh
        ? "Testing SSH..."
        : "Start SSH Test"
      : !hasPreviewResult
        ? isRefreshingPreview
          ? "Running Preview..."
          : "Start Preview Run"
        : "Open Reports";
  const stepSummary = !connectionReady
    ? "Step 1 of 3"
    : !connectionVerified
      ? "Step 2 of 3"
      : !hasPreviewResult
        ? "Step 3 of 3"
        : "Complete";
  const currentStepNumber = !connectionReady ? "1" : !connectionVerified ? "2" : !hasPreviewResult ? "3" : "done";
  const handlePrimaryAction = () => {
    if (!connectionReady) {
      return;
    }

    if (!connectionVerified) {
      onTestSsh();
      return;
    }

    if (!hasPreviewResult) {
      onRefreshInspectionPreview();
      return;
    }

    onOpenResults();
  };
  const primaryActionDisabled = !connectionReady || isTestingSsh || isRefreshingPreview;

  return (
    <section className="run-panel">
      <DesktopSectionHeader
        eyebrow="Inspect"
        title="Run one inspection from start to finish"
        subtitle="Set the target, verify SSH, choose the scope, then read the first result."
        meta={
          <div className="summary-strip">
            <span>{activeChecksCount} checks in current template</span>
          </div>
        }
      />

      <section className={`runner-mission-panel ${firstInspectionComplete ? "runner-mission-panel-done" : ""}`}>
        <div className="runner-mission-copy">
          <p className="eyebrow">Current Task</p>
          <h3>{nextActionLabel}</h3>
          <p className="helper-text">
            {!connectionReady
              ? "Only host, username, and secret are required to begin."
              : !connectionVerified
                ? "Do not run a preview yet. Prove the SSH path from this machine first."
                : !hasPreviewResult
                  ? "SSH is verified. Run one preview and confirm the result is readable."
                  : "The first inspection path is working. You can now save this target or move on to automation."}
          </p>
          <div className="runner-mission-actions">
            <button
              className="primary-button primary-button-large"
              onClick={handlePrimaryAction}
              type="button"
              disabled={primaryActionDisabled}
            >
              {primaryActionLabel}
            </button>
            {firstInspectionComplete ? (
              <button className="secondary-button" onClick={onOpenAssets} type="button">
                Save This Target
              </button>
            ) : null}
          </div>
        </div>
        <div className="runner-mission-status">
          <strong>{stepSummary}</strong>
          <span>{connectionSummary}</span>
          <span>{activeTemplate.name}</span>
        </div>
      </section>

      <section className="runner-step-strip" aria-label="Inspection steps">
        <article className={`runner-step-pill ${!connectionReady ? "runner-step-pill-active" : "runner-step-pill-done"}`}>
          <span className="runner-step-pill-index">1</span>
          <div>
            <strong>Set target</strong>
            <span>{connectionReady ? "Required fields are ready." : "Host, username, and secret come first."}</span>
          </div>
        </article>
        <article className={`runner-step-pill ${connectionReady && !connectionVerified ? "runner-step-pill-active" : connectionVerified ? "runner-step-pill-done" : ""}`}>
          <span className="runner-step-pill-index">2</span>
          <div>
            <strong>Verify SSH</strong>
            <span>{connectionVerified ? "This machine can reach the target." : "Do not run preview before SSH works."}</span>
          </div>
        </article>
        <article className={`runner-step-pill ${connectionVerified && !hasPreviewResult ? "runner-step-pill-active" : hasPreviewResult ? "runner-step-pill-done" : ""}`}>
          <span className="runner-step-pill-index">3</span>
          <div>
            <strong>Read preview</strong>
            <span>{hasPreviewResult ? "A first result is ready below." : "Run one preview and judge the result quality."}</span>
          </div>
        </article>
      </section>

      <div className="workflow-stack">
        <section className="runner-focus-grid">
          <div className="workflow-step-card runner-primary-card">
            <div className="workflow-step-header">
              <div>
                <span className="workflow-step-index">1</span>
                <strong>Set the target</strong>
              </div>
              <span className={`badge badge-${connectionReady ? "pass" : "warning"}`}>
                {connectionReady ? "ready" : "incomplete"}
              </span>
            </div>

            <section className="form-section">
              <div className="form-section-header">
                <strong>Connection basics</strong>
                <span>{connectionSummary}</span>
              </div>
              <div className="target-primary-grid">
                <label>
                  <span>Host</span>
                  <input
                    value={asset.host}
                    onChange={(event) => onPatchAsset({ host: event.target.value })}
                    placeholder="10.0.0.12"
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
                <label className="field-block field-block-inline">
                  <span>{asset.credential.method === "private-key" ? "Private Key Path" : "Password Secret"}</span>
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

              <div className="target-secondary-note">
                <div className="target-secondary-copy">
                  <strong>Optional details</strong>
                  <span>Name, port, and tags help reuse later, but they are not required to prove the first inspection flow.</span>
                </div>
              </div>

              <div className="ssh-grid ssh-grid-secondary">
                <label>
                  <span>Asset Name</span>
                  <input
                    value={asset.name}
                    onChange={(event) => onPatchAsset({ name: event.target.value })}
                    placeholder="opsprobe-demo-host"
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
              <p className={`connection-result ${sshResult.ok ? "result-ok" : "result-error"}`} role="status">
                {sshResult.message}
              </p>
            ) : (
              <p className="helper-text">Fill the host and credential fields, then move to step 2 and test SSH.</p>
            )}

            {showRepairGuide ? (
              <article className="ssh-repair-guide">
                <div className="workflow-step-header">
                  <div>
                    <span className="workflow-step-index">Fix</span>
                    <strong>{failureLabel}</strong>
                  </div>
                  <span className="badge badge-warning">action needed</span>
                </div>

                <div className="summary-strip">
                  <span>{asset.host}:{asset.port}</span>
                  <span>{formatStatusLabel(asset.credential.method)}</span>
                  <span>{asset.credential.username}</span>
                </div>

                <ul className="troubleshooting-list">
                  {sshTroubleshooting.map((action) => (
                    <li key={`runner-ssh-guidance-${action}`}>{action}</li>
                  ))}
                </ul>

                <div className="service-actions">
                  <button className="primary-button" onClick={onTestSsh} type="button">
                    Retry SSH Test
                  </button>
                  {canSwitchToPrivateKey ? (
                    <button
                      className="secondary-button"
                      onClick={() => onPatchCredential({ method: "private-key", secretRef: "" })}
                      type="button"
                    >
                      Switch To Private Key
                    </button>
                  ) : null}
                  {canSwitchToPassword ? (
                    <button
                      className="secondary-button"
                      onClick={() => onPatchCredential({ method: "password", secretRef: "" })}
                      type="button"
                    >
                      Switch To Password
                    </button>
                  ) : null}
                  {canResetPort ? (
                    <button className="secondary-button" onClick={() => onPatchAsset({ port: 22 })} type="button">
                      Reset Port To 22
                    </button>
                  ) : null}
                  <button
                    className="secondary-button"
                    onClick={() => onPatchCredential({ secretRef: "" })}
                    type="button"
                  >
                    Clear Secret
                  </button>
                </div>
              </article>
            ) : null}
          </div>

          <div className="workflow-step-card runner-action-card">
            <div className="workflow-step-header">
              <div>
                <span className="workflow-step-index">2</span>
                <strong>Verify SSH, then run preview</strong>
              </div>
              <span className="badge badge-unknown">step {currentStepNumber}</span>
            </div>

            <div className="runner-checklist" aria-label="First inspection checklist">
              <div className={`runner-checklist-item ${connectionReady ? "runner-checklist-item-done" : ""}`}>
                <strong>1. Target entered</strong>
                <span>{connectionReady ? connectionSummary : "Host, username, and secret still need input."}</span>
              </div>
              <div className={`runner-checklist-item ${connectionVerified ? "runner-checklist-item-done" : ""}`}>
                <strong>2. SSH verified</strong>
                <span>{connectionVerified ? "This machine can reach the target over SSH." : "Run Test SSH Connection before preview."}</span>
              </div>
              <div className={`runner-checklist-item ${hasPreviewResult ? "runner-checklist-item-done" : ""}`}>
                <strong>3. Preview result ready</strong>
                <span>{hasPreviewResult ? "The first preview result is available below." : "Run one preview and verify the findings are readable."}</span>
              </div>
            </div>

            <div className="runner-action-summary">
              <span>{connectionSummary}</span>
              <span>{activeTemplate.name}</span>
              <span>{activeChecksCount} checks</span>
            </div>

            <section className="form-section">
              <div className="form-section-header">
                <strong>Check scope</strong>
                <span>{activeChecksCount} checks</span>
              </div>
              <div className="target-primary-grid">
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
              </div>
              <div className="inline-note">
                <strong>{formatStatusLabel(asset.credential.method)} mode</strong>
                <span>{activeTemplate.description ?? "No template description provided."}</span>
              </div>
            </section>

            <div className="service-actions service-actions-primary runner-action-bar">
              <button className="primary-button primary-button-large" onClick={onTestSsh} type="button" disabled={!connectionReady || isTestingSsh}>
                {isTestingSsh ? "Testing..." : "Test SSH Connection"}
              </button>
              <button
                className="secondary-button"
                onClick={onRefreshInspectionPreview}
                type="button"
                disabled={!connectionVerified || isRefreshingPreview}
              >
                {isRefreshingPreview ? "Running Preview..." : "Run Preview Inspection"}
              </button>
            </div>

            <p className="helper-text">
              {!connectionReady
                ? "Complete the required target fields before you test SSH."
                : !connectionVerified
                  ? "Run the SSH test first. Password mode requires `sshpass` on the local machine."
                  : "SSH is verified. You can run the preview inspection now."}
            </p>
          </div>
        </section>

        <section className="workflow-step-card runner-results-panel">
          <div className="workflow-step-header">
            <div>
              <span className="workflow-step-index">3</span>
              <strong>Read the result first</strong>
            </div>
            <span className="badge badge-unknown">{inspectionRun ? "available" : "waiting"}</span>
          </div>
          <div className="assets-panel-header">
            <strong>Preview result</strong>
            <span>{inspectionRun ? inspectionRun.summary.total : 0} checks</span>
          </div>

          {inspectionRun ? (
            <>
              <div className="runner-step-complete" role="status">
                <strong>Preview ready</strong>
                <span>You now have a readable first result. Review it below before saving or automating anything.</span>
              </div>
              <section className="runner-conclusion-panel">
                <div className="runner-conclusion-copy">
                  <p className="eyebrow">Conclusion First</p>
                  <h3>
                    {inspectionRun.summary.critical > 0
                      ? `${inspectionRun.summary.critical} critical finding${inspectionRun.summary.critical === 1 ? "" : "s"} need attention`
                      : inspectionRun.summary.warning > 0
                        ? `${inspectionRun.summary.warning} warning${inspectionRun.summary.warning === 1 ? "" : "s"} should be reviewed`
                        : "The first preview completed without warnings"}
                  </h3>
                  <p className="helper-text">
                    {inspectionRun.summary.critical > 0
                      ? "Start with the critical items below, then decide whether this target is ready to save for reuse."
                      : inspectionRun.summary.warning > 0
                        ? "The inspection path works. Review the warnings, then either save this target or open the full report view."
                        : "The first inspection path is healthy. Save this target for reuse or open reports if you want to share the result."}
                  </p>
                </div>
                <div className="runner-conclusion-actions">
                  <button className="primary-button" onClick={onOpenAssets} type="button">
                    Save This Target
                  </button>
                  <button className="secondary-button" onClick={onOpenResults} type="button">
                    Open Reports
                  </button>
                </div>
              </section>
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

              <div className="runner-evidence-header">
                <strong>Evidence And Remediation</strong>
                <span>Open these details after you understand the conclusion above.</span>
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
              detail="Run the preview inspection before you save targets, enable automation, or export reports."
            />
          )}
        </section>
      </div>
    </section>
  );
}
