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
  onOpenResults,
  onOpenSettings,
}: InspectionHubWorkspaceProps) {
  const readyForInspection = completedSetupSteps === totalSetupSteps && blockingCount === 0;
  const needsSystemRepair = blockingCount > 0;
  const primaryActionLabel = readyForInspection
    ? "Open Inspect"
    : needsSystemRepair
      ? "Open System"
      : "Start First Inspection";
  const primaryAction = readyForInspection ? onStartInspection : needsSystemRepair ? onOpenSettings : onStartInspection;
  const secondaryAction = readyForInspection
    ? { label: "Open Latest Result", onClick: onOpenResults }
    : needsSystemRepair
      ? { label: "Start First Inspection", onClick: onStartInspection }
      : null;
  const focusTitle = readyForInspection
    ? "Do the first real inspection now"
      : needsSystemRepair
        ? "Fix the local machine first"
        : "Run the first real inspection path";
  const focusDetail = readyForInspection
    ? "Do not start with schedules or exports. Open Inspect, test SSH, and make one preview succeed."
    : needsSystemRepair
      ? "OpsProbe found blocking local problems. Open System, repair the runtime, then come back here."
      : "The runtime looks healthy. Enter one target, test SSH, and get one preview result before worrying about reuse, schedules, or exports.";
  const primaryStepLabel = readyForInspection ? "Open Inspect" : needsSystemRepair ? "Open System" : "Open Inspect";

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
      </section>

      <section className="hub-guided-strip" aria-label="Operator path">
        <button className="guided-step-card guided-step-card-active" onClick={primaryAction} type="button">
          <span className="guided-step-index">1</span>
          <strong>{primaryStepLabel}</strong>
          <span>
            {readyForInspection
              ? "Go to the target, SSH, and preview workflow."
              : needsSystemRepair
                ? runtimeSummary
                : "Enter one real target before spending more time elsewhere."}
          </span>
        </button>
        <button className="guided-step-card" onClick={onStartInspection} type="button">
          <span className="guided-step-index">2</span>
          <strong>Run the preview</strong>
          <span>Prove the target, SSH path, and checks all work once before saving anything for reuse.</span>
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
            eyebrow="Before You Start"
            title="Only three things matter"
            subtitle="If these are clear, the first inspection path will be easy to finish."
          />
          <div className="hub-readiness-grid hub-readiness-grid-single">
            <div className="snapshot-tile">
              <span className="snapshot-label">Setup</span>
              <strong>{completedSetupSteps}/{totalSetupSteps}</strong>
              <p className="helper-text">How much first-run setup is already complete.</p>
            </div>
            <div className="snapshot-tile">
              <span className="snapshot-label">Runtime</span>
              <strong>{runtimeStatus}</strong>
              <p className="helper-text">The local runtime state before you try SSH and preview.</p>
            </div>
            <div className="snapshot-tile">
              <span className="snapshot-label">{blockingCount > 0 ? "Blocking" : "Warnings"}</span>
              <strong>{blockingCount > 0 ? blockingCount : warningCount}</strong>
              <p className="helper-text">
                {blockingCount > 0
                  ? "Fix blocking issues first."
                  : "Warnings can wait until after the first preview succeeds."}
              </p>
            </div>
          </div>
        </article>

        <article className="hub-card">
          <DesktopSectionHeader
            eyebrow="Workspace"
            title="Current workspace"
            subtitle="Keep this as orientation only. It should not distract from the first inspection path."
          />
          <div className="hub-kpi-list">
            <div><span>Saved assets</span><strong>{assetCount}</strong></div>
            <div><span>Run history</span><strong>{historyCount}</strong></div>
            <div><span>Schedules</span><strong>{scheduleCount}</strong></div>
          </div>
          <p className="helper-text">
            {showingDemoExperience ? "Demo data is active for safe exploration." : `Current inspection scope: ${selectedTemplateName}.`}
          </p>
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

        <article className="hub-card">
          <DesktopSectionHeader
            eyebrow="Latest Result"
            title={latestRun ? latestRun.id : "No inspection run yet"}
            subtitle={
              latestRun
                ? `Latest run created at ${formatDateTime(latestRun.createdAt)}.`
                : "No result exists yet. Reports only become useful after the first real run succeeds."
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
      </section>
    </>
  );
}
