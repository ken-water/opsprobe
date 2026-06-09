import type { Asset, InspectionRun } from "@opsprobe/core";
import { DesktopSectionHeader, formatDateTime } from "./DesktopUI";

interface InspectionHubWorkspaceProps {
  asset: Asset;
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
  onOpenAssetsStrategy: () => void;
  onOpenResults: () => void;
  onOpenSettings: () => void;
}

export function InspectionHubWorkspace({
  asset,
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
  onOpenAssetsStrategy,
  onOpenResults,
  onOpenSettings,
}: InspectionHubWorkspaceProps) {
  return (
    <>
      <section className="hub-hero">
        <div className="hub-hero-main">
          <p className="eyebrow">Start Here</p>
          <h1>Inspect first. Configure only when needed.</h1>
          <p className="summary">
            The main workflow is simple: choose a target, run inspection, then read or export the result.
          </p>
          <div className="hub-actions">
            <button className="primary-button primary-button-large" onClick={onStartInspection} type="button">
              Start Inspection
            </button>
            <button className="secondary-button" onClick={onOpenAssetsStrategy} type="button">
              Open Configuration
            </button>
          </div>
        </div>

        <div className="hub-hero-side">
          <article className="hub-side-card">
            <span className="status-label">Current Target</span>
            <strong>{asset.name}</strong>
            <p>{asset.host}:{asset.port} · {asset.credential.username}</p>
          </article>
          <article className="hub-side-card">
            <span className="status-label">Inspection Scope</span>
            <strong>{selectedTemplateName}</strong>
            <p>{showingDemoExperience ? "Demo data is active for safe exploration." : runtimeSummary}</p>
          </article>
        </div>
      </section>

      <section className="hub-grid">
        <article className="hub-card hub-card-emphasis">
          <DesktopSectionHeader
            eyebrow="Run Readiness"
            title="Ready to inspect?"
            subtitle="If blocked, use configuration or settings below."
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
            eyebrow="Workspace"
            title="Configured items"
            subtitle="What already exists in this workspace."
          />
          <div className="hub-kpi-list">
            <div><span>Saved assets</span><strong>{assetCount}</strong></div>
            <div><span>Schedules</span><strong>{scheduleCount}</strong></div>
            <div><span>Run history</span><strong>{historyCount}</strong></div>
          </div>
        </article>

        <article className="hub-card">
          <DesktopSectionHeader
            eyebrow="Latest Result"
            title={latestRun ? latestRun.id : "No inspection run yet"}
            subtitle={
              latestRun
                ? `Latest run created at ${formatDateTime(latestRun.createdAt)}.`
                : "Run the first inspection to generate a report."
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
            eyebrow="Next Step"
            title="If start is blocked"
            subtitle="Use one of these two focused entry points."
          />
          <div className="hub-step-list">
            <button className="hub-step-button" onClick={onOpenAssetsStrategy} type="button">
              <strong>Configuration</strong>
              <span>Targets, SSH, templates, and schedules.</span>
            </button>
            <button className="hub-step-button" onClick={onOpenSettings} type="button">
              <strong>System Settings</strong>
              <span>Runtime, PostgreSQL, and local repair.</span>
            </button>
          </div>
        </article>
      </section>
    </>
  );
}
