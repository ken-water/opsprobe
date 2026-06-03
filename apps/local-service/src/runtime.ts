import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { createServer } from "node:net";
import { promisify } from "node:util";
import type { LocalServiceConfig } from "./config.ts";
import type { LocalServiceBootstrap, LocalServiceHealth } from "./index.ts";

const execFileAsync = promisify(execFile);

interface BinaryCheck {
  name: string;
  command: string;
  available: boolean;
  detail: string;
}

interface PostgresBinarySnapshot {
  version: string | null;
  checks: BinaryCheck[];
}

async function runCommand(command: string, args: string[]) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    });

    return {
      ok: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (error) {
    const failure = error as {
      stdout?: string;
      stderr?: string;
      message?: string;
    };

    return {
      ok: false,
      stdout: (failure.stdout ?? "").trim(),
      stderr: (failure.stderr ?? failure.message ?? "").trim(),
    };
  }
}

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "127.0.0.1");
  });
}

async function inspectPostgresBinaries(): Promise<PostgresBinarySnapshot> {
  const commands = [
    { name: "postgres", command: "postgres" },
    { name: "pg_ctl", command: "pg_ctl" },
    { name: "initdb", command: "initdb" },
  ];

  const checks = await Promise.all(
    commands.map(async ({ name, command }) => {
      const result = await runCommand(command, ["--version"]);
      return {
        name,
        command,
        available: result.ok,
        detail: result.ok ? result.stdout || `${command} is available.` : result.stderr || `${command} is not available.`,
      } satisfies BinaryCheck;
    }),
  );

  return {
    version: checks.find((item) => item.name === "postgres" && item.available)?.detail ?? null,
    checks,
  };
}

function isProcessAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function buildPostgresAutoConfig(config: LocalServiceConfig) {
  return [
    "# Managed by OpsProbe",
    "listen_addresses = '127.0.0.1'",
    `port = ${config.postgres.port}`,
    `unix_socket_directories = '${config.paths.runtimeDir}'`,
    "logging_collector = on",
    `log_directory = '${config.paths.postgresLogDir}'`,
    "log_filename = 'opsprobe-postgres-%Y-%m-%d_%H%M%S.log'",
    "",
  ].join("\n");
}

export class ManagedLocalServiceBootstrap implements LocalServiceBootstrap {
  readonly config: LocalServiceConfig;

  constructor(config: LocalServiceConfig) {
    this.config = config;
  }

  async ensureRuntime(): Promise<LocalServiceHealth> {
    const binaries = await inspectPostgresBinaries();
    const initialized = existsSync(`${this.config.paths.postgresDataDir}/PG_VERSION`);
    const portAvailable = await isPortAvailable(this.config.postgres.port);
    const missingBinaries = binaries.checks.filter((item) => !item.available);
    const servicePid = existsSync(this.config.paths.servicePidFile)
      ? Number.parseInt(await readFileSafe(this.config.paths.servicePidFile), 10)
      : Number.NaN;
    const serviceProcessRunning = !Number.isNaN(servicePid) && isProcessAlive(servicePid);

    const checks: LocalServiceHealth["checks"] = [
      {
        id: "service.bootstrap",
        label: "Bootstrap Contract",
        status: missingBinaries.length === 0 ? "pass" : "critical",
        detail:
          missingBinaries.length === 0
            ? "Managed PostgreSQL prerequisites were inspected successfully."
            : `Missing PostgreSQL binaries: ${missingBinaries.map((item) => item.command).join(", ")}.`,
      },
      {
        id: "service.process",
        label: "Managed Service Process",
        status: serviceProcessRunning ? "pass" : "warning",
        detail: serviceProcessRunning
          ? `The local service background process is running with pid ${servicePid}.`
          : "The local service background process is not running.",
      },
      ...binaries.checks.map((item) => ({
        id: `postgres.binary.${item.name}`,
        label: `PostgreSQL Binary: ${item.command}`,
        status: item.available ? "pass" : "critical",
        detail: item.detail,
      })),
      {
        id: "postgres.data_dir",
        label: "Managed PostgreSQL Data Directory",
        status: initialized ? "pass" : "warning",
        detail: initialized
          ? `Managed PostgreSQL data directory is initialized at ${this.config.paths.postgresDataDir}.`
          : `Managed PostgreSQL data directory has not been initialized yet at ${this.config.paths.postgresDataDir}.`,
      },
      {
        id: "postgres.port",
        label: "Managed PostgreSQL Port",
        status: portAvailable ? "pass" : "critical",
        detail: portAvailable
          ? `Port ${this.config.postgres.port} is available for the managed PostgreSQL runtime.`
          : `Port ${this.config.postgres.port} is already occupied and cannot be used by OpsProbe.`,
      },
      {
        id: "postgres.process",
        label: "Managed PostgreSQL Process",
        status: initialized && missingBinaries.length === 0 ? "warning" : "critical",
        detail:
          initialized && missingBinaries.length === 0
            ? "Managed PostgreSQL is prepared but is not started automatically in the current skeleton."
            : "Managed PostgreSQL cannot be started until prerequisites and initialization are complete.",
      },
    ];

    let status: LocalServiceHealth["status"] = "degraded";
    if (missingBinaries.length > 0 || !portAvailable) {
      status = "error";
    } else if (initialized) {
      status = "starting";
    }

    return {
      status,
      runtime: {
        mode: "managed",
        port: this.config.postgres.port,
        dataDir: this.config.paths.postgresDataDir,
        logDir: this.config.paths.postgresLogDir,
        version: binaries.version,
      },
      checks,
      updatedAt: new Date().toISOString(),
    };
  }

  async bootstrapPostgres(): Promise<string> {
    await Promise.all([
      mkdir(this.config.paths.postgresDataDir, { recursive: true }),
      mkdir(this.config.paths.postgresLogDir, { recursive: true }),
      mkdir(this.config.paths.runtimeDir, { recursive: true }),
    ]);

    if (existsSync(`${this.config.paths.postgresDataDir}/PG_VERSION`)) {
      await this.writeManagedPostgresConfig();
      return "Managed PostgreSQL data directory is already initialized.";
    }

    const initdb = await runCommand("initdb", [
      "-D",
      this.config.paths.postgresDataDir,
      "-U",
      "opsprobe",
      "--auth=trust",
    ]);

    if (!initdb.ok) {
      throw new Error(
        initdb.stderr || "initdb is unavailable or failed during managed PostgreSQL bootstrap.",
      );
    }

    await this.writeManagedPostgresConfig();
    return "Managed PostgreSQL data directory initialized for OpsProbe.";
  }

  async shutdown(): Promise<void> {
    return;
  }

  private async writeManagedPostgresConfig() {
    const autoConfigFile = `${this.config.paths.postgresDataDir}/postgresql.auto.conf`;
    await writeFile(autoConfigFile, buildPostgresAutoConfig(this.config), "utf8");
    const hbaFile = `${this.config.paths.postgresDataDir}/pg_hba.conf`;
    let content = "";

    try {
      content = await readFile(hbaFile, "utf8");
    } catch {
      content = "";
    }

    const managedRule = "host all all 127.0.0.1/32 trust";
    if (!content.includes(managedRule)) {
      const nextContent = `${content.trimEnd()}\n\n# Managed by OpsProbe\n${managedRule}\n`;
      await writeFile(hbaFile, nextContent, "utf8");
    }
  }
}

async function readFileSafe(path: string) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
}
