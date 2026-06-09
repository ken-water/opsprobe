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
        eyebrow="Report Strategy"
        title="Choose how this result should be read"
        subtitle="The result already appears above. Use this area to decide who the export is for, how remediation should read, and what feedback to send when the report still misses the real need."
        meta={
          <div className="summary-strip">
            <span>Audience {reportAudience}</span>
          </div>
        }
      />

      <div className="reports-workspace">
        <div className="reports-config-panel">
          <article className="history-side-card">
            <h3>Active report mode</h3>
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
              <p>Use this when the reader needs commands, evidence, service context, and direct remediation detail.</p>
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
              <p>Use this when the reader needs impact, priority, and ownership rather than low-level evidence.</p>
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
            <h3>How remediation should read</h3>
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
            <h3>Request what is still missing</h3>
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

          <div className="history-side-card">
            <h3>What this page is for</h3>
            <div className="history-side-list">
              <article className="service-card">
                <div className="service-card-header">
                  <strong>Use the result above to act</strong>
                  <span className="badge badge-pass">now</span>
                </div>
                <p>Read the current conclusion, inspect priority actions, and export the selected audience format from the result section above.</p>
              </article>
              <article className="service-card">
                <div className="service-card-header">
                  <strong>Use this panel to shape the report</strong>
                  <span className="badge badge-warning">feedback</span>
                </div>
                <p>Switch audience mode here, then submit inspection, report, or workflow feedback when the current export still does not fit real operations.</p>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
