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
  onOpenExportFile: (path: string) => void;
  onRevealExportFile: (path: string) => void;
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
    onOpenExportFile,
    onRevealExportFile,
    templateLabel,
  } = props;

  const activeRun = selectedHistoryRun ?? serviceExecutionRun ?? visibleHistoryRuns[0] ?? null;
  const activeCriticalResults = activeRun?.results.filter((result) => result.status === "critical") ?? [];
  const activeWarningResults = activeRun?.results.filter((result) => result.status === "warning") ?? [];
  const priorityResults =
    activeCriticalResults.length > 0 ? activeCriticalResults : activeWarningResults.length > 0 ? activeWarningResults : activeRun?.results.slice(0, 3) ?? [];
  const activeResultCount = activeRun?.results.length ?? 0;
  const currentConclusionTitle =
    activeRun?.summary.critical && activeRun.summary.critical > 0
      ? `${activeRun.summary.critical} critical finding${activeRun.summary.critical === 1 ? "" : "s"} need attention`
      : activeRun?.summary.warning && activeRun.summary.warning > 0
        ? `${activeRun.summary.warning} warning${activeRun.summary.warning === 1 ? "" : "s"} should be reviewed`
        : activeRun
          ? "This result is ready to share"
          : "No current result";
  const currentConclusionDetail =
    activeRun?.summary.critical && activeRun.summary.critical > 0
      ? "Start with the critical findings below, then decide whether this target is ready to share or rerun."
      : activeRun?.summary.warning && activeRun.summary.warning > 0
        ? "The inspection path is working, but warnings still need review before you present this result as complete."
        : activeRun
          ? "The result has no warning or critical findings. Export or compare only after you confirm the evidence looks correct."
          : "Run or select an inspection first.";

  return (
    <>
      <section className="run-panel">
        <DesktopSectionHeader
          eyebrow="Inspection Results"
          title="Current Result"
          subtitle="Read the latest conclusion first. Export only after the main findings and remediation steps make sense."
          actions={
            <div className="service-actions">
              <button className="primary-button" onClick={onRunLocalServiceInspection} type="button">
                {isRunningServiceInspection ? "Running..." : "Run Through Local Service"}
              </button>
              {activeRun ? (
                <>
                  <button className="secondary-button" onClick={() => onExportHtmlReport(activeRun)} type="button">
                    {isExportingReport ? "Exporting..." : `Export ${reportAudience} HTML`}
                  </button>
                  <button className="secondary-button" onClick={() => onExportPdfReport(activeRun)} type="button">
                    {isExportingPdfReport ? "Exporting..." : `Export ${reportAudience} PDF`}
                  </button>
                </>
              ) : null}
            </div>
          }
        />

        {activeRun ? (
          <div className="results-overview-stack">
            <article className="history-detail-card results-conclusion-card">
              <div className="assets-panel-header">
                <strong>Current Conclusion</strong>
                <span>{activeRun.id}</span>
              </div>
              <div className="summary-strip">
                <span>Total {activeRun.summary.total}</span>
                <span>Pass {activeRun.summary.passed}</span>
                <span>Warn {activeRun.summary.warning}</span>
                <span>Critical {activeRun.summary.critical}</span>
              </div>
              <div className="asset-banner">
                <strong>{asset.name}</strong>
                <span>{asset.host}:{asset.port}</span>
                <span>{templateLabel(activeRun.templateId)}</span>
                <span>{formatDateTime(activeRun.createdAt)}</span>
              </div>

              <section className="results-current-story">
                <div className="results-current-story-copy">
                  <p className="eyebrow">Read This First</p>
                  <h3>{currentConclusionTitle}</h3>
                  <p className="helper-text">{currentConclusionDetail}</p>
                </div>
                <div className="results-current-story-metrics">
                  <div><span>Checks</span><strong>{activeRun.summary.total}</strong></div>
                  <div><span>Critical</span><strong>{activeRun.summary.critical}</strong></div>
                  <div><span>Warnings</span><strong>{activeRun.summary.warning}</strong></div>
                  <div><span>Evidence</span><strong>{activeResultCount}</strong></div>
                </div>
              </section>
            </article>

            <div className="results-reading-grid">
              <article className="history-side-card results-priority-card">
                <h3>What To Do Next</h3>
                <div className="history-side-list">
                  {priorityResults.map((result) => (
                    <article className="service-card" key={`priority-${activeRun.id}-${result.checkId}`}>
                      <div className="service-card-header">
                        <strong>{result.title}</strong>
                        <span className={`badge badge-${result.status}`}>{formatStatusLabel(result.status)}</span>
                      </div>
                      <p>{result.summary}</p>
                      <p className="helper-text">{result.remediation}</p>
                    </article>
                  ))}
                </div>
              </article>

              <article className="history-side-card results-export-card">
                <h3>Export This Result</h3>
                <div className="ssh-grid">
                  <label>
                    <span>Report File</span>
                    <input value={reportPath} onChange={(event) => onReportPathChange(event.target.value)} />
                  </label>
                  <label>
                    <span>PDF Report File</span>
                    <input value={pdfReportPath} onChange={(event) => onPdfReportPathChange(event.target.value)} />
                  </label>
                </div>
                <div className="inline-note">
                  <strong>Audience: {reportAudience}</strong>
                  <span>Export only after the conclusion and next actions are clear.</span>
                </div>
                <div className="service-actions">
                  <button className="secondary-button" onClick={() => onExportHtmlReport(activeRun)} type="button">
                    {isExportingReport ? "Exporting..." : `Export ${reportAudience} HTML`}
                  </button>
                  <button className="secondary-button" onClick={() => onExportPdfReport(activeRun)} type="button">
                    {isExportingPdfReport ? "Exporting..." : `Export ${reportAudience} PDF`}
                  </button>
                </div>
                <div className="service-actions">
                  <button className="secondary-button" onClick={() => onOpenExportFile(reportPath)} type="button">
                    Open HTML File
                  </button>
                  <button className="secondary-button" onClick={() => onRevealExportFile(reportPath)} type="button">
                    Show HTML In Folder
                  </button>
                  <button className="secondary-button" onClick={() => onOpenExportFile(pdfReportPath)} type="button">
                    Open PDF File
                  </button>
                  <button className="secondary-button" onClick={() => onRevealExportFile(pdfReportPath)} type="button">
                    Show PDF In Folder
                  </button>
                </div>
              </article>
            </div>

            <div className="results-insight-grid">
              <article className="history-side-card">
                <h3>Top Repeated Problems</h3>
                <div className="history-side-list">
                  {repeatedProblems.length > 0 ? (
                    repeatedProblems.slice(0, 3).map((problem) => (
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
                    ))
                  ) : (
                    <p className="helper-text">No repeated warning or critical failures are currently grouped.</p>
                  )}
                </div>
              </article>

              <article className="history-side-card">
                <h3>Result Snapshot</h3>
                <div className="hub-kpi-list results-kpi-list">
                  <div><span>Checks</span><strong>{activeRun.summary.total}</strong></div>
                  <div><span>Critical</span><strong>{activeRun.summary.critical}</strong></div>
                  <div><span>Warnings</span><strong>{activeRun.summary.warning}</strong></div>
                  <div><span>Evidence Items</span><strong>{activeResultCount}</strong></div>
                </div>
                {serviceInspectionRun ? (
                  <div className="inline-note">
                    <strong>Preview available</strong>
                    <span>{serviceInspectionRun.summary.total} preview checks are ready for comparison before another run.</span>
                  </div>
                ) : (
                  <p className="helper-text">No separate preview is currently loaded.</p>
                )}
              </article>
            </div>

            <article className="history-detail-card">
              <div className="assets-panel-header">
                <strong>Evidence And Remediation</strong>
                <span>{activeRun.results.length} checks</span>
              </div>
              <div className="results-list">
                {activeRun.results.map((result) => (
                  <article className={`result-card result-card-${result.status}`} key={`selected-${activeRun.id}-${result.checkId}`}>
                    <div className="result-header">
                      <div>
                        <h3>{result.title}</h3>
                        <p>{result.summary}</p>
                        <p className="helper-text">{templateLabel(activeRun.templateId)}</p>
                      </div>
                      <span className={`badge badge-${result.status}`}>{formatStatusLabel(result.status)}</span>
                    </div>
                    <ul className="evidence-list">
                      {result.evidence.map((item) => (
                        <li key={`selected-${activeRun.id}-${result.checkId}-${item.label}`}>
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
          </div>
        ) : (
          <p className="helper-text">Local service has not executed an inspection run yet.</p>
        )}
      </section>

      <section className="run-panel">
        <DesktopSectionHeader
          eyebrow="Inspection Results"
          title="History And Comparison"
          subtitle="Use this after the current result is clear. Compare older runs, reopen a selected run, or inspect trends."
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
          <label>
            <span>Asset Filter</span>
            <input value={historyAssetFilter} onChange={(event) => onHistoryAssetFilterChange(event.target.value)} />
          </label>
          <label>
            <span>Date From</span>
            <input type="date" value={historyDateFrom} onChange={(event) => onHistoryDateFromChange(event.target.value)} />
          </label>
          <label>
            <span>Date To</span>
            <input type="date" value={historyDateTo} onChange={(event) => onHistoryDateToChange(event.target.value)} />
          </label>
        </div>
        <div className="inline-note">
          <strong>Run filter</strong>
          <span>Use asset and date filters to narrow inspection history before comparing trends or exporting another run.</span>
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
                isRowActive={(run) => activeRun?.id === run.id}
                isLoading={isRefreshingHistory}
                loadingTitle="Loading run history"
                loadingDetail="Fetching recent inspection evidence from the local service."
                emptyTitle="No Runs Available"
                emptyDetail="Select demo mode or execute a local service run to start building history."
              />
            </div>

            <div className="history-detail-panel">
              {activeRun ? (
                <article className="history-detail-card">
                  <div className="result-header">
                    <div>
                      <h3>Selected Run Summary</h3>
                      <p>{activeRun.id} · {activeRun.assetId}</p>
                      <p className="helper-text">Template: {templateLabel(activeRun.templateId)}</p>
                      <p className="helper-text">{formatDateTime(activeRun.createdAt)}</p>
                    </div>
                    <span className={`badge badge-${activeRun.status === "completed" ? "pass" : "critical"}`}>
                      {formatStatusLabel(activeRun.status)}
                    </span>
                  </div>

                  <div className="summary-strip">
                    <span>Total {activeRun.summary.total}</span>
                    <span>Pass {activeRun.summary.passed}</span>
                    <span>Warn {activeRun.summary.warning}</span>
                    <span>Critical {activeRun.summary.critical}</span>
                  </div>

                  <p className="helper-text">
                    Use the current result section above when you want to export or act on the selected run.
                  </p>
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
