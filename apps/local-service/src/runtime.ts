import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { createServer } from "node:net";
import { delimiter, join } from "node:path";
import { promisify } from "node:util";
import type { LocalServiceConfig } from "./config.ts";
import type { LocalServiceBootstrap, LocalServiceHealth } from "./index.ts";

const execFileAsync = promisify(execFile);

interface BinaryCheck {
  name: string;
  command: string;
  resolvedPath: string;
  available: boolean;
  detail: string;
}

interface PostgresBinarySnapshot {
  version: string | null;
  checks: BinaryCheck[];
}

interface ManagedPostgresProcessState {
  running: boolean;
  pid: number | null;
  detail: string;
}

interface ResolvedPostgresCommands {
  postgres: string;
  pgCtl: string;
  initdb: string;
}

const commonPostgresBinDirs = [
  "/usr/lib/postgresql/16/bin",
  "/usr/lib/postgresql/15/bin",
  "/usr/lib/postgresql/14/bin",
  "/usr/local/pgsql/bin",
];

function buildCommandSearchPath(extraDirs: string[] = []) {
  const envPath = process.env.PATH ?? "";
  const segments = envPath.split(delimiter).filter(Boolean);
  const merged = [...extraDirs, ...segments];
  return Array.from(new Set(merged)).join(delimiter);
}

function resolvePostgresCommand(command: keyof ResolvedPostgresCommands) {
  const configuredDir = process.env.OPSPROBE_POSTGRES_BIN_DIR;
  const candidates = [
    ...(configuredDir ? [join(configuredDir, command)] : []),
    command,
    ...commonPostgresBinDirs.map((dir) => join(dir, command)),
  ];

  return Array.from(new Set(candidates));
}

async function runCommand(command: string, args: string[], extraDirs: string[] = []) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      env: {
        ...process.env,
        PATH: buildCommandSearchPath(extraDirs),
      },
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
  const commands = ["postgres", "pg_ctl", "initdb"] as const;

  const checks = await Promise.all(
    commands.map(async (command) => {
      const candidates = resolvePostgresCommand(command);
      let chosen = candidates[0] ?? command;
      let result = {
        ok: false,
        stdout: "",
        stderr: "",
      };

      for (const candidate of candidates) {
        result = await runCommand(candidate, ["--version"], commonPostgresBinDirs);
        chosen = candidate;
        if (result.ok) {
          break;
        }
      }

      return {
        name: command,
        command,
        resolvedPath: chosen,
        available: result.ok,
        detail: result.ok
          ? result.stdout || `${chosen} is available.`
          : result.stderr || `${command} is not available.`,
      } satisfies BinaryCheck;
    }),
  );

  return {
    version: checks.find((item) => item.name === "postgres" && item.available)?.detail ?? null,
    checks,
  };
}

async function inspectCommandBinary(command: string, args: string[] = ["-V"]) {
  const result = await runCommand(command, args);
  return {
    available: result.ok,
    detail: result.ok ? result.stdout || `${command} is available.` : result.stderr || `${command} is not available.`,
  };
}

