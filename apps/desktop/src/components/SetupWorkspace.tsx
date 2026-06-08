import type { LocalServiceStatusResponse } from "@opsprobe/local-service";

interface TroubleshootingCard {
  key: string;
  label: string;
  status: "warning" | "critical";
  detail: string;
  actions: string[];
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
  troubleshootingCards: TroubleshootingCard[];
  sshTroubleshooting: string[];
  sshMessage: string | null;
  onEnterDemoMode: () => void;
  onSwitchToRealSetup: () => void;
}

export function SetupWorkspace({
  showingDemoExperience,
  isSwitchingMode,
  completedSetupSteps,
  firstRunChecklist,
  blockingChecks,
  warningChecks,
  troubleshootingCards,
  sshTroubleshooting,
  sshMessage,
  onEnterDemoMode,
  onSwitchToRealSetup,
}: SetupWorkspaceProps) {
  return (
    <>
      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Setup Workspace</p>
            <h2>First-Run Demo Experience</h2>
          </div>
          <div className="service-actions">
            <button
              className={`secondary-button ${showingDemoExperience ? "button-active-state" : ""}`}
              onClick={onEnterDemoMode}
              type="button"
              disabled={isSwitchingMode}
              aria-pressed={showingDemoExperience}
            >
              {isSwitchingMode && showingDemoExperience ? "Loading Demo..." : showingDemoExperience ? "Demo Data Loaded" : "Explore Demo Data"}
            </button>
            <button
              className={`primary-button ${!showingDemoExperience ? "button-active-state" : ""}`}
              onClick={onSwitchToRealSetup}
              type="button"
              disabled={isSwitchingMode}
              aria-pressed={!showingDemoExperience}
            >
              {isSwitchingMode && !showingDemoExperience ? "Switching..." : !showingDemoExperience ? "Real Setup Active" : "Switch to Real Setup"}
            </button>
          </div>
        </div>

        <div className={`onboarding-banner ${showingDemoExperience ? "onboarding-demo" : "onboarding-real"}`}>
          <strong>{showingDemoExperience ? "Sample runs are visible" : "Real setup mode is active"}</strong>
          <span>
            {showingDemoExperience
              ? "These results are bundled examples and are not written into your local service history."
              : "Demo data is hidden. Save an asset and run inspections to build your own history."}
          </span>
        </div>

        <p className="helper-text">
          Use demo mode to review report quality, remediation wording, and result layout. Switch to
          real setup when you are ready to connect your own hosts.
        </p>
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Setup Workspace</p>
            <h2>Minimum Local Setup</h2>
          </div>
          <div className="summary-strip">
            <span>{completedSetupSteps}/{firstRunChecklist.length} steps complete</span>
            <span>{blockingChecks.length} blocking checks</span>
            <span>{warningChecks.length} warnings</span>
          </div>
        </div>

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
          <div className="service-checks">
            {blockingChecks.map((check) => (
              <article className="service-card" key={`blocking-${check.id}`}>
                <div className="service-card-header">
                  <strong>{check.label}</strong>
                  <span className="badge badge-critical">blocking</span>
                </div>
                <p>{check.detail}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="helper-text">No blocking environment problems are currently detected.</p>
        )}

        {warningChecks.length > 0 ? (
          <div className="service-checks">
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
        <div className="panel-header">
          <div>
            <p className="eyebrow">Setup Workspace</p>
            <h2>Troubleshooting Guidance</h2>
          </div>
          <div className="summary-strip">
            <span>{troubleshootingCards.length} environment issues</span>
            <span>{sshTroubleshooting.length > 0 ? "SSH guidance ready" : "SSH guidance idle"}</span>
          </div>
        </div>

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
