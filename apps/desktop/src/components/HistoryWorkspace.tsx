import type { Asset, InspectionRun } from "@opsprobe/core";
import type { ReportAudience } from "@opsprobe/report";

interface RepeatedProblem {
  checkId: string;
  title: string;
  count: number;
  templateIds: string[];
}

interface HistoryWorkspaceProps {
  asset: Asset;
  activeTemplateName: string;
  reportAudience: ReportAudience;
  reportPath: string;
  pdfReportPath: string;
  serviceExecutionRun: InspectionRun | null;
  serviceInspectionRun: InspectionRun | null;
  visibleHistoryRuns: InspectionRun[];
  selectedHistoryRun: InspectionRun | null;
  repeatedProblems: RepeatedProblem[];
  showingDemoExperience: boolean;
  onboardingMode: "demo" | "real";
  historyAssetFilter: string;
  historyDateFrom: string;
  historyDateTo: string;
  isRunningServiceInspection: boolean;
  isRefreshingServicePreview: boolean;
  isRefreshingHistory: boolean;
  isExportingReport: boolean;
  isExportingPdfReport: boolean;
  onReportPathChange: (value: string) => void;
  onPdfReportPathChange: (value: string) => void;
  onHistoryAssetFilterChange: (value: string) => void;
  onHistoryDateFromChange: (value: string) => void;
  onHistoryDateToChange: (value: string) => void;
  onRunLocalServiceInspection: () => void;
  onRefreshLocalServiceInspectionPreview: () => void;
  onRefreshLocalServiceHistory: () => void;
  onSelectHistoryRun: (run: InspectionRun) => void;
  onExportHtmlReport: (run: InspectionRun) => void;
  onExportPdfReport: (run: InspectionRun) => void;
  templateLabel: (templateId: string) => string;
}

