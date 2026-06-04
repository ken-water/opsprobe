import type { LocalServiceHealth, LocalServiceStatus } from "./index";
import type { LocalServiceConfig } from "./config";
import type { Asset, InspectionRun, InspectionTemplate } from "@opsprobe/core";

export interface LocalServiceRuntimeSnapshot {
  status: LocalServiceStatus;
  config: LocalServiceConfig;
  health: LocalServiceHealth;
}

export interface LocalServiceStatusResponse {
  ok: boolean;
  snapshot: LocalServiceRuntimeSnapshot;
}

export interface LocalServiceCommandResponse {
  ok: boolean;
  message: string;
}

export interface InspectionPreviewRequest {
  asset: Asset;
}

export interface InspectionPreviewResponse {
  ok: boolean;
  run: InspectionRun;
  source: "local-service";
}

export interface InspectionExecutionRequest {
  asset: Asset;
  trigger?: "manual" | "scheduled";
  taskId?: string;
}

export interface InspectionExecutionResponse {
  ok: boolean;
  run: InspectionRun;
  source: "local-service";
}

export interface LocalServiceInspectionHistoryResponse {
  ok: boolean;
  runs: InspectionRun[];
  source: "local-service";
}

export interface LocalServiceInspectionHistoryRequest {
  assetId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface LocalInspectionSchedule {
  id: string;
  asset: Asset;
  intervalMinutes: number;
  enabled: boolean;
  nextRunAt: string;
  lastRunAt?: string;
  lastRunStatus?: "completed" | "failed";
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalInspectionScheduleListResponse {
  ok: boolean;
  schedules: LocalInspectionSchedule[];
  source: "local-service";
}

export interface LocalInspectionScheduleUpsertRequest {
  id?: string;
  asset: Asset;
  intervalMinutes: number;
  enabled?: boolean;
}

export interface LocalInspectionScheduleDeleteRequest {
  id: string;
}

export interface LocalInspectionScheduleUpsertResponse {
  ok: boolean;
  schedule: LocalInspectionSchedule;
  source: "local-service";
}

export interface PortableAssetCredentialBinding {
  method: Asset["credential"]["method"];
  username: string;
  bindingStatus: "rebind-required";
}

export interface PortableAsset extends Omit<Asset, "credential"> {
  credential: PortableAssetCredentialBinding;
}

export interface LocalConfigExportPackage {
  version: 1;
  exportedAt: string;
  assets: PortableAsset[];
  templates: InspectionTemplate[];
  schedules: Array<{
    id: string;
    assetId: string;
    intervalMinutes: number;
    enabled: boolean;
    nextRunAt: string;
    lastRunAt?: string;
    lastRunStatus?: "completed" | "failed";
    lastError?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  settings: {
    postgresPort: number;
  };
}

export interface LocalConfigExportResponse {
  ok: boolean;
  package: LocalConfigExportPackage;
  source: "local-service";
}

export interface LocalConfigImportRequest {
  package: LocalConfigExportPackage;
}

export interface LocalConfigImportResponse {
  ok: boolean;
  importedAssets: number;
  importedTemplates: number;
  importedSchedules: number;
  source: "local-service";
}

export interface LocalAssetListResponse {
  ok: boolean;
  assets: Asset[];
  source: "local-service";
}

export interface LocalAssetUpsertRequest {
  asset: Asset;
}

export interface LocalDesktopSettings {
  activeAsset?: Asset;
  historyAssetFilter?: string;
  historyDateFrom?: string;
  historyDateTo?: string;
  scheduleIntervalMinutes?: string;
  migrationPath?: string;
  reportPath?: string;
  pdfReportPath?: string;
}

export interface LocalDesktopSettingsResponse {
  ok: boolean;
  settings: LocalDesktopSettings;
  source: "local-service";
}

export interface LocalDesktopSettingsUpsertRequest {
  settings: LocalDesktopSettings;
}

export interface LocalFilePathRequest {
  path: string;
}

export interface LocalHtmlReportExportRequest extends LocalFilePathRequest {
  run: InspectionRun;
  asset?: Asset;
}
