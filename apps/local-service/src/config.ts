export interface LocalServicePaths {
  rootDir: string;
  configDir: string;
  dataDir: string;
  logDir: string;
  runtimeDir: string;
  postgresDataDir: string;
  postgresLogDir: string;
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
  const rootDir = "~/.opsprobe";

  return {
    paths: {
      rootDir,
      configDir: `${rootDir}/config`,
      dataDir: `${rootDir}/data`,
      logDir: `${rootDir}/logs`,
      runtimeDir: `${rootDir}/runtime`,
      postgresDataDir: `${rootDir}/data/postgres`,
      postgresLogDir: `${rootDir}/logs/postgres`,
    },
    postgres: {
      port: 15432,
      version: null,
    },
  };
}
