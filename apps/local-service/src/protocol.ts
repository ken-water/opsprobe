import type { LocalServiceHealth, LocalServiceStatus } from "./index";
import type { LocalServiceConfig } from "./config";
import type { Asset, InspectionRun } from "@opsprobe/core";

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
