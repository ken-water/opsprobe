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
        title="Choose the export style"
        subtitle="Use this only after the result above is already clear."
        meta={
          <div className="summary-strip">
            <span>Audience {reportAudience}</span>
          </div>
        }
      />

      <div className="reports-workspace">
        <div className="reports-config-panel">
          <article className="history-side-card">
            <h3>Current mode</h3>
            <div className="inline-note">
              <strong>{reportAudience === "operator" ? "Operator mode" : "Manager mode"}</strong>
              <span>
                {reportAudience === "operator"
                  ? "Keep detailed evidence and explicit remediation for the person repairing the issue."
                  : "Keep the summary short, decision-oriented, and focused on risk and next action."}
              </span>
            </div>
          </article>

          <div className="service-checks">
            <article className="service-card">
              <div className="service-card-header">
                <strong>Operator Detailed Report</strong>
                <span className={`badge badge-${reportAudience === "operator" ? "pass" : "unknown"}`}>
                  {reportAudience === "operator" ? "selected" : "available"}
                </span>
              </div>
              <p>For the person who will fix the problem.</p>
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
              <p>For the person who needs impact and priority, not raw evidence.</p>
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
            This choice affects both HTML and PDF export in the current desktop workflow.
          </p>

          <article className="history-side-card">
            <h3>Report rule</h3>
            <div className="history-side-list">
              <article className="service-card">
                <div className="service-card-header">
                  <strong>State the risk first</strong>
                  <span className="badge badge-pass">default</span>
                </div>
                <p>Start with what is broken or risky, then explain the repair path. Avoid burying the main action under raw evidence.</p>
              </article>
              <article className="service-card">
                <div className="service-card-header">
                  <strong>Keep evidence attached</strong>
                  <span className="badge badge-pass">required</span>
                </div>
                <p>Every recommendation should still be traceable back to the exact check result, host context, and collected evidence.</p>
              </article>
            </div>
          </article>
        </div>

        <div className="reports-side-panel">
          <div className="history-side-card">
            <h3>Tell us what is missing</h3>
            <div className="history-side-list">
              <article className="service-card">
                <div className="service-card-header">
                  <strong>Inspection Need</strong>
                  <span className="badge badge-warning">missing check</span>
                </div>
                <p>Use this when a template, evidence field, or service check is missing from the real workflow you need.</p>
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
                <p>Use this when the report exists, but the structure, detail level, or wording is still wrong.</p>
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
        </div>
      </div>
    </section>
  );
}