async function isReportDirWritable(path: string) {
  try {
    await mkdir(path, { recursive: true });
    const probeFile = `${path}/.opsprobe-write-test`;
    await writeFile(probeFile, "ok\n", "utf8");
    await rm(probeFile, { force: true });
    return {
      writable: true,
      detail: `Report directory is writable at ${path}.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown report directory write failure.";
    return {
      writable: false,
      detail: `Report directory is not writable at ${path}: ${message}`,
    };
  }
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

async function readManagedPostgresPid(config: LocalServiceConfig) {
  if (!existsSync(config.paths.postgresPidFile)) {
    return null;
  }

  const raw = (await readFileSafe(config.paths.postgresPidFile)).trim();
  const pid = Number.parseInt(raw.split("\n")[0] ?? "", 10);
  return Number.isNaN(pid) ? null : pid;
}

async function inspectManagedPostgresProcess(
  config: LocalServiceConfig,
  binaries: PostgresBinarySnapshot,
  initialized: boolean,
): Promise<ManagedPostgresProcessState> {
  const pid = await readManagedPostgresPid(config);
  if (pid !== null && isProcessAlive(pid)) {
    return {
      running: true,
      pid,
      detail: `Managed PostgreSQL is running with pid ${pid}.`,
    };
  }

  const pgCtlCheck = binaries.checks.find((item) => item.name === "pg_ctl");
  if (initialized && pgCtlCheck?.available) {
    const status = await runCommand(pgCtlCheck.resolvedPath, ["-D", config.paths.postgresDataDir, "status"], commonPostgresBinDirs);
    const detail = status.stdout || status.stderr;
    if (status.ok && detail.includes("server is running") && !detail.includes("single-user server")) {
      return {
        running: true,
        pid,
        detail: detail || "Managed PostgreSQL is running.",
      };
    }
  }

  return {
    running: false,
    pid: pid ?? null,
    detail: initialized
      ? "Managed PostgreSQL data directory is initialized, but the process is not running."
      : "Managed PostgreSQL data directory is not initialized yet.",
  };
}

export class ManagedLocalServiceBootstrap implements LocalServiceBootstrap {
  readonly config: LocalServiceConfig;

  constructor(config: LocalServiceConfig) {
    this.config = config;
  }

  async ensureRuntime(): Promise<LocalServiceHealth> {
    const binaries = await inspectPostgresBinaries();
    const sshBinary = await inspectCommandBinary("ssh", ["-V"]);
    const sshpassBinary = await inspectCommandBinary("sshpass", ["-V"]);
    const reportDir = await isReportDirWritable(this.config.paths.reportDir);
    const initialized = existsSync(`${this.config.paths.postgresDataDir}/PG_VERSION`);
    const missingBinaries = binaries.checks.filter((item) => !item.available);
    const postgresProcess = await inspectManagedPostgresProcess(this.config, binaries, initialized);
    const portAvailable = postgresProcess.running ? false : await isPortAvailable(this.config.postgres.port);
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
      {
        id: "local.binary.ssh",
        label: "SSH Client",
        status: sshBinary.available ? "pass" : "critical",
        detail: sshBinary.detail,
      },
      {
        id: "local.binary.sshpass",
        label: "Password Auth Helper",
        status: sshpassBinary.available ? "pass" : "warning",
        detail: sshpassBinary.available
          ? sshpassBinary.detail
          : "sshpass is not installed. Key-based SSH remains available, but password mode will fail until sshpass is installed.",
      },
      {
        id: "local.report_dir",
        label: "Report Directory",
        status: reportDir.writable ? "pass" : "critical",
        detail: reportDir.detail,
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
        status: postgresProcess.running || portAvailable ? "pass" : "critical",
        detail: postgresProcess.running
          ? `Port ${this.config.postgres.port} is in use by the managed PostgreSQL runtime.`
          : portAvailable
            ? `Port ${this.config.postgres.port} is available for the managed PostgreSQL runtime.`
            : `Port ${this.config.postgres.port} is already occupied and cannot be used by OpsProbe.`,
      },
      {
        id: "postgres.process",
        label: "Managed PostgreSQL Process",
        status: postgresProcess.running
          ? "pass"
          : initialized && missingBinaries.length === 0
            ? "warning"
            : "critical",
        detail: postgresProcess.running
          ? postgresProcess.detail
          : initialized && missingBinaries.length === 0
            ? postgresProcess.detail
            : "Managed PostgreSQL cannot be started until prerequisites and initialization are complete.",
      },
    ];

    let status: LocalServiceHealth["status"] = "degraded";
    if (missingBinaries.length > 0 || (!portAvailable && !postgresProcess.running)) {
      status = "error";
    } else if (postgresProcess.running) {
      status = "ready";
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

    const binaries = await inspectPostgresBinaries();
    const initdbBinary = binaries.checks.find((item) => item.name === "initdb")?.resolvedPath ?? "initdb";
    const initdb = await runCommand(initdbBinary, [
      "-D",
      this.config.paths.postgresDataDir,
      "-U",
      "opsprobe",
      "--auth=trust",
    ], commonPostgresBinDirs);

    if (!initdb.ok) {
      throw new Error(
        initdb.stderr || "initdb is unavailable or failed during managed PostgreSQL bootstrap.",
      );
    }

    await this.writeManagedPostgresConfig();
    return "Managed PostgreSQL data directory initialized for OpsProbe.";
  }

  async startPostgres(): Promise<string> {
    const binaries = await inspectPostgresBinaries();
    const missingBinaries = binaries.checks.filter((item) => !item.available);
    if (missingBinaries.length > 0) {
      throw new Error(
        `Managed PostgreSQL cannot start because required binaries are missing: ${missingBinaries.map((item) => item.command).join(", ")}.`,
      );
    }

    if (!existsSync(`${this.config.paths.postgresDataDir}/PG_VERSION`)) {
      await this.bootstrapPostgres();
    } else {
      await this.writeManagedPostgresConfig();
    }

    const processState = await inspectManagedPostgresProcess(this.config, binaries, true);
    if (processState.running) {
      return processState.detail;
    }

    const portAvailable = await isPortAvailable(this.config.postgres.port);
    if (!portAvailable) {
      throw new Error(
        `Port ${this.config.postgres.port} is already occupied and managed PostgreSQL cannot be started.`,
      );
    }

    const pgCtlBinary = binaries.checks.find((item) => item.name === "pg_ctl")?.resolvedPath ?? "pg_ctl";
    const start = await runCommand(pgCtlBinary, [
      "-D",
      this.config.paths.postgresDataDir,
      "-l",
      this.config.paths.postgresCtlLogFile,
      "-w",
      "start",
    ], commonPostgresBinDirs);

    if (!start.ok) {
      throw new Error(
        start.stderr || start.stdout || "pg_ctl failed to start the managed PostgreSQL runtime.",
      );
    }

    const nextState = await inspectManagedPostgresProcess(this.config, binaries, true);
    if (!nextState.running) {
      throw new Error(
        "Managed PostgreSQL start was requested, but the runtime did not become healthy.",
      );
    }

    return nextState.detail;
  }

  async stopPostgres(): Promise<string> {
    const binaries = await inspectPostgresBinaries();
    const pgCtlCheck = binaries.checks.find((item) => item.name === "pg_ctl");
    if (!pgCtlCheck?.available) {
      throw new Error("Managed PostgreSQL cannot be stopped because pg_ctl is not available.");
    }

    if (!existsSync(`${this.config.paths.postgresDataDir}/PG_VERSION`)) {
      return "Managed PostgreSQL data directory is not initialized.";
    }

    const processState = await inspectManagedPostgresProcess(this.config, binaries, true);
    if (!processState.running) {
      return "Managed PostgreSQL is already stopped.";
    }

    const stop = await runCommand(pgCtlCheck.resolvedPath, [
      "-D",
      this.config.paths.postgresDataDir,
      "-m",
      "fast",
      "-w",
      "stop",
    ], commonPostgresBinDirs);

    if (!stop.ok) {
      throw new Error(
        stop.stderr || stop.stdout || "pg_ctl failed to stop the managed PostgreSQL runtime.",
      );
    }

    return "Managed PostgreSQL stop completed.";
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