export function HistoryWorkspace(props: HistoryWorkspaceProps) {
  const {
    asset,
    activeTemplateName,
    reportAudience,
    reportPath,
    pdfReportPath,
    serviceExecutionRun,
    serviceInspectionRun,
    visibleHistoryRuns,
    selectedHistoryRun,
    repeatedProblems,
    showingDemoExperience,
    onboardingMode,
    historyAssetFilter,
    historyDateFrom,
    historyDateTo,
    isRunningServiceInspection,
    isRefreshingServicePreview,
    isRefreshingHistory,
    isExportingReport,
    isExportingPdfReport,
    onReportPathChange,
    onPdfReportPathChange,
    onHistoryAssetFilterChange,
    onHistoryDateFromChange,
    onHistoryDateToChange,
    onRunLocalServiceInspection,
    onRefreshLocalServiceInspectionPreview,
    onRefreshLocalServiceHistory,
    onSelectHistoryRun,
    onExportHtmlReport,
    onExportPdfReport,
    templateLabel,
  } = props;

  return (
    <>
      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.10.3 Current Release</p>
            <h2>Local Service Inspection Run</h2>
          </div>
          <div className="service-actions">
            <button className="primary-button" onClick={onRunLocalServiceInspection} type="button">
              {isRunningServiceInspection ? "Running..." : "Run Through Local Service"}
            </button>
            {serviceExecutionRun ? (
              <>
                <button className="secondary-button" onClick={() => onExportHtmlReport(serviceExecutionRun)} type="button">
                  {isExportingReport ? "Exporting..." : `Export ${reportAudience} HTML`}
                </button>
                <button className="secondary-button" onClick={() => onExportPdfReport(serviceExecutionRun)} type="button">
                  {isExportingPdfReport ? "Exporting..." : `Export ${reportAudience} PDF`}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="ssh-grid">
          <label><span>Report File</span><input value={reportPath} onChange={(e) => onReportPathChange(e.target.value)} /></label>
          <label><span>PDF Report File</span><input value={pdfReportPath} onChange={(e) => onPdfReportPathChange(e.target.value)} /></label>
        </div>

        {serviceExecutionRun ? (
          <>
            <div className="summary-strip">
              <span>Total {serviceExecutionRun.summary.total}</span>
              <span>Pass {serviceExecutionRun.summary.passed}</span>
              <span>Warn {serviceExecutionRun.summary.warning}</span>
              <span>Critical {serviceExecutionRun.summary.critical}</span>
            </div>
            <div className="asset-banner">
              <strong>{asset.name}</strong>
              <span>{asset.host}:{asset.port}</span>
              <span>service-owned execution</span>
              <span>{activeTemplateName}</span>
            </div>
          </>
        ) : (
          <p className="helper-text">Local service has not executed an inspection run yet.</p>
        )}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.10.3 Current Release</p>
            <h2>Local Service Inspection Preview</h2>
          </div>
          <button className="secondary-button" onClick={onRefreshLocalServiceInspectionPreview} type="button">
            {isRefreshingServicePreview ? "Refreshing..." : "Refresh Service Preview"}
          </button>
        </div>
        {serviceInspectionRun ? (
          <div className="asset-banner">
            <strong>{asset.name}</strong>
            <span>service-owned preview</span>
            <span>{serviceInspectionRun.summary.total} checks</span>
            <span>{activeTemplateName}</span>
          </div>
        ) : (
          <p className="helper-text">Local service has not generated an inspection preview yet.</p>
        )}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Service Persistence Preview</p>
            <h2>Recent Local Service Runs</h2>
          </div>
          <button className="secondary-button" onClick={onRefreshLocalServiceHistory} type="button">
            {isRefreshingHistory ? "Refreshing..." : "Refresh History"}
          </button>
        </div>

        {showingDemoExperience ? (
          <div className="asset-banner">
            <strong>Demo History</strong>
            <span>sample data only</span>
            <span>{visibleHistoryRuns.length} bundled runs</span>
            <span>safe to explore and export</span>
          </div>
        ) : null}

        <div className="ssh-grid">
          <label><span>Asset Filter</span><input value={historyAssetFilter} onChange={(e) => onHistoryAssetFilterChange(e.target.value)} /></label>
          <label><span>Date From</span><input type="date" value={historyDateFrom} onChange={(e) => onHistoryDateFromChange(e.target.value)} /></label>
          <label><span>Date To</span><input type="date" value={historyDateTo} onChange={(e) => onHistoryDateToChange(e.target.value)} /></label>
        </div>

        {visibleHistoryRuns.length > 0 ? (
          <>
            <div className="results-list">
              {visibleHistoryRuns.map((run) => (
                <article className="result-card" key={`history-${run.id}`} onClick={() => onSelectHistoryRun(run)}>
                  <div className="result-header">
                    <div>
                      <h3>{run.id}</h3>
                      <p>{run.assetId} · {run.summary.total} checks · {run.summary.warning} warn · {run.summary.critical} critical</p>
                      <p className="helper-text">Template: {templateLabel(run.templateId)}</p>
                    </div>
                    <span className={`badge badge-${run.status === "completed" ? "pass" : "critical"}`}>{run.status}</span>
                  </div>
                  <p className="helper-text">{run.createdAt}</p>
                </article>
              ))}
            </div>

            {repeatedProblems.length > 0 ? (
              <div className="service-checks">
                {repeatedProblems.slice(0, 5).map((problem) => (
                  <article className="service-card" key={`repeat-${problem.checkId}`}>
                    <div className="service-card-header">
                      <strong>{problem.title}</strong>
                      <span className="badge badge-warning">{problem.count}x</span>
                    </div>
                    <p>{problem.checkId}</p>
                    <p className="helper-text">
                      Templates: {problem.templateIds.map((templateId) => templateLabel(templateId)).join(", ")}
                    </p>
                  </article>
                ))}
              </div>
            ) : null}

            {selectedHistoryRun ? (
              <div className="results-list">
                <article className="result-card" key={`selected-${selectedHistoryRun.id}`}>
                  <div className="result-header">
                    <div>
                      <h3>Selected Run</h3>
                      <p>{selectedHistoryRun.id} · {selectedHistoryRun.assetId} · {selectedHistoryRun.createdAt}</p>
                      <p className="helper-text">Template: {templateLabel(selectedHistoryRun.templateId)}</p>
                    </div>
                    <span className={`badge badge-${selectedHistoryRun.status === "completed" ? "pass" : "critical"}`}>
                      {selectedHistoryRun.status}
                    </span>
                  </div>
                  <div className="service-actions">
                    <button className="secondary-button" onClick={() => onExportHtmlReport(selectedHistoryRun)} type="button">
                      {isExportingReport ? "Exporting..." : `Export ${reportAudience} HTML`}
                    </button>
                    <button className="secondary-button" onClick={() => onExportPdfReport(selectedHistoryRun)} type="button">
                      {isExportingPdfReport ? "Exporting..." : `Export ${reportAudience} PDF`}
                    </button>
                  </div>
                </article>
              </div>
            ) : null}
          </>
        ) : (
          <p className="helper-text">
            {onboardingMode === "real"
              ? "No persisted runs have been recorded by local service yet."
              : "No persisted runs yet. Explore the bundled demo data or switch to real setup."}
          </p>
        )}
      </section>
    </>
  );
}
