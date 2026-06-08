import type {
  LocalInspectionSchedule,
  LocalServiceStatusResponse,
} from "@opsprobe/local-service";

interface ServiceWorkspaceProps {
  assetId: string;
  activeTemplateName: string;
  scheduleIntervalMinutes: string;
  schedules: LocalInspectionSchedule[];
  serviceResponse: LocalServiceStatusResponse | null;
  serviceMessage: string | null;
  isRefreshingSchedules: boolean;
  isSavingSchedule: boolean;
  isRefreshingService: boolean;
  onScheduleIntervalChange: (value: string) => void;
  onRefreshSchedules: () => void;
  onSaveSchedule: () => void;
  onToggleSchedule: (schedule: LocalInspectionSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onRefreshServiceHealth: () => void;
  onStartLocalService: () => void;
  onStopLocalService: () => void;
  onRestartLocalService: () => void;
  onBootstrapLocalPostgres: () => void;
  onStartLocalPostgres: () => void;
  onStopLocalPostgres: () => void;
}

export function ServiceWorkspace({
  assetId,
  activeTemplateName,
  scheduleIntervalMinutes,
  schedules,
  serviceResponse,
  serviceMessage,
  isRefreshingSchedules,
  isSavingSchedule,
  isRefreshingService,
  onScheduleIntervalChange,
  onRefreshSchedules,
  onSaveSchedule,
  onToggleSchedule,
  onDeleteSchedule,
  onRefreshServiceHealth,
  onStartLocalService,
  onStopLocalService,
  onRestartLocalService,
  onBootstrapLocalPostgres,
  onStartLocalPostgres,
  onStopLocalPostgres,
}: ServiceWorkspaceProps) {
  return (
    <>
      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.10.3 Current Release</p>
            <h2>Local Scheduling</h2>
          </div>
          <div className="service-actions">
            <button className="secondary-button" onClick={onRefreshSchedules} type="button">
              {isRefreshingSchedules ? "Refreshing..." : "Refresh Schedules"}
            </button>
            <button className="primary-button" onClick={onSaveSchedule} type="button">
              {isSavingSchedule ? "Saving..." : "Create Schedule"}
            </button>
          </div>
        </div>

        <div className="ssh-grid">
          <label>
            <span>Scheduled Asset</span>
            <input value={assetId} readOnly />
          </label>
          <label>
            <span>Template</span>
            <input value={activeTemplateName} readOnly />
          </label>
          <label>
            <span>Interval Minutes</span>
            <input
              type="number"
              min="5"
              step="5"
              value={scheduleIntervalMinutes}
              onChange={(event) => onScheduleIntervalChange(event.target.value)}
            />
          </label>
        </div>

        <p className="helper-text">
          Schedules are stored locally by the service and executed by the background process. Keep
          the local service running for recurring inspections. Assets with `verification-required`
          credentials cannot resume schedules until SSH validation succeeds.
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
                <p>Template: {schedule.templateId}</p>
                <p>
                  Last status: {schedule.lastRunStatus ?? "pending"}
                  {schedule.lastRunAt ? ` at ${schedule.lastRunAt}` : ""}
                </p>
                {schedule.lastError ? <p className="result-error">Failure: {schedule.lastError}</p> : null}
                <div className="service-actions">
                  <button className="secondary-button" onClick={() => onToggleSchedule(schedule)} type="button">
                    {schedule.enabled ? "Disable" : "Enable"}
                  </button>
                  <button className="secondary-button" onClick={() => onDeleteSchedule(schedule.id)} type="button">
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
            <p className="eyebrow">0.10.3 Current Release</p>
            <h2>Local Service Status</h2>
          </div>
          <div className="service-actions">
            <button className="secondary-button" onClick={onRefreshServiceHealth} type="button">
              {isRefreshingService ? "Refreshing..." : "Refresh Service Status"}
            </button>
            <button className="primary-button" onClick={onStartLocalService} type="button">Start Service</button>
            <button className="secondary-button" onClick={onStopLocalService} type="button">Stop Service</button>
            <button className="secondary-button" onClick={onRestartLocalService} type="button">Restart Service</button>
            <button className="secondary-button" onClick={onBootstrapLocalPostgres} type="button">Bootstrap PostgreSQL</button>
            <button className="secondary-button" onClick={onStartLocalPostgres} type="button">Start PostgreSQL</button>
            <button className="secondary-button" onClick={onStopLocalPostgres} type="button">Stop PostgreSQL</button>
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

        {serviceResponse?.snapshot.recoveryActions.length ? (
          <div className="service-checks">
            {serviceResponse.snapshot.recoveryActions.map((action) => (
              <article className="service-card" key={action.id}>
                <div className="service-card-header">
                  <strong>{action.label}</strong>
                  <span className="badge badge-warning">recovery</span>
                </div>
                <p>{action.detail}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
