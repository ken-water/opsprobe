import type { ReportAudience } from "@opsprobe/report";

interface ReportsWorkspaceProps {
  reportAudience: ReportAudience;
  setReportAudience: (audience: ReportAudience) => void;
}

export function ReportsWorkspace({
  reportAudience,
  setReportAudience,
}: ReportsWorkspaceProps) {
  return (
    <section className="run-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Reports Center</p>
          <h2>Audience And Feedback Hub</h2>
        </div>
      </div>

      <div className="reports-workspace">
        <div className="reports-config-panel">
          <div className="assets-panel-header">
            <strong>Export Audience</strong>
            <span>{reportAudience}</span>
          </div>

          <div className="service-checks">
            <article className="service-card">
              <div className="service-card-header">
                <strong>Operator Detailed Report</strong>
                <span className={`badge badge-${reportAudience === "operator" ? "pass" : "unknown"}`}>
                  {reportAudience === "operator" ? "selected" : "available"}
                </span>
              </div>
              <p>Detailed evidence, grouped results, and remediation text for the engineer doing the repair work.</p>
              <button
                className="secondary-button"
                onClick={() => setReportAudience("operator")}
                type="button"
              >
                Use Operator Mode
              </button>
            </article>

            <article className="service-card">
              <div className="service-card-header">
                <strong>Manager Summary Report</strong>
                <span className={`badge badge-${reportAudience === "manager" ? "pass" : "unknown"}`}>
                  {reportAudience === "manager" ? "selected" : "available"}
                </span>
              </div>
              <p>Risk summary, host overview, and priority actions for readers who need a concise decision view.</p>
              <button
                className="secondary-button"
                onClick={() => setReportAudience("manager")}
                type="button"
              >
                Use Manager Mode
              </button>
            </article>
          </div>

          <p className="helper-text">
            The selected audience affects both HTML and PDF export behavior throughout the desktop workflow.
          </p>
        </div>

        <div className="reports-side-panel">
          <div className="history-side-card">
            <h3>Feedback Intake</h3>
            <div className="history-side-list">
              <article className="service-card">
                <div className="service-card-header">
                  <strong>Inspection Need</strong>
                  <span className="badge badge-warning">missing check</span>
                </div>
                <p>Use this when a template, evidence field, or service check is missing from your real workflow.</p>
                <a
                  className="support-link"
                  href="https://github.com/ken-water/opsprobe/issues/new?template=inspection-need.yml"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Inspection Need
                </a>
              </article>

              <article className="service-card">
                <div className="service-card-header">
                  <strong>Report Feedback</strong>
                  <span className="badge badge-warning">report fit</span>
                </div>
                <p>Use this when the report exists, but the structure, detail level, or wording is wrong.</p>
                <a
                  className="support-link"
                  href="https://github.com/ken-water/opsprobe/issues/new?template=report-feedback.yml"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Report Feedback
                </a>
              </article>

              <article className="service-card">
                <div className="service-card-header">
                  <strong>Workflow Friction</strong>
                  <span className="badge badge-warning">real usage pain</span>
                </div>
                <p>Use this when OpsProbe does not fit the real sequence of work you need to complete.</p>
                <a
                  className="support-link"
                  href="https://github.com/ken-water/opsprobe/issues/new?template=workflow-friction.yml"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Workflow Friction
                </a>
              </article>
            </div>
          </div>

          <div className="history-side-card">
            <h3>Roadmap Context</h3>
            <div className="history-side-list">
              <article className="service-card">
                <div className="service-card-header">
                  <strong>Current Scope</strong>
                  <span className="badge badge-pass">0.10.x</span>
                </div>
                <p>Report audience variants, desktop operator flows, and runtime hardening are the current line.</p>
              </article>
              <article className="service-card">
                <div className="service-card-header">
                  <strong>Deferred</strong>
                  <span className="badge badge-warning">later</span>
                </div>
                <p>Web report publishing, customer login, notification delivery, and multi-user collaboration stay out of scope for now.</p>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
