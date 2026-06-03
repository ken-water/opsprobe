import type { LocalServiceHealth, LocalServiceStatus } from "./index";
import type { LocalServiceConfig } from "./config";
import type { InspectionRun } from "@opsprobe/core";

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

export interface LocalServiceInspectionHistoryResponse {
  ok: boolean;
  runs: InspectionRun[];
  source: "local-service";
}
