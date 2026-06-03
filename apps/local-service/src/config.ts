export interface LocalServicePaths {
  rootDir: string;
  configDir: string;
  dataDir: string;
  logDir: string;
  runtimeDir: string;
  postgresDataDir: string;
  postgresLogDir: string;
  servicePidFile: string;
  serviceStatusFile: string;
}

export interface ManagedPostgresConfig {
  port: number;
  version: string | null;
}

export interface LocalServiceConfig {
  paths: LocalServicePaths;
  postgres: ManagedPostgresConfig;
}

export function createDefaultLocalServiceConfig(): LocalServiceConfig {
  const globalProcess =
    typeof globalThis === "object" && "process" in globalThis
      ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
      : undefined;
  const rootDir = globalProcess?.env?.HOME
    ? `${globalProcess.env.HOME}/.opsprobe`
    : "~/.opsprobe";

  return {
    paths: {
      rootDir,
      configDir: `${rootDir}/config`,
      dataDir: `${rootDir}/data`,
      logDir: `${rootDir}/logs`,
      runtimeDir: `${rootDir}/runtime`,
      postgresDataDir: `${rootDir}/data/postgres`,
      postgresLogDir: `${rootDir}/logs/postgres`,
      servicePidFile: `${rootDir}/runtime/local-service.pid`,
      serviceStatusFile: `${rootDir}/runtime/local-service-status.json`,
    },
    postgres: {
      port: 15432,
      version: null,
    },
  };
}
