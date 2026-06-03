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
  async ensureRuntime(): Promise<LocalServiceHealth> {
    return {
      status: "starting",
      runtime: {
        mode: "managed",
        port: 15432,
        dataDir: "~/.opsprobe/data/postgres",
        logDir: "~/.opsprobe/logs/postgres",
        version: null,
      },
      checks: [
        {
          id: "service.bootstrap",
          label: "Bootstrap Contract",
          status: "warning",
          detail: "Local service bootstrap is stubbed in the 0.3.0 skeleton.",
        },
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  async shutdown(): Promise<void> {
    return;
  }
}
