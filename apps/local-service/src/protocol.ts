import type { LocalServiceHealth, LocalServiceStatus } from "./index";
import type { LocalServiceConfig } from "./config";

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
