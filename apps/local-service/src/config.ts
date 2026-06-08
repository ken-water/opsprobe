export interface LocalServicePaths {
  rootDir: string;
  configDir: string;
  desktopSettingsFile: string;
  schedulesFile: string;
  dataDir: string;
  reportDir: string;
  logDir: string;
  runtimeDir: string;
  postgresDataDir: string;
  postgresLogDir: string;
  postgresCtlLogFile: string;
  postgresPidFile: string;
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
  const postgresPortRaw = globalProcess?.env?.OPSPROBE_POSTGRES_PORT;
  const postgresPort = Number.parseInt(postgresPortRaw ?? "15432", 10);

  return {
    paths: {
      rootDir,
      configDir: `${rootDir}/config`,
      desktopSettingsFile: `${rootDir}/config/desktop-settings.json`,
      schedulesFile: `${rootDir}/config/inspection-schedules.json`,
      dataDir: `${rootDir}/data`,
      reportDir: `${rootDir}/reports`,
      logDir: `${rootDir}/logs`,
      runtimeDir: `${rootDir}/runtime`,
      postgresDataDir: `${rootDir}/data/postgres`,
      postgresLogDir: `${rootDir}/logs/postgres`,
      postgresCtlLogFile: `${rootDir}/logs/postgres/managed-postgres.log`,
      postgresPidFile: `${rootDir}/data/postgres/postmaster.pid`,
      servicePidFile: `${rootDir}/runtime/local-service.pid`,
      serviceStatusFile: `${rootDir}/runtime/local-service-status.json`,
    },
    postgres: {
      port: Number.isNaN(postgresPort) ? 15432 : postgresPort,
      version: null,
    },
  };
}
