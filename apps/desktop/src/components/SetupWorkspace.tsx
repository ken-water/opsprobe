import type { LocalServiceStatusResponse } from "@opsprobe/local-service";
import { DesktopSectionHeader } from "./DesktopUI";

interface TroubleshootingCard {
  key: string;
  label: string;
  status: "warning" | "critical";
  detail: string;
  actions: string[];
}

interface RepairPack {
  id: string;
  title: string;
  status: "pass" | "warning" | "critical";
  summary: string;
  whyItMatters: string;
  nextAction: string;
  actionLabel: string;
  checks: LocalServiceStatusResponse["snapshot"]["health"]["checks"];
}

interface SetupItem {
  id: string;
  label: string;
  done: boolean;
  action?: () => void;
  actionLabel: string;
  detail: string;
}

interface SetupWorkspaceProps {
  showingDemoExperience: boolean;
  isSwitchingMode: boolean;
  completedSetupSteps: number;
  firstRunChecklist: SetupItem[];
  blockingChecks: LocalServiceStatusResponse["snapshot"]["health"]["checks"];
  warningChecks: LocalServiceStatusResponse["snapshot"]["health"]["checks"];
  repairPacks: RepairPack[];
  troubleshootingCards: TroubleshootingCard[];
  sshTroubleshooting: string[];
  sshMessage: string | null;
  onEnterDemoMode: () => void;
  onSwitchToRealSetup: () => void;
  onOpenAssetsStrategy: () => void;
  onRefreshEnvironment: () => void;
  onOpenInspectionHub: () => void;
}

