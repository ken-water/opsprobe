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
    <>
      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.10.3 Current Release</p>
            <h2>Exploration Summary</h2>
          </div>
        </div>

        <div className="service-checks">
          <article className="service-card">
            <div className="service-card-header">
              <strong>Addressed In 0.7.x</strong>
              <span className="badge badge-pass">stabilized</span>
            </div>
            <ul className="troubleshooting-list">
              <li>Demo mode reduced first-run comprehension friction.</li>
              <li>Runtime diagnostics explain SSH, dependency, and PostgreSQL setup failures.</li>
              <li>Operator and manager report variants cover different readers.</li>
              <li>Structured issue templates and feedback prompts now route outside-user input.</li>
            </ul>
          </article>

          <article className="service-card">
            <div className="service-card-header">
              <strong>Explicitly Deferred</strong>
              <span className="badge badge-warning">not next</span>
            </div>
            <ul className="troubleshooting-list">
              <li>Web report publishing and customer login.</li>
              <li>Notification delivery and multi-user collaboration.</li>
              <li>Trend reporting across many runs.</li>
              <li>In-product feedback submission backend.</li>
            </ul>
          </article>

          <article className="service-card">
            <div className="service-card-header">
              <strong>Next Stage Decision</strong>
              <span className="badge badge-pass">0.8.x</span>
            </div>
            <p>
              OpsProbe should continue into a `0.8.x` exploration line focused on deeper
              inspection quality and local workflow reliability, not `1.0.0` yet.
            </p>
            <p className="helper-text">
              Rationale: the product is more understandable now, but it still needs stronger
              real-world inspection depth and broader outside validation before a stable milestone.
            </p>
          </article>
        </div>

        <p className="helper-text">
          Decision document: <a href="https://github.com/ken-water/opsprobe/blob/main/docs/validation-cycle-0.7.md" target="_blank" rel="noreferrer">docs/validation-cycle-0.7.md</a>
        </p>
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.10.3 Current Release</p>
            <h2>Feedback Paths</h2>
          </div>
        </div>

        <div className="service-checks">
          <article className="service-card">
            <div className="service-card-header">
              <strong>Inspection Need</strong>
              <span className="badge badge-warning">missing check</span>
            </div>
            <p>Use this when a template, evidence field, or service check is missing from your real inspection workflow.</p>
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
            <p>Use this when the report exists, but the detail level, structure, wording, or audience fit is wrong.</p>
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
            <p>Use this when OpsProbe does not fit the real sequence of work you need to complete, even if no single feature is missing.</p>
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

        <p className="helper-text">
          Good feedback includes the environment you were inspecting, what you were trying to finish,
          what manual workaround you used, and what output or workflow you expected instead.
        </p>

        <p className="helper-text">
          Guide: <a href="https://github.com/ken-water/opsprobe/blob/main/docs/feedback.md" target="_blank" rel="noreferrer">docs/feedback.md</a>
        </p>
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.10.3 Current Release</p>
            <h2>Report Variants</h2>
          </div>
        </div>

        <div className="ssh-grid">
          <label>
            <span>Audience</span>
            <select
              value={reportAudience}
              onChange={(event) => setReportAudience(event.target.value as ReportAudience)}
            >
              <option value="operator">Operator Detailed Report</option>
              <option value="manager">Manager Summary Report</option>
            </select>
          </label>
        </div>

        <div className="service-checks">
          <article className="service-card">
            <div className="service-card-header">
              <strong>Operator Detailed Report</strong>
              <span className={`badge badge-${reportAudience === "operator" ? "pass" : "unknown"}`}>
                {reportAudience === "operator" ? "selected" : "available"}
              </span>
            </div>
            <p>Includes detailed evidence, grouped results by severity, and per-check remediation text for operators doing the actual repair work.</p>
          </article>
          <article className="service-card">
            <div className="service-card-header">
              <strong>Manager Summary Report</strong>
              <span className={`badge badge-${reportAudience === "manager" ? "pass" : "unknown"}`}>
                {reportAudience === "manager" ? "selected" : "available"}
              </span>
            </div>
            <p>Condenses the run into risk summary, host overview, and priority actions for stakeholders who need decision-ready context.</p>
          </article>
        </div>

        <p className="helper-text">
          The selected audience affects both HTML and PDF export paths, so you can compare which report structure is more useful to early users.
        </p>
      </section>
    </>
  );
}
