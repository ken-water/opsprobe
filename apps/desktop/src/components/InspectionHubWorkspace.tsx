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
  const primaryActionLabel = readyForInspection ? "Start Inspection" : "Finish Local Checks";
  const nextStepLabel =
    blockingCount > 0
      ? "Repair local system first"
      : assetCount === 0
        ? "Save the first real target"
        : latestRun
          ? "Review the latest result"
          : "Run the first real inspection";
  const nextStepDetail =
    blockingCount > 0
      ? "OpsProbe found blocking local checks. Fix the runtime and report path before trusting automation."
      : assetCount === 0
        ? "The desktop is ready enough to start capturing real targets and building a reusable workspace."
        : latestRun
          ? "A recent run already exists, so the fastest next action is to read the conclusion and remediation."
          : "The machine is ready enough for a first real run. Start inspection before adding more structure.";

  return (
    <>
      <section className="hub-hero">
        <div className="hub-hero-main">
          <p className="eyebrow">Desktop Status</p>
          <h1>Know if this machine is ready before the first real inspection.</h1>
          <p className="summary">
            Check this machine, confirm the next step, then either start a real inspection or fix the local runtime first.
          </p>
          <div className={`hub-launch-banner ${readyForInspection ? "hub-launch-banner-ready" : "hub-launch-banner-attention"}`}>
            <strong>{readyForInspection ? "Ready for a first real inspection" : "This machine still needs setup attention"}</strong>
            <span>{runtimeSummary}</span>
          </div>
          <div className="hub-actions">
            <button
              className="primary-button primary-button-large"
              onClick={readyForInspection ? onStartInspection : onOpenSettings}
              type="button"
            >
              {primaryActionLabel}
            </button>
            <button className="secondary-button" onClick={readyForInspection ? onOpenResults : onStartInspection} type="button">
              {readyForInspection ? "Open Latest Result" : "Inspect Anyway"}
            </button>
          </div>
        </div>

        <div className="hub-hero-side">
          <article className="hub-side-card">
            <span className="status-label">Next Step</span>
            <strong>{nextStepLabel}</strong>
            <p>{nextStepDetail}</p>
          </article>
          <article className="hub-side-card">
            <span className="status-label">Current Mode</span>
            <strong>{showingDemoExperience ? "Demo workspace" : "Real workspace"}</strong>
            <p>{showingDemoExperience ? "Demo data is active for safe exploration before connecting real hosts." : `Current inspection scope: ${selectedTemplateName}.`}</p>
          </article>
        </div>
      </section>

      <section className="hub-guided-strip" aria-label="Operator path">
        <button className="guided-step-card guided-step-card-active" onClick={readyForInspection ? onStartInspection : onOpenSettings} type="button">
          <span className="guided-step-index">1</span>
          <strong>{readyForInspection ? "Start with inspection" : "Fix this machine first"}</strong>
          <span>{readyForInspection ? "The runtime is usable. Open the inspection workflow directly." : runtimeSummary}</span>
        </button>
        <button className="guided-step-card" onClick={onOpenAssets} type="button">
          <span className="guided-step-index">2</span>
          <strong>Save the target</strong>
          <span>Store SSH targets and credentials only after the first preview looks correct.</span>
        </button>
        <button className="guided-step-card" onClick={onOpenResults} type="button">
          <span className="guided-step-index">3</span>
          <strong>Read the result</strong>
          <span>Open the latest conclusion, export files, and remediation trail.</span>
        </button>
      </section>

      <section className="hub-grid">
        <article className="hub-card hub-card-emphasis">
          <DesktopSectionHeader
            eyebrow="Local Readiness"
            title="Readiness at a glance"
            subtitle="Only the checks that matter before you trust recurring inspection on this machine."
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
            eyebrow="Installed State"
            title="What already exists"
            subtitle="Quick proof of whether this desktop is still empty or already in use."
          />
          <div className="hub-kpi-list">
            <div><span>Saved assets</span><strong>{assetCount}</strong></div>
            <div><span>Schedules</span><strong>{scheduleCount}</strong></div>
            <div><span>Run history</span><strong>{historyCount}</strong></div>
          </div>
        </article>

        <article className="hub-card">
          <DesktopSectionHeader
            eyebrow="Most Recent Result"
            title={latestRun ? latestRun.id : "No inspection run yet"}
            subtitle={
              latestRun
                ? `Latest run created at ${formatDateTime(latestRun.createdAt)}.`
                : "Run the first inspection to create a report and remediation trail."
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
            eyebrow="Open Directly"
            title="Main actions"
            subtitle="Each action opens one focused area instead of another overview page."
          />
          <div className="hub-step-list">
            <button className="hub-step-button" onClick={onStartInspection} type="button">
              <strong>Run Inspection</strong>
              <span>Open the target, SSH, and preview workflow directly.</span>
            </button>
            <button className="hub-step-button" onClick={onOpenAssets} type="button">
              <strong>Save Or Reuse Target</strong>
              <span>Open saved assets and machine transfer after the first preview is right.</span>
            </button>
            <button className="hub-step-button" onClick={onOpenResults} type="button">
              <strong>Read Reports</strong>
              <span>Open the latest result, export paths, and history comparison.</span>
            </button>
            <button className="hub-step-button" onClick={onOpenSettings} type="button">
              <strong>Repair Local System</strong>
              <span>Fix runtime, PostgreSQL, or first-run environment issues.</span>
            </button>
          </div>
        </article>
      </section>
    </>
  );
}
