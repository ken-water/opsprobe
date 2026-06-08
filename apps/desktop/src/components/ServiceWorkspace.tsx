import type {
  LocalInspectionSchedule,
  LocalServiceStatusResponse,
} from "@opsprobe/local-service";
import { DesktopDataTable, DesktopSectionHeader, formatDateTime, formatListDate, formatStatusLabel } from "./DesktopUI";

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
    <section className="run-panel">
      <DesktopSectionHeader
        eyebrow="Assets & Strategy"
        title="Schedules And Managed Runtime"
        subtitle="Define recurring inspection cadence for the active asset and keep the local runtime healthy enough to execute it."
      />

      <div className="service-workspace">
        <div className="service-runtime-panel">
          <div className="assets-panel-header">
            <strong>Runtime Control</strong>
            <span>{formatStatusLabel(serviceResponse?.snapshot.status ?? "unknown")}</span>
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
          <div className="inline-note">
            <strong>Managed runtime</strong>
            <span>Keep the local background service running if you want schedules, history, and exports to stay current.</span>
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
                      <span className={`badge badge-${check.status}`}>{formatStatusLabel(check.status)}</span>
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
        </div>

        <div className="service-schedules-panel">
          <div className="assets-panel-header">
            <strong>Schedules</strong>
            <span>{schedules.length} total</span>
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

          <div className="service-actions">
            <button className="secondary-button" onClick={onRefreshSchedules} type="button">
              {isRefreshingSchedules ? "Refreshing..." : "Refresh Schedules"}
            </button>
            <button className="primary-button" onClick={onSaveSchedule} type="button">
              {isSavingSchedule ? "Saving..." : "Create Schedule"}
            </button>
          </div>
          <div className="inline-note">
            <strong>Recurring plan</strong>
            <span>The active asset and template above are what the local service will execute on each schedule tick.</span>
          </div>

          <p className="helper-text">
            Schedules are stored locally by the service and executed by the background process. Keep
            the local service running for recurring inspections. Assets with `verification-required`
            credentials cannot resume schedules until SSH validation succeeds.
          </p>

          <DesktopDataTable
            columns={[
              {
                key: "asset",
                header: "Asset",
                width: "minmax(220px, 1.3fr)",
                render: (schedule) => (
                  <div className="data-table-primary">
                    <strong>{schedule.asset.name}</strong>
                    <span>{schedule.id}</span>
                  </div>
                ),
              },
              {
                key: "plan",
                header: "Schedule",
                width: "minmax(220px, 1.2fr)",
                render: (schedule) => (
                  <div className="data-table-primary">
                    <strong>Every {schedule.intervalMinutes} min</strong>
                    <span>Next {formatListDate(schedule.nextRunAt)}</span>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Last Result",
                width: "minmax(170px, 1fr)",
                render: (schedule) => (
                  <div className="data-table-primary">
                    <strong>{formatStatusLabel(schedule.lastRunStatus ?? "pending")}</strong>
                    <span>{schedule.lastRunAt ? formatDateTime(schedule.lastRunAt) : "No run yet"}</span>
                  </div>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                width: "minmax(180px, 0.9fr)",
                render: (schedule) => (
                  <div className="data-table-actions">
                    <button className="secondary-button" onClick={() => onToggleSchedule(schedule)} type="button">
                      {schedule.enabled ? "Disable" : "Enable"}
                    </button>
                    <button className="secondary-button" onClick={() => onDeleteSchedule(schedule.id)} type="button">
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
            rows={schedules}
            getRowKey={(schedule) => schedule.id}
            emptyTitle="No Local Schedules"
            emptyDetail="Create the first recurring inspection after the asset and local runtime are ready."
          />
        </div>
      </div>
    </section>
  );
}
