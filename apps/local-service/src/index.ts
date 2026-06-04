import { createDefaultLocalServiceConfig, type LocalServiceConfig } from "./config.ts";

export type LocalServiceStatus =
  | "stopped"
  | "starting"
  | "ready"
  | "degraded"
  | "error";

export interface ManagedPostgresRuntime {
  mode: "managed";
  port: number;
  dataDir: string;
  logDir: string;
  version: string | null;
}

export interface LocalServiceHealth {
  status: LocalServiceStatus;
  runtime: ManagedPostgresRuntime | null;
  checks: Array<{
    id: string;
    label: string;
    status: "pass" | "warning" | "critical";
    detail: string;
  }>;
  updatedAt: string;
}

export interface LocalServiceBootstrap {
  ensureRuntime(): Promise<LocalServiceHealth>;
  shutdown(): Promise<void>;
}

export class StubLocalServiceBootstrap implements LocalServiceBootstrap {
  readonly config: LocalServiceConfig;

  constructor(config: LocalServiceConfig = createDefaultLocalServiceConfig()) {
    this.config = config;
  }

  async ensureRuntime(): Promise<LocalServiceHealth> {
    return {
      status: "starting",
      runtime: {
        mode: "managed",
        port: this.config.postgres.port,
        dataDir: this.config.paths.postgresDataDir,
        logDir: this.config.paths.postgresLogDir,
        version: this.config.postgres.version,
      },
      checks: [
        {
          id: "service.bootstrap",
          label: "Bootstrap Contract",
          status: "warning",
          detail: "Local service bootstrap is stubbed in the 0.3.0 skeleton.",
        },
        {
          id: "service.process",
          label: "Managed Service Process",
          status: "warning",
          detail: "The service entrypoint exists, but the managed runtime is still a minimal skeleton.",
        },
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  async shutdown(): Promise<void> {
    return;
  }
}

export { createDefaultLocalServiceConfig } from "./config.ts";
export type {
  LocalServiceConfig,
  LocalServicePaths,
  ManagedPostgresConfig,
} from "./config.ts";
export type {
  InspectionExecutionRequest,
  InspectionExecutionResponse,
  LocalAssetListResponse,
  LocalAssetUpsertRequest,
  LocalDesktopSettings,
  LocalDesktopSettingsResponse,
  LocalDesktopSettingsUpsertRequest,
  LocalConfigExportPackage,
  LocalConfigExportResponse,
  LocalFilePathRequest,
  LocalHtmlReportExportRequest,
  LocalConfigImportRequest,
  LocalConfigImportResponse,
  LocalInspectionSchedule,
  LocalInspectionScheduleDeleteRequest,
  LocalInspectionScheduleListResponse,
  LocalInspectionScheduleUpsertRequest,
  LocalInspectionScheduleUpsertResponse,
  LocalServiceInspectionHistoryRequest,
  InspectionPreviewRequest,
  InspectionPreviewResponse,
  LocalServiceRuntimeSnapshot,
  LocalServiceCommandResponse,
  LocalServiceInspectionHistoryResponse,
  LocalServiceStatusResponse,
} from "./protocol.ts";
