import type { InspectionRun } from "@opsprobe/core";
import { DesktopSectionHeader, formatDateTime } from "./DesktopUI";

interface InspectionHubWorkspaceProps {
  runtimeStatus: string;
  runtimeSummary: string;
  completedSetupSteps: number;
  totalSetupSteps: number;
  warningCount: number;
  blockingCount: number;
  assetCount: number;
  scheduleCount: number;
  historyCount: number;
  selectedTemplateName: string;
  latestRun: InspectionRun | null;
  showingDemoExperience: boolean;
  onStartInspection: () => void;
  onOpenAssets: () => void;
  onOpenResults: () => void;
  onOpenSettings: () => void;
}

export function InspectionHubWorkspace({
  runtimeStatus,
  runtimeSummary,
  completedSetupSteps,
  totalSetupSteps,
  warningCount,
  blockingCount,
  assetCount,
  scheduleCount,
  historyCount,
  selectedTemplateName,
  latestRun,
  showingDemoExperience,
  onStartInspection,
  onOpenAssets,
  onOpenResults,
  onOpenSettings,
}: InspectionHubWorkspaceProps) {
  const readyForInspection = completedSetupSteps === totalSetupSteps && blockingCount === 0;
  const needsSystemRepair = blockingCount > 0;
  const primaryActionLabel = readyForInspection
    ? "Open Inspect"
    : needsSystemRepair
      ? "Open System"
      : "Open Inspect Setup";
  const primaryAction = readyForInspection ? onStartInspection : needsSystemRepair ? onOpenSettings : onOpenAssets;
  const secondaryAction = readyForInspection
    ? { label: "Open Latest Result", onClick: onOpenResults }
    : needsSystemRepair
      ? { label: "Open Inspect Setup", onClick: onOpenAssets }
      : null;
  const focusTitle = readyForInspection
    ? "Do the first real inspection now"
    : needsSystemRepair
      ? "Fix the local machine first"
      : "Finish the first real setup path";
  const focusDetail = readyForInspection
    ? "Do not start with schedules or exports. Open Inspect, test SSH, and make one preview succeed."
    : needsSystemRepair
      ? "OpsProbe found blocking local problems. Open System, repair the runtime, then come back here."
      : "The runtime looks healthy, but you still need to save a real target or finish the first setup step before this workspace is truly ready.";

  return (
    <>
      <section className="hub-hero">
        <div className="hub-hero-main">
          <p className="eyebrow">Start Here</p>
          <h1>{focusTitle}</h1>
          <p className="summary">
            {focusDetail}
          </p>
          <div className={`hub-launch-banner ${readyForInspection ? "hub-launch-banner-ready" : "hub-launch-banner-attention"}`}>
            <strong>
              {readyForInspection
                ? "Ready for a first real inspection"
                : needsSystemRepair
                  ? "This machine still needs setup attention"
                  : "The runtime is healthy, but the first real setup is not finished"}
            </strong>
            <span>{runtimeSummary}</span>
          </div>
          <div className="hub-actions">
            <button
              className="primary-button primary-button-large"
              onClick={primaryAction}
              type="button"
            >
              {primaryActionLabel}
            </button>
            {secondaryAction ? (
              <button className="secondary-button" onClick={secondaryAction.onClick} type="button">
                {secondaryAction.label}
              </button>
            ) : null}
          </div>
        </div>

        <div className="hub-hero-side">
          <article className="hub-side-card">
            <span className="status-label">What To Ignore For Now</span>
            <strong>Do not start with reports or schedules</strong>
            <p>Those only matter after one host is reachable, one preview is correct, and one run result is readable.</p>
          </article>
          <article className="hub-side-card">
            <span className="status-label">Current Context</span>
            <strong>{showingDemoExperience ? "Demo workspace" : "Real workspace"}</strong>
            <p>{showingDemoExperience ? "Demo data is active for safe exploration before connecting real hosts." : `Current inspection scope: ${selectedTemplateName}.`}</p>
          </article>
        </div>
      </section>

      <section className="hub-guided-strip" aria-label="Operator path">
        <button className="guided-step-card guided-step-card-active" onClick={primaryAction} type="button">
          <span className="guided-step-index">1</span>
          <strong>{readyForInspection ? "Open Inspect" : needsSystemRepair ? "Open System" : "Open Inspect Setup"}</strong>
          <span>
            {readyForInspection
              ? "Go to the target, SSH, and preview workflow."
              : needsSystemRepair
                ? runtimeSummary
                : "Enter one real target before spending more time elsewhere."}
          </span>
        </button>
        <button className="guided-step-card" onClick={onOpenAssets} type="button">
          <span className="guided-step-index">2</span>
          <strong>Save the target</strong>
          <span>Only save or reuse targets after the first preview looks right.</span>
        </button>
        <button className="guided-step-card" onClick={onOpenResults} type="button">
          <span className="guided-step-index">3</span>
          <strong>Read the result</strong>
          <span>Read the latest finding, then export only if the result is worth sharing.</span>
        </button>
      </section>

      <section className="hub-grid">
        <article className="hub-card hub-card-emphasis">
          <DesktopSectionHeader
            eyebrow="Step 1"
            title="Check if this machine is usable"
            subtitle="Only the local facts that matter before you try one real inspection."
          />
          <div className="hub-readiness-grid">
            <div className="snapshot-tile">
              <span className="snapshot-label">Setup</span>
              <strong>{completedSetupSteps}/{totalSetupSteps}</strong>
            </div>
            <div className="snapshot-tile">
              <span className="snapshot-label">Runtime</span>
              <strong>{runtimeStatus}</strong>
            </div>
            <div className="snapshot-tile">
              <span className="snapshot-label">Warnings</span>
              <strong>{warningCount}</strong>
            </div>
            <div className="snapshot-tile">
              <span className="snapshot-label">Blocking</span>
              <strong>{blockingCount}</strong>
            </div>
          </div>
        </article>

        <article className="hub-card">
          <DesktopSectionHeader
            eyebrow="Step 2"
            title="Know whether this workspace is still empty"
            subtitle="If these numbers are zero, stop exploring and create the first working path."
          />
          <div className="hub-kpi-list">
            <div><span>Saved assets</span><strong>{assetCount}</strong></div>
            <div><span>Schedules</span><strong>{scheduleCount}</strong></div>
            <div><span>Run history</span><strong>{historyCount}</strong></div>
          </div>
        </article>

        <article className="hub-card">
          <DesktopSectionHeader
            eyebrow="Step 3"
            title={latestRun ? latestRun.id : "No inspection run yet"}
            subtitle={
              latestRun
                ? `Latest run created at ${formatDateTime(latestRun.createdAt)}.`
                : "No result exists yet. Do not spend time in Reports before one real run succeeds."
            }
          />
          {latestRun ? (
            <>
              <div className="summary-strip">
                <span>Total {latestRun.summary.total}</span>
                <span>Pass {latestRun.summary.passed}</span>
                <span>Warn {latestRun.summary.warning}</span>
                <span>Critical {latestRun.summary.critical}</span>
              </div>
              <div className="hub-actions hub-actions-compact">
                <button className="secondary-button" onClick={onOpenResults} type="button">
                  Review Results
                </button>
              </div>
            </>
          ) : (
            <p className="helper-text">No local result is available yet.</p>
          )}
        </article>

        <article className="hub-card">
          <DesktopSectionHeader
            eyebrow="Before You Leave This Page"
            title="What success looks like"
            subtitle="Use this checklist to know whether the first inspection path is actually working."
          />
          <div className="hub-step-list">
            <div className="hub-step-button">
              <strong>One target can connect over SSH</strong>
              <span>The preview must succeed before you spend time saving assets, tuning schedules, or exporting anything.</span>
            </div>
            <div className="hub-step-button">
              <strong>One result is easy to read</strong>
              <span>You should be able to tell pass, warning, and critical findings without opening extra screens to decode them.</span>
            </div>
            <div className="hub-step-button">
              <strong>Only then save and automate</strong>
              <span>After the first path works once, save the target for reuse and come back later for recurring runs and reporting.</span>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
