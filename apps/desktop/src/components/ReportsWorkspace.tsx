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
        eyebrow="Reports"
        title="Choose who will read this result"
        subtitle="Pick the reader here, then export from the current result view."
        meta={
          <div className="summary-strip">
            <span>Audience {reportAudience}</span>
          </div>
        }
      />

      <div className="reports-workspace">
        <div className="reports-mode-grid reports-mode-grid-simple">
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

      <article className="history-side-card reports-current-note">
        <strong>{reportAudience === "operator" ? "Operator mode keeps evidence first." : "Manager mode keeps decisions first."}</strong>
        <p>
          {reportAudience === "operator"
            ? "HTML and PDF exports keep detailed evidence and explicit remediation for the person fixing the issue."
            : "HTML and PDF exports stay shorter and more decision-oriented for stakeholders who only need risk and next action."}
        </p>
      </article>

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
