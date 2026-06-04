import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { builtInLinuxChecks, type CheckDefinition, type CheckResult } from "@opsprobe/checks";
import { createLinuxHostTemplate, type Asset, type InspectionRun, type InspectionTask } from "@opsprobe/core";
import type {
  InspectionExecutionResponse,
  InspectionPreviewResponse,
  LocalInspectionSchedule,
  LocalInspectionScheduleListResponse,
  LocalInspectionScheduleUpsertResponse,
  LocalServiceCommandResponse,
  LocalServiceInspectionHistoryResponse,
  LocalServiceStatusResponse,
} from "@opsprobe/local-service";
import { runInspection, type SshConnectionTestInput, type SshConnectionTestResult } from "@opsprobe/runner";
import "./App.css";

const initialAsset: Asset = {
  id: "asset-linux-001",
  name: "opsprobe-demo-host",
  kind: "linux-host",
  protocol: "ssh",
  host: "10.0.0.12",
  port: 22,
  tags: ["demo", "linux"],
  credential: {
    method: "private-key",
    username: "root",
    secretRef: "/home/user/.ssh/id_rsa",
  },
  createdAt: "2026-06-03T00:00:00.000Z",
  updatedAt: "2026-06-03T00:00:00.000Z",
};

const template = createLinuxHostTemplate(builtInLinuxChecks);

class TauriRunnerAdapter {
  async testConnection(asset: Asset): Promise<SshConnectionTestResult> {
    return invoke<SshConnectionTestResult>("test_ssh_connection", {
      input: {
        host: asset.host,
        port: asset.port,
        username: asset.credential.username,
        authMethod: asset.credential.method,
        secretRef: asset.credential.secretRef,
      } satisfies SshConnectionTestInput,
    });
  }

