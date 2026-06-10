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
  const latestRunSummary = latestRun
    ? `Pass ${latestRun.summary.passed} · Warn ${latestRun.summary.warning} · Critical ${latestRun.summary.critical}`
    : "No result yet";

  return (
    <>
      <section className="hub-hero">
        <div className="hub-hero-main">
          <p className="eyebrow">Start Here</p>
          <h1>{focusTitle}</h1>
          <p className="summary">{focusDetail}</p>
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
            <button className="primary-button primary-button-large" onClick={primaryAction} type="button">
              {primaryActionLabel}
            </button>
            {secondaryAction ? (
              <button className="secondary-button" onClick={secondaryAction.onClick} type="button">
                {secondaryAction.label}
              </button>
            ) : null}
          </div>
        </div>

        <aside className="hub-hero-side-card">
          <div className="hub-hero-side-block">
            <span className="status-label">Current Status</span>
            <strong>{needsSystemRepair ? "Blocked by system issues" : readyForInspection ? "Ready to inspect" : "Ready to start"}</strong>
            <p>{runtimeSummary}</p>
          </div>
          <div className="hub-hero-side-metrics">
            <div><span>Setup</span><strong>{completedSetupSteps}/{totalSetupSteps}</strong></div>
            <div><span>{blockingCount > 0 ? "Blocking" : "Warnings"}</span><strong>{blockingCount > 0 ? blockingCount : warningCount}</strong></div>
            <div><span>Assets</span><strong>{assetCount}</strong></div>
          </div>
          <div className="hub-hero-side-block">
            <span className="status-label">Latest Result</span>
            <strong>{latestRun ? latestRun.id : "No inspection run yet"}</strong>
            <p>{latestRun ? latestRunSummary : "Reports only matter after the first preview succeeds."}</p>
            {latestRun ? (
              <button className="secondary-button" onClick={onOpenResults} type="button">
                Review Results
              </button>
            ) : null}
          </div>
        </aside>
      </section>

      <section className="hub-next-strip" aria-label="Operator path">
        <article className="hub-next-card hub-next-card-active">
          <span className="guided-step-index">1</span>
          <strong>{primaryStepLabel}</strong>
          <span>
            {readyForInspection
              ? "Go to the target, SSH, and preview workflow."
              : needsSystemRepair
                ? runtimeSummary
                : "Enter one real target before spending more time elsewhere."}
          </span>
        </article>
        <article className="hub-next-card">
          <span className="guided-step-index">2</span>
          <strong>Run the preview</strong>
          <span>Prove the target, SSH path, and checks all work once.</span>
        </article>
        <article className="hub-next-card">
          <span className="guided-step-index">3</span>
          <strong>Read the result</strong>
          <span>Share only after the result is readable and useful.</span>
        </article>
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
                {blockingCount > 0 ? "Fix blocking issues first." : "Warnings can wait until after the first preview succeeds."}
              </p>
            </div>
          </div>
        </article>

        <article className="hub-card">
          <DesktopSectionHeader
            eyebrow="What Success Looks Like"
            title="Stop after these three wins"
            subtitle="If these are true, the first inspection path is working."
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
            eyebrow="Workspace"
            title="Current workspace"
            subtitle="Reference only. Do not leave the first inspection path just to fill these numbers."
          />
          <div className="hub-kpi-list">
            <div><span>Saved assets</span><strong>{assetCount}</strong></div>
            <div><span>Run history</span><strong>{historyCount}</strong></div>
            <div><span>Schedules</span><strong>{scheduleCount}</strong></div>
          </div>
          <p className="helper-text">
            {showingDemoExperience
              ? "Demo data is active for safe exploration."
              : latestRun
                ? `Latest run created at ${formatDateTime(latestRun.createdAt)}. Scope: ${selectedTemplateName}.`
                : `Current inspection scope: ${selectedTemplateName}.`}
          </p>
        </article>
      </section>
    </>
  );
}
