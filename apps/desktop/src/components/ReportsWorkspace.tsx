import type { ReportAudience } from "@opsprobe/report";
import { DesktopSectionHeader } from "./DesktopUI";

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
      <DesktopSectionHeader
        eyebrow="Report Mode"
        title="Export this result"
        subtitle="Choose who will read it, then export from the current result view."
        meta={
          <div className="summary-strip">
            <span>Audience {reportAudience}</span>
          </div>
        }
      />

      <div className="reports-workspace">
        <div className="reports-config-panel">
          <article className="service-card reports-mode-card reports-mode-card-active">
            <div className="service-card-header">
              <strong>Current export mode</strong>
              <span className="badge badge-pass">{reportAudience === "operator" ? "operator" : "manager"}</span>
            </div>
            <div className="inline-note">
              <strong>{reportAudience === "operator" ? "Operator mode" : "Manager mode"}</strong>
              <span>
                {reportAudience === "operator"
                  ? "Keep detailed evidence and explicit remediation for the person repairing the issue."
                  : "Keep the summary short, decision-oriented, and focused on risk and next action."}
              </span>
            </div>
            <p className="helper-text">This choice applies to both HTML and PDF export for the selected run.</p>
          </article>
        </div>

        <div className="reports-side-panel">
          <div className="reports-mode-grid">
            <article className="service-card reports-mode-card">
              <div className="service-card-header">
                <strong>Operator report</strong>
                <span className={`badge badge-${reportAudience === "operator" ? "pass" : "unknown"}`}>
                  {reportAudience === "operator" ? "selected" : "available"}
                </span>
              </div>
              <p>Use this when the reader will investigate evidence and make the repair.</p>
              <button
                className={reportAudience === "operator" ? "primary-button" : "secondary-button"}
                onClick={() => setReportAudience("operator")}
                type="button"
              >
                {reportAudience === "operator" ? "Operator Mode Active" : "Use Operator Mode"}
              </button>
            </article>

            <article className="service-card reports-mode-card">
              <div className="service-card-header">
                <strong>Manager report</strong>
                <span className={`badge badge-${reportAudience === "manager" ? "pass" : "unknown"}`}>
                  {reportAudience === "manager" ? "selected" : "available"}
                </span>
              </div>
              <p>Use this when the reader only needs risk, priority, and what should happen next.</p>
              <button
                className={reportAudience === "manager" ? "primary-button" : "secondary-button"}
                onClick={() => setReportAudience("manager")}
                type="button"
              >
                {reportAudience === "manager" ? "Manager Mode Active" : "Use Manager Mode"}
              </button>
            </article>
          </div>
        </div>
      </div>

      <article className="history-side-card reports-feedback-card">
        <h3>Need another report shape?</h3>
        <div className="reports-feedback-links">
          <a
            className="support-link"
            href="https://github.com/ken-water/opsprobe/issues/new?template=inspection-need.yml"
            target="_blank"
            rel="noreferrer"
          >
            Missing Check
          </a>
          <a
            className="support-link"
            href="https://github.com/ken-water/opsprobe/issues/new?template=report-feedback.yml"
            target="_blank"
            rel="noreferrer"
          >
            Report Feedback
          </a>
          <a
            className="support-link"
            href="https://github.com/ken-water/opsprobe/issues/new?template=workflow-friction.yml"
            target="_blank"
            rel="noreferrer"
          >
            Workflow Friction
          </a>
        </div>
      </article>
    </section>
  );
}