  async executeCheck(asset: Asset, check: CheckDefinition): Promise<CheckResult> {
    try {
      return await invoke<CheckResult>("run_linux_check", {
        input: {
          host: asset.host,
          port: asset.port,
          username: asset.credential.username,
          authMethod: asset.credential.method,
          secretRef: asset.credential.secretRef,
          checkId: check.id,
          title: check.title,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Check execution failed.";
      return {
        checkId: check.id,
        title: check.title,
        status: "unknown",
        severity: "warning",
        summary: message,
        evidence: [{ label: "Execution", value: "Failed before result normalization" }],
        remediation: "Verify SSH connectivity, command availability, and host permissions.",
      };
    }
  }
}

function App() {
  const [asset, setAsset] = useState<Asset>(initialAsset);
  const [inspectionRun, setInspectionRun] = useState<InspectionRun | null>(null);
  const [serviceInspectionRun, setServiceInspectionRun] = useState<InspectionRun | null>(null);
  const [serviceExecutionRun, setServiceExecutionRun] = useState<InspectionRun | null>(null);
  const [serviceHistoryRuns, setServiceHistoryRuns] = useState<InspectionRun[]>([]);
  const [selectedHistoryRun, setSelectedHistoryRun] = useState<InspectionRun | null>(null);
  const [schedules, setSchedules] = useState<LocalInspectionSchedule[]>([]);
  const [serviceResponse, setServiceResponse] = useState<LocalServiceStatusResponse | null>(null);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [sshResult, setSshResult] = useState<SshConnectionTestResult | null>(null);
  const [isTestingSsh, setIsTestingSsh] = useState(false);
  const [isRefreshingPreview, setIsRefreshingPreview] = useState(false);
  const [isRefreshingService, setIsRefreshingService] = useState(false);
  const [isRefreshingServicePreview, setIsRefreshingServicePreview] = useState(false);
  const [isRunningServiceInspection, setIsRunningServiceInspection] = useState(false);
  const [isRefreshingHistory, setIsRefreshingHistory] = useState(false);
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");
  const [historyAssetFilter, setHistoryAssetFilter] = useState(initialAsset.id);
  const [scheduleIntervalMinutes, setScheduleIntervalMinutes] = useState("15");
  const [isRefreshingSchedules, setIsRefreshingSchedules] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const task: InspectionTask = {
    id: "task-manual-001",
    assetId: asset.id,
    templateId: template.id,
    trigger: "manual",
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };

  const sshInput: SshConnectionTestInput = {
    host: asset.host,
    port: asset.port,
    username: asset.credential.username,
    authMethod: asset.credential.method,
    secretRef: asset.credential.secretRef,
  };

  useEffect(() => {
    void refreshLocalServiceHealth();
    void refreshLocalServiceInspectionPreview();
    void runLocalServiceInspection();
    void refreshLocalServiceHistory();
    void refreshLocalSchedules();
    void refreshInspectionPreview();
  }, []);

  function patchAsset(patch: Partial<Asset>) {
    setAsset((current) => ({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  }

  function patchCredential(patch: Partial<Asset["credential"]>) {
    setAsset((current) => ({
      ...current,
      credential: {
        ...current.credential,
        ...patch,
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  async function refreshLocalServiceHealth() {
    setIsRefreshingService(true);
    try {
      const response = await invoke<LocalServiceStatusResponse>("get_local_service_status");
      setServiceResponse(response);
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleStartLocalService() {
    setIsRefreshingService(true);
    setServiceMessage(null);
    try {
      const message = await invoke<string>("start_local_service");
      setServiceMessage(message);
      await refreshLocalServiceHealth();
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleStopLocalService() {
    setIsRefreshingService(true);
    setServiceMessage(null);
    try {
      const response = await invoke<LocalServiceCommandResponse>("stop_local_service");
      setServiceMessage(response.message);
      await refreshLocalServiceHealth();
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleBootstrapLocalPostgres() {
    setIsRefreshingService(true);
    setServiceMessage(null);
    try {
      const response = await invoke<LocalServiceCommandResponse>("bootstrap_local_service_postgres");
      setServiceMessage(response.message);
      await refreshLocalServiceHealth();
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleStartLocalPostgres() {
    setIsRefreshingService(true);
    setServiceMessage(null);
    try {
      const response = await invoke<LocalServiceCommandResponse>("start_local_service_postgres");
      setServiceMessage(response.message);
      await refreshLocalServiceHealth();
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleStopLocalPostgres() {
    setIsRefreshingService(true);
    setServiceMessage(null);
    try {
      const response = await invoke<LocalServiceCommandResponse>("stop_local_service_postgres");
      setServiceMessage(response.message);
      await refreshLocalServiceHealth();
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function refreshInspectionPreview() {
    setIsRefreshingPreview(true);
    const adapter = new TauriRunnerAdapter();

    try {
      const run = await runInspection(
        {
          asset,
          task,
          template,
          checks: builtInLinuxChecks,
        },
        adapter,
      );
      setInspectionRun(run);
    } finally {
      setIsRefreshingPreview(false);
    }
  }

  async function refreshLocalServiceInspectionPreview() {
    setIsRefreshingServicePreview(true);

    try {
      const response = await invoke<InspectionPreviewResponse>("get_local_service_inspection_preview", {
        input: {
          asset,
        },
      });
      setServiceInspectionRun(response.run);
    } finally {
      setIsRefreshingServicePreview(false);
    }
  }

  async function runLocalServiceInspection() {
    setIsRunningServiceInspection(true);

    try {
      const response = await invoke<InspectionExecutionResponse>("run_local_service_inspection", {
        input: {
          asset,
        },
      });
      setServiceExecutionRun(response.run);
      await refreshLocalServiceHistory();
    } finally {
      setIsRunningServiceInspection(false);
    }
  }

  async function refreshLocalServiceHistory() {
    setIsRefreshingHistory(true);

    try {
      const response = await invoke<LocalServiceInspectionHistoryResponse>(
        "get_local_service_inspection_history",
        {
          input: {
            assetId: historyAssetFilter.trim() || undefined,
            dateFrom: historyDateFrom ? `${historyDateFrom}T00:00:00.000Z` : undefined,
            dateTo: historyDateTo ? `${historyDateTo}T23:59:59.999Z` : undefined,
            limit: 20,
          },
        },
      );
      setServiceHistoryRuns(response.runs);
      setSelectedHistoryRun((current) => {
        if (response.runs.length === 0) {
          return null;
        }

        if (!current) {
          return response.runs[0];
        }

        return response.runs.find((run) => run.id === current.id) ?? response.runs[0];
      });
    } finally {
      setIsRefreshingHistory(false);
    }
  }

  async function refreshLocalSchedules() {
    setIsRefreshingSchedules(true);

    try {
      const response = await invoke<LocalInspectionScheduleListResponse>("get_local_service_schedules");
      setSchedules(response.schedules);
    } finally {
      setIsRefreshingSchedules(false);
    }
  }

  async function handleSaveSchedule() {
    setIsSavingSchedule(true);
    setServiceMessage(null);

    try {
      const response = await invoke<LocalInspectionScheduleUpsertResponse>("upsert_local_service_schedule", {
        input: {
          asset,
          intervalMinutes: Number(scheduleIntervalMinutes) || 15,
          enabled: true,
        },
      });
      setServiceMessage(`Saved schedule ${response.schedule.id}.`);
      await refreshLocalSchedules();
      await refreshLocalServiceHealth();
    } finally {
      setIsSavingSchedule(false);
    }
  }

  async function handleDeleteSchedule(id: string) {
    setIsRefreshingSchedules(true);
    setServiceMessage(null);

    try {
      const response = await invoke<LocalServiceCommandResponse>("delete_local_service_schedule", {
        input: { id },
      });
      setServiceMessage(response.message);
      await refreshLocalSchedules();
      await refreshLocalServiceHealth();
    } finally {
      setIsRefreshingSchedules(false);
    }
  }

  async function handleToggleSchedule(schedule: LocalInspectionSchedule) {
    setIsRefreshingSchedules(true);
    setServiceMessage(null);

    try {
      const response = await invoke<LocalInspectionScheduleUpsertResponse>("upsert_local_service_schedule", {
        input: {
          id: schedule.id,
          asset: schedule.asset,
          intervalMinutes: schedule.intervalMinutes,
          enabled: !schedule.enabled,
        },
      });
      setServiceMessage(
        `${response.schedule.id} ${response.schedule.enabled ? "enabled" : "disabled"} successfully.`,
      );
      await refreshLocalSchedules();
      await refreshLocalServiceHealth();
    } finally {
      setIsRefreshingSchedules(false);
    }
  }

  const repeatedProblems = serviceHistoryRuns
    .flatMap((run) => run.results.filter((result) => result.status !== "pass"))
    .reduce<Array<{ checkId: string; title: string; count: number }>>((summary, result) => {
      const existing = summary.find((item) => item.checkId === result.checkId);
      if (existing) {
        existing.count += 1;
      } else {
        summary.push({
          checkId: result.checkId,
          title: result.title,
          count: 1,
        });
      }
      return summary;
    }, [])
    .sort((left, right) => right.count - left.count);

  async function handleSshTest() {
    setIsTestingSsh(true);
    setSshResult(null);

    try {
      const result = await invoke<SshConnectionTestResult>("test_ssh_connection", {
        input: sshInput,
      });
      setSshResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "SSH test failed.";
      setSshResult({
        ok: false,
        message,
      });
    } finally {
      setIsTestingSsh(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">OpsProbe Open Source Edition</p>
        <h1>Local-first infrastructure inspection for SMB teams.</h1>
        <p className="summary">
          `0.3.0` starts the shift from a single desktop shell toward a desktop UI
          backed by a dedicated local service and managed runtime.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Current Focus</h2>
          <ul>
            <li>Local service bootstrap boundary</li>
            <li>Desktop-visible runtime health</li>
            <li>PostgreSQL-first storage direction</li>
          </ul>
        </article>

        <article className="card">
          <h2>Next Milestone</h2>
          <p className="version">v0.3.0</p>
          <ul>
            <li>Local service process skeleton</li>
            <li>Runtime health in the desktop UI</li>
            <li>Report-oriented runtime structure</li>
          </ul>
        </article>

        <article className="card support-card">
          <h2>Support OpsProbe</h2>
          <p>
            If this project saves you time, you can buy me a coffee and help fund
            the next inspection features.
          </p>
          <a
            className="support-link"
            href="https://github.com/sponsors/ken-water"
            target="_blank"
            rel="noreferrer"
          >
            Buy Me a Coffee
          </a>
        </article>
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.4.0 Delivery</p>
            <h2>Local Scheduling</h2>
          </div>
          <div className="service-actions">
            <button
              className="secondary-button"
              onClick={() => void refreshLocalSchedules()}
              type="button"
            >
              {isRefreshingSchedules ? "Refreshing..." : "Refresh Schedules"}
            </button>
            <button
              className="primary-button"
              onClick={() => void handleSaveSchedule()}
              type="button"
            >
              {isSavingSchedule ? "Saving..." : "Create Schedule"}
            </button>
          </div>
        </div>

        <div className="ssh-grid">
          <label>
            <span>Scheduled Asset</span>
            <input value={asset.id} readOnly />
          </label>

          <label>
            <span>Interval Minutes</span>
            <input
              type="number"
              min="5"
              step="5"
              value={scheduleIntervalMinutes}
              onChange={(event) => setScheduleIntervalMinutes(event.target.value)}
            />
          </label>
        </div>

        <p className="helper-text">
          Schedules are stored locally by the service and executed by the background process. Keep
          the local service running for recurring inspections.
        </p>

        {schedules.length > 0 ? (
          <div className="service-checks">
            {schedules.map((schedule) => (
              <article className="service-card" key={schedule.id}>
                <div className="service-card-header">
                  <strong>{schedule.asset.name}</strong>
                  <span className={`badge badge-${schedule.enabled ? "pass" : "unknown"}`}>
                    {schedule.enabled ? "enabled" : "disabled"}
                  </span>
                </div>
                <p>{schedule.id}</p>
                <p>
                  Every {schedule.intervalMinutes} minutes · next run {schedule.nextRunAt}
                </p>
                <p>
                  Last status: {schedule.lastRunStatus ?? "pending"}
                  {schedule.lastRunAt ? ` at ${schedule.lastRunAt}` : ""}
                </p>
                {schedule.lastError ? <p className="result-error">Failure: {schedule.lastError}</p> : null}
                <div className="service-actions">
                  <button
                    className="secondary-button"
                    onClick={() => void handleToggleSchedule(schedule)}
                    type="button"
                  >
                    {schedule.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => void handleDeleteSchedule(schedule.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="helper-text">No local schedules configured yet.</p>
        )}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.3.0 Preview</p>
            <h2>Local Service Status</h2>
          </div>
          <div className="service-actions">
            <button
              className="secondary-button"
              onClick={() => void refreshLocalServiceHealth()}
              type="button"
            >
              {isRefreshingService ? "Refreshing..." : "Refresh Service Status"}
            </button>
            <button
              className="primary-button"
              onClick={() => void handleStartLocalService()}
              type="button"
            >
              Start Service
            </button>
            <button
              className="secondary-button"
              onClick={() => void handleStopLocalService()}
              type="button"
            >
              Stop Service
            </button>
            <button
              className="secondary-button"
              onClick={() => void handleBootstrapLocalPostgres()}
              type="button"
            >
              Bootstrap PostgreSQL
            </button>
            <button
              className="secondary-button"
              onClick={() => void handleStartLocalPostgres()}
              type="button"
            >
              Start PostgreSQL
            </button>
            <button
              className="secondary-button"
              onClick={() => void handleStopLocalPostgres()}
              type="button"
            >
              Stop PostgreSQL
            </button>
          </div>
        </div>

        {serviceResponse ? (
          <>
            <div className="service-banner">
              <span className={`service-pill service-${serviceResponse.snapshot.status}`}>
                {serviceResponse.snapshot.status}
              </span>
              {serviceResponse.snapshot.health.runtime ? (
                <>
                  <span>port {serviceResponse.snapshot.health.runtime.port}</span>
                  <span>{serviceResponse.snapshot.config.paths.postgresDataDir}</span>
                  <span>{serviceResponse.snapshot.config.paths.postgresLogDir}</span>
                </>
              ) : (
                <span>No runtime metadata available</span>
              )}
            </div>

            <div className="service-checks">
              {serviceResponse.snapshot.health.checks.map((check) => (
                <article className="service-card" key={check.id}>
                  <div className="service-card-header">
                    <strong>{check.label}</strong>
                    <span className={`badge badge-${check.status}`}>{check.status}</span>
                  </div>
                  <p>{check.detail}</p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="helper-text">Local service bootstrap has not been queried yet.</p>
        )}

        {serviceMessage ? <p className="helper-text">{serviceMessage}</p> : null}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.3.0 Preview</p>
            <h2>Local Service Inspection Run</h2>
          </div>
          <button
            className="primary-button"
            onClick={() => void runLocalServiceInspection()}
            type="button"
          >
            {isRunningServiceInspection ? "Running..." : "Run Through Local Service"}
          </button>
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
              <span>
                {asset.host}:{asset.port}
              </span>
              <span>service-owned execution</span>
              <span>{template.name}</span>
            </div>

            <div className="results-list">
              {serviceExecutionRun.results.map((result) => (
                <article className="result-card" key={`service-run-${result.checkId}`}>
                  <div className="result-header">
                    <div>
                      <h3>{result.title}</h3>
                      <p>{result.summary}</p>
                    </div>
                    <span className={`badge badge-${result.status}`}>{result.status}</span>
                  </div>

                  <ul className="evidence-list">
                    {result.evidence.map((item) => (
                      <li key={`service-run-${result.checkId}-${item.label}`}>
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
          </>
        ) : (
          <p className="helper-text">Local service has not executed an inspection run yet.</p>
        )}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.3.0 Preview</p>
            <h2>Local Service Inspection Preview</h2>
          </div>
          <button
            className="secondary-button"
            onClick={() => void refreshLocalServiceInspectionPreview()}
            type="button"
          >
            {isRefreshingServicePreview ? "Refreshing..." : "Refresh Service Preview"}
          </button>
        </div>

        {serviceInspectionRun ? (
          <>
            <div className="asset-banner">
              <strong>{asset.name}</strong>
              <span>service-owned preview</span>
              <span>{serviceInspectionRun.summary.total} checks</span>
            </div>

            <div className="results-list">
              {serviceInspectionRun.results.map((result) => (
                <article className="result-card" key={`service-${result.checkId}`}>
                  <div className="result-header">
                    <div>
                      <h3>{result.title}</h3>
                      <p>{result.summary}</p>
                    </div>
                    <span className={`badge badge-${result.status}`}>{result.status}</span>
                  </div>

                  <ul className="evidence-list">
                    {result.evidence.map((item) => (
                      <li key={`service-${result.checkId}-${item.label}`}>
                        <strong>{item.label}:</strong> {item.value}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </>
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
          <button
            className="secondary-button"
            onClick={() => void refreshLocalServiceHistory()}
            type="button"
          >
            {isRefreshingHistory ? "Refreshing..." : "Refresh History"}
          </button>
        </div>

        <div className="ssh-grid">
          <label>
            <span>Asset Filter</span>
            <input
              value={historyAssetFilter}
              onChange={(event) => setHistoryAssetFilter(event.target.value)}
              placeholder="asset-linux-001"
            />
          </label>

          <label>
            <span>Date From</span>
            <input
              type="date"
              value={historyDateFrom}
              onChange={(event) => setHistoryDateFrom(event.target.value)}
            />
          </label>

          <label>
            <span>Date To</span>
            <input
              type="date"
              value={historyDateTo}
              onChange={(event) => setHistoryDateTo(event.target.value)}
            />
          </label>
        </div>

        {serviceHistoryRuns.length > 0 ? (
          <>
            <div className="results-list">
              {serviceHistoryRuns.map((run) => (
                <article
                  className="result-card"
                  key={`history-${run.id}`}
                  onClick={() => setSelectedHistoryRun(run)}
                >
                  <div className="result-header">
                    <div>
                      <h3>{run.id}</h3>
                      <p>
                        {run.assetId} · {run.summary.total} checks · {run.summary.warning} warn ·{" "}
                        {run.summary.critical} critical
                      </p>
                    </div>
                    <span className={`badge badge-${run.status === "completed" ? "pass" : "critical"}`}>
                      {run.status}
                    </span>
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
                  </article>
                ))}
              </div>
            ) : (
              <p className="helper-text">No repeated problem checks were found in the filtered history.</p>
            )}

            {selectedHistoryRun ? (
              <div className="results-list">
                <article className="result-card" key={`selected-${selectedHistoryRun.id}`}>
                  <div className="result-header">
                    <div>
                      <h3>Selected Run</h3>
                      <p>
                        {selectedHistoryRun.id} · {selectedHistoryRun.assetId} · {selectedHistoryRun.createdAt}
                      </p>
                    </div>
                    <span
                      className={`badge badge-${
                        selectedHistoryRun.status === "completed" ? "pass" : "critical"
                      }`}
                    >
                      {selectedHistoryRun.status}
                    </span>
                  </div>

                  {selectedHistoryRun.results.length > 0 ? (
                    <div className="results-list">
                      {selectedHistoryRun.results.map((result) => (
                        <article className="result-card" key={`selected-${selectedHistoryRun.id}-${result.checkId}`}>
                          <div className="result-header">
                            <div>
                              <h3>{result.title}</h3>
                              <p>{result.summary}</p>
                            </div>
                            <span className={`badge badge-${result.status}`}>{result.status}</span>
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
                  ) : (
                    <p className="helper-text">This historical run has no normalized check results to reopen.</p>
                  )}
                </article>
              </div>
            ) : null}
          </>
        ) : (
          <p className="helper-text">No persisted runs have been recorded by local service yet.</p>
        )}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Legacy Comparison</p>
            <h2>Linux Host Asset</h2>
          </div>
        </div>

        <div className="ssh-grid">
          <label>
            <span>Asset Name</span>
            <input
              value={asset.name}
              onChange={(event) => patchAsset({ name: event.target.value })}
              placeholder="opsprobe-demo-host"
            />
          </label>

          <label>
            <span>Host</span>
            <input
              value={asset.host}
              onChange={(event) => patchAsset({ host: event.target.value })}
              placeholder="10.0.0.12"
            />
          </label>

          <label>
            <span>Port</span>
            <input
              type="number"
              value={asset.port}
              onChange={(event) => patchAsset({ port: Number(event.target.value) || 22 })}
              placeholder="22"
            />
          </label>

          <label>
            <span>Username</span>
            <input
              value={asset.credential.username}
              onChange={(event) => patchCredential({ username: event.target.value })}
              placeholder="root"
            />
          </label>

          <label>
            <span>Auth Method</span>
            <select
              value={asset.credential.method}
              onChange={(event) =>
                patchCredential({
                  method: event.target.value as SshConnectionTestInput["authMethod"],
                })
              }
            >
              <option value="private-key">private-key</option>
              <option value="password">password</option>
            </select>
          </label>

          <label>
            <span>Tags</span>
            <input
              value={asset.tags.join(", ")}
              onChange={(event) =>
                patchAsset({
                  tags: event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                })
              }
              placeholder="demo, linux"
            />
          </label>
        </div>

        <label className="field-block">
          <span>
            {asset.credential.method === "private-key" ? "Private Key Path" : "Password Secret"}
          </span>
          <input
            type={asset.credential.method === "password" ? "password" : "text"}
            value={asset.credential.secretRef}
            onChange={(event) => patchCredential({ secretRef: event.target.value })}
            placeholder={
              asset.credential.method === "private-key"
                ? "/home/user/.ssh/id_rsa"
                : "Enter the SSH password used for this host."
            }
          />
        </label>

        <div className="ssh-actions">
          <button className="primary-button" onClick={() => void handleSshTest()} type="button">
            {isTestingSsh ? "Testing..." : "Test SSH Connection"}
          </button>
          <button
            className="secondary-button"
            onClick={() => void refreshInspectionPreview()}
            type="button"
          >
            {isRefreshingPreview ? "Refreshing..." : "Refresh Inspection Preview"}
          </button>
          <p className="helper-text">
            Asset fields are shared by the SSH test and the inspection runner preview. Password mode
            requires `sshpass` on the local machine.
          </p>
        </div>

        {sshResult ? (
          <p className={`connection-result ${sshResult.ok ? "result-ok" : "result-error"}`}>
            {sshResult.message}
          </p>
        ) : null}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Legacy Comparison</p>
            <h2>Desktop Runner Preview</h2>
          </div>
          {inspectionRun ? (
            <div className="summary-strip">
              <span>Total {inspectionRun.summary.total}</span>
              <span>Pass {inspectionRun.summary.passed}</span>
              <span>Warn {inspectionRun.summary.warning}</span>
              <span>Critical {inspectionRun.summary.critical}</span>
            </div>
          ) : null}
        </div>

        <div className="asset-banner">
          <strong>{asset.name}</strong>
          <span>
            {asset.host}:{asset.port}
          </span>
          <span>{template.name}</span>
          <span>{asset.tags.join(", ") || "no tags"}</span>
        </div>

        <div className="results-list">
          {inspectionRun?.results.map((result) => (
            <article className="result-card" key={result.checkId}>
              <div className="result-header">
                <div>
                  <h3>{result.title}</h3>
                  <p>{result.summary}</p>
                </div>
                <span className={`badge badge-${result.status}`}>{result.status}</span>
              </div>

              <ul className="evidence-list">
                {result.evidence.map((item) => (
                  <li key={`${result.checkId}-${item.label}`}>
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
      </section>
    </main>
  );
}

export default App;
