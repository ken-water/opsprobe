import type { Asset, InspectionRun } from "@opsprobe/core";
import type { ReportAudience } from "@opsprobe/report";
import {
  DesktopDataTable,
  DesktopEmptyState,
  DesktopSectionHeader,
  formatDateTime,
  formatListDate,
  formatStatusLabel,
} from "./DesktopUI";

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
        <DesktopSectionHeader
          eyebrow="Inspection Results"
          title="Run And Export"
          subtitle="Run service-owned inspections and choose where HTML or PDF evidence is written before sharing results."
          actions={
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
          }
        />

        <div className="ssh-grid">
          <label><span>Report File</span><input value={reportPath} onChange={(e) => onReportPathChange(e.target.value)} /></label>
          <label><span>PDF Report File</span><input value={pdfReportPath} onChange={(e) => onPdfReportPathChange(e.target.value)} /></label>
        </div>
        <div className="inline-note">
          <strong>Export destination</strong>
          <span>HTML and PDF export use the current audience mode and write to the local paths shown above.</span>
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
        <DesktopSectionHeader
          eyebrow="Inspection Results"
          title="Recent Runs"
          subtitle="Filter recent runs, inspect repeated failures, and reopen normalized results without leaving the desktop workflow."
          actions={
            <div className="service-actions">
              <button className="secondary-button" onClick={onRefreshLocalServiceInspectionPreview} type="button">
                {isRefreshingServicePreview ? "Refreshing..." : "Refresh Preview"}
              </button>
              <button className="secondary-button" onClick={onRefreshLocalServiceHistory} type="button">
                {isRefreshingHistory ? "Refreshing..." : "Refresh History"}
              </button>
            </div>
          }
        />

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
        <div className="inline-note">
          <strong>Run filter</strong>
          <span>Use asset and date filters to narrow inspection history before reviewing repeated failures or exporting detail.</span>
        </div>

        {visibleHistoryRuns.length > 0 ? (
          <div className="history-workspace">
            <div className="history-list-panel">
              <DesktopDataTable
                columns={[
                  {
                    key: "run",
                    header: "Run",
                    width: "minmax(220px, 1.3fr)",
                    render: (run) => (
                      <div className="data-table-primary">
                        <strong>{run.id}</strong>
                        <span>{run.assetId}</span>
                      </div>
                    ),
                  },
                  {
                    key: "template",
                    header: "Template",
                    width: "minmax(180px, 1fr)",
                    render: (run) => templateLabel(run.templateId),
                  },
                  {
                    key: "summary",
                    header: "Results",
                    width: "minmax(200px, 1.1fr)",
                    render: (run) => (
                      <div className="data-table-primary">
                        <strong>{run.summary.total} checks</strong>
                        <span>{run.summary.warning} warn · {run.summary.critical} critical</span>
                      </div>
                    ),
                  },
                  {
                    key: "created",
                    header: "Created At",
                    width: "minmax(140px, 0.9fr)",
                    render: (run) => formatListDate(run.createdAt),
                  },
                ]}
                rows={visibleHistoryRuns}
                getRowKey={(run) => run.id}
                onRowClick={onSelectHistoryRun}
                isRowActive={(run) => selectedHistoryRun?.id === run.id}
                emptyTitle="No Runs Available"
                emptyDetail="Select demo mode or execute a local service run to start building history."
              />

              {repeatedProblems.length > 0 ? (
                <div className="history-side-card">
                  <h3>Repeated Problems</h3>
                  <div className="history-side-list">
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
                </div>
              ) : null}
            </div>

            <div className="history-detail-panel">
              {selectedHistoryRun ? (
                <article className="history-detail-card">
                  <div className="result-header">
                    <div>
                      <h3>Selected Run</h3>
                      <p>{selectedHistoryRun.id} · {selectedHistoryRun.assetId}</p>
                      <p className="helper-text">Template: {templateLabel(selectedHistoryRun.templateId)}</p>
                      <p className="helper-text">{formatDateTime(selectedHistoryRun.createdAt)}</p>
                    </div>
                    <span className={`badge badge-${selectedHistoryRun.status === "completed" ? "pass" : "critical"}`}>
                      {formatStatusLabel(selectedHistoryRun.status)}
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

                  <div className="summary-strip">
                    <span>Total {selectedHistoryRun.summary.total}</span>
                    <span>Pass {selectedHistoryRun.summary.passed}</span>
                    <span>Warn {selectedHistoryRun.summary.warning}</span>
                    <span>Critical {selectedHistoryRun.summary.critical}</span>
                  </div>

                  <div className="results-list">
                    {selectedHistoryRun.results.map((result) => (
                      <article className={`result-card result-card-${result.status}`} key={`selected-${selectedHistoryRun.id}-${result.checkId}`}>
                        <div className="result-header">
                          <div>
                            <h3>{result.title}</h3>
                            <p>{result.summary}</p>
                            <p className="helper-text">{templateLabel(selectedHistoryRun.templateId)}</p>
                          </div>
                          <span className={`badge badge-${result.status}`}>{formatStatusLabel(result.status)}</span>
                        </div>
                        <ul className="evidence-list">
                          {result.evidence.map((item) => (
                            <li key={`selected-${selectedHistoryRun.id}-${result.checkId}-${item.label}`}>
                              <strong>{item.label}:</strong> {item.value}
                            </li>
                          ))}
                        </ul>
                        <p className="remediation">
                          <strong>Remediation:</strong> {result.remediation}
                        </p>
                      </article>
                    ))}
                  </div>
                </article>
              ) : (
                <DesktopEmptyState
                  title="No Run Selected"
                  detail="Select a run from the left list to inspect checks, evidence, and export actions."
                />
              )}
            </div>
          </div>
        ) : (
          <p className="helper-text helper-empty-state">
            {onboardingMode === "real"
              ? "No persisted runs have been recorded by local service yet."
              : "No persisted runs yet. Explore the bundled demo data or switch to real setup."}
          </p>
        )}

        {serviceInspectionRun ? (
          <div className="asset-banner">
            <strong>{asset.name}</strong>
            <span>service-owned preview</span>
            <span>{serviceInspectionRun.summary.total} checks</span>
            <span>{activeTemplateName}</span>
          </div>
        ) : null}
      </section>
    </>
  );
}