export function SetupWorkspace({
  showingDemoExperience,
  completedSetupSteps,
  firstRunChecklist,
  blockingChecks,
  warningChecks,
  repairPacks,
  troubleshootingCards,
  sshTroubleshooting,
  sshMessage,
  onEnterDemoMode,
  onSwitchToRealSetup,
  onOpenAssetsStrategy,
  onRefreshEnvironment,
  onOpenInspectionHub,
}: SetupWorkspaceProps) {
  const currentSetupItem = firstRunChecklist.find((item) => !item.done) ?? null;
  const readyForRealInspection = completedSetupSteps === firstRunChecklist.length && blockingChecks.length === 0;
  const blockingRepairPacks = repairPacks.filter((pack) => pack.status === "critical");
  const warningRepairPacks = repairPacks.filter((pack) => pack.status === "warning");
  const primaryRepairPacks = blockingRepairPacks.length > 0 ? blockingRepairPacks : warningRepairPacks;

  return (
    <>
      <section className="run-panel">
        <DesktopSectionHeader
          eyebrow="System Settings"
          title="Fix what blocks the first inspection"
          subtitle="This page should only answer one question: what must be repaired before the first real inspection can succeed?"
          meta={
            <div className="summary-strip">
              <span>{readyForRealInspection ? "ready for first real inspection" : "repair work still required"}</span>
              <span>{blockingChecks.length} blocking checks</span>
            </div>
          }
        />

        <div className="hub-readiness-grid">
          <article className={`service-card readiness-hero-card ${readyForRealInspection ? "stage-anchor-success" : "stage-anchor-repair"}`}>
            <div className="service-card-header">
              <strong>{readyForRealInspection ? "Ready for first real inspection" : "Local desktop still needs repair"}</strong>
              <span className={`badge badge-${readyForRealInspection ? "pass" : blockingChecks.length > 0 ? "critical" : "warning"}`}>
                {readyForRealInspection ? "ready" : blockingChecks.length > 0 ? "blocked" : "attention"}
              </span>
            </div>
            <p>
              {readyForRealInspection
                ? "The minimum runtime, report path, and asset prerequisites are in place. Leave System and go back to the first inspection flow."
                : "Repair the blocking runtime, export, or SSH prerequisites below. Ignore schedules, exports, and other advanced setup until this is green."}
            </p>
            <div className="service-actions">
              <button className="primary-button" onClick={readyForRealInspection ? onOpenInspectionHub : onRefreshEnvironment} type="button">
                {readyForRealInspection ? "Back To Start" : "Refresh Environment"}
              </button>
              <button className="secondary-button" onClick={onOpenAssetsStrategy} type="button">
                Open Inspect Setup
              </button>
            </div>
          </article>

          <article className="service-card readiness-metrics-card">
            <div className="service-card-header">
              <strong>Only the numbers that matter</strong>
              <span className="badge badge-unknown">repair</span>
            </div>
            <div className="readiness-metrics-grid">
              <div className="readiness-metric">
                <span>Blocking</span>
                <strong>{blockingChecks.length}</strong>
              </div>
              <div className="readiness-metric">
                <span>Repair packs</span>
                <strong>{primaryRepairPacks.length}</strong>
              </div>
              <div className="readiness-metric">
                <span>Setup</span>
                <strong>{completedSetupSteps}/{firstRunChecklist.length}</strong>
              </div>
              <div className="readiness-metric">
                <span>Warnings</span>
                <strong>{warningChecks.length}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="run-panel">
        <DesktopSectionHeader
          eyebrow="System Settings"
          title={blockingRepairPacks.length > 0 ? "Repair these first" : "Nothing is blocking, but these warnings remain"}
          subtitle={blockingRepairPacks.length > 0
            ? "Do these repairs before you return to the first inspection flow."
            : "These are not blocking the first inspection, but you should still review them before enabling automation."}
          meta={
            <div className="summary-strip">
              <span>{primaryRepairPacks.length} active repair packs</span>
              <span>{blockingRepairPacks.length > 0 ? "blocking first inspection" : "safe to defer until later"}</span>
            </div>
          }
        />

        <div className="service-checks">
          {primaryRepairPacks.map((pack) => (
            <article className={`service-card repair-pack-card repair-pack-${pack.status}`} key={pack.id}>
              <div className="service-card-header">
                <strong>{pack.title}</strong>
                <span className={`badge badge-${pack.status}`}>{pack.status === "pass" ? "healthy" : pack.status}</span>
              </div>
              <p>{pack.summary}</p>
              <div className="inline-note">
                <strong>Why it matters</strong>
                <span>{pack.whyItMatters}</span>
              </div>
              <div className="inline-note">
                <strong>Next action</strong>
                <span>{pack.nextAction}</span>
              </div>
              <div className="repair-pack-checks">
                {pack.checks.length > 0 ? (
                  pack.checks.map((check) => (
                    <span className={`repair-pack-check repair-pack-check-${check.status}`} key={`${pack.id}-${check.id}`}>
                      {check.label}
                    </span>
                  ))
                ) : (
                  <span className="repair-pack-check repair-pack-check-pass">No issues detected</span>
                )}
              </div>
              <div className="service-actions">
                <button
                  className={pack.id === "ssh-tools" || pack.id === "schedules" ? "secondary-button" : "primary-button"}
                  onClick={pack.id === "ssh-tools" || pack.id === "schedules" ? onOpenAssetsStrategy : onRefreshEnvironment}
                  type="button"
                >
                  {pack.actionLabel}
                </button>
              </div>
            </article>
          ))}
        </div>
        {primaryRepairPacks.length === 0 ? (
          <p className="helper-text">No active repair packs need attention right now.</p>
        ) : null}
      </section>

      <section className="run-panel">
        <DesktopSectionHeader
          eyebrow="Return Path"
          title={currentSetupItem ? "What to do after this page" : "System is no longer the bottleneck"}
          subtitle={currentSetupItem
            ? "Once the repair state is acceptable, go back to the first inspection flow instead of continuing to explore System."
            : "Leave System and complete the first inspection path while the environment is ready."}
          meta={
            <div className="summary-strip">
              <span>{currentSetupItem ? "one next step" : "return to inspect"}</span>
              <span>{showingDemoExperience ? "demo mode ready" : "real mode active"}</span>
            </div>
          }
        />

        <div className="workflow-stack">
          <section className="workflow-step-card">
            <div className="workflow-step-header">
              <div>
                <span className="workflow-step-index">Recommended Next Step</span>
                <strong>{currentSetupItem?.label ?? "Return to the first inspection flow"}</strong>
              </div>
              <span className={`badge badge-${currentSetupItem ? "warning" : "pass"}`}>
                {currentSetupItem ? "next action" : "ready"}
              </span>
            </div>

            <p className="helper-text">
              {currentSetupItem?.detail ??
                "The local runtime, report directory, and asset prerequisites are in place. Go back and run the first real inspection instead of staying in System."}
            </p>

            <div className="service-actions">
              <button className="primary-button" onClick={currentSetupItem?.action ?? onOpenInspectionHub} type="button">
                {currentSetupItem?.actionLabel ?? "Back To Start"}
              </button>
              <button className="secondary-button" onClick={onOpenAssetsStrategy} type="button">
                Open Inspect Setup
              </button>
              <button
                className={showingDemoExperience ? "secondary-button" : "primary-button"}
                onClick={showingDemoExperience ? onSwitchToRealSetup : onEnterDemoMode}
                type="button"
              >
                {showingDemoExperience ? "Switch to Real Setup" : "Explore Demo Data"}
              </button>
              <button className="secondary-button" onClick={onRefreshEnvironment} type="button">
                Refresh Environment
              </button>
            </div>

            <div className={`onboarding-banner ${showingDemoExperience ? "onboarding-demo" : "onboarding-real"}`}>
              <strong>{showingDemoExperience ? "Demo mode is active" : "Real setup mode is active"}</strong>
              <span>
                {showingDemoExperience
                  ? "Bundled example runs stay separate from local service history, so you can review workflow and report quality safely."
                  : "Demo data is hidden. Save a real target and run one inspection to start building your own history."}
              </span>
            </div>
          </section>
        </div>
      </section>

      <section className="run-panel">
        <DesktopSectionHeader
          eyebrow="Reference"
          title="Everything else"
          subtitle="These details are still available, but they are no longer the primary focus while you are trying to get the first inspection working."
          meta={
            <div className="summary-strip">
              <span>{completedSetupSteps}/{firstRunChecklist.length} steps complete</span>
              <span>{warningChecks.length} warnings</span>
            </div>
          }
        />

        <div className="setup-grid">
          {firstRunChecklist.map((item) => (
            <article className="setup-card" key={item.id}>
              <div className="service-card-header">
                <strong>{item.label}</strong>
                <span className={`badge badge-${item.done ? "pass" : "warning"}`}>
                  {item.done ? "done" : "todo"}
                </span>
              </div>
              <p>{item.detail}</p>
              {!item.done && item.action ? (
                <button className="secondary-button" onClick={item.action} type="button">
                  {item.actionLabel}
                </button>
              ) : null}
            </article>
          ))}
        </div>

        {blockingChecks.length > 0 ? (
          <div className="setup-issue-grid">
            {blockingChecks.map((check) => (
              <article className="service-card" key={`blocking-${check.id}`}>
                <div className="service-card-header">
                  <strong>{check.label}</strong>
                  <span className="badge badge-critical">blocking</span>
                </div>
                <p>{check.detail}</p>
                <div className="inline-note">
                  <strong>Repair first</strong>
                  <span>Resolve this before relying on recurring inspections or report exports.</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="helper-text">No blocking environment problems are currently detected.</p>
        )}

        {warningChecks.length > 0 ? (
          <div className="setup-issue-grid">
            {warningChecks.map((check) => (
              <article className="service-card" key={`warning-${check.id}`}>
                <div className="service-card-header">
                  <strong>{check.label}</strong>
                  <span className="badge badge-warning">warning</span>
                </div>
                <p>{check.detail}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="run-panel">
        <DesktopSectionHeader
          eyebrow="Reference"
          title="Troubleshooting Guidance"
          subtitle="Detailed repair steps stay here when you need them, but they should not be the first thing a new user has to read."
          meta={
            <div className="summary-strip">
              <span>{troubleshootingCards.length} environment issues</span>
              <span>{sshTroubleshooting.length > 0 ? "SSH guidance ready" : "SSH guidance idle"}</span>
            </div>
          }
        />

        {troubleshootingCards.length > 0 ? (
          <div className="service-checks">
            {troubleshootingCards.map((card) => (
              <article className="service-card" key={`troubleshoot-${card.key}`}>
                <div className="service-card-header">
                  <strong>{card.label}</strong>
                  <span className={`badge badge-${card.status}`}>{card.status}</span>
                </div>
                <p>{card.detail}</p>
                <ul className="troubleshooting-list">
                  {card.actions.map((action) => (
                    <li key={`${card.key}-${action}`}>{action}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <p className="helper-text">No environment problems currently need repair guidance.</p>
        )}

        {sshTroubleshooting.length > 0 ? (
          <article className="service-card ssh-guidance-card">
            <div className="service-card-header">
              <strong>SSH Connection Repair Steps</strong>
              <span className="badge badge-warning">ssh</span>
            </div>
            <p>{sshMessage}</p>
            <ul className="troubleshooting-list">
              {sshTroubleshooting.map((action) => (
                <li key={`ssh-guidance-${action}`}>{action}</li>
              ))}
            </ul>
          </article>
        ) : null}
      </section>
    </>
  );
}
