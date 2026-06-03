import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { stdin as input } from "node:process";
import { createDefaultLocalServiceConfig } from "./index.ts";
import type {
  InspectionExecutionRequest,
  InspectionPreviewRequest,
  LocalServiceCommandResponse,
  LocalServiceInspectionHistoryResponse,
  LocalServiceStatusResponse,
} from "./index.ts";
import {
  buildInspectionExecution,
  buildInspectionPreview,
  readInspectionHistory,
} from "./inspection.ts";
import { LocalFileStorageAdapter } from "../../../packages/storage/src/index.ts";
import { ManagedLocalServiceBootstrap } from "./runtime.ts";

const config = createDefaultLocalServiceConfig();
const bootstrap = new ManagedLocalServiceBootstrap(config);
const storage = new LocalFileStorageAdapter(`${config.paths.dataDir}/opsprobe-storage.json`);

async function ensureRuntimeDirs() {
  await Promise.all([
    mkdir(config.paths.rootDir, { recursive: true }),
    mkdir(config.paths.configDir, { recursive: true }),
    mkdir(config.paths.dataDir, { recursive: true }),
    mkdir(config.paths.logDir, { recursive: true }),
    mkdir(config.paths.runtimeDir, { recursive: true }),
    mkdir(config.paths.postgresDataDir, { recursive: true }),
    mkdir(config.paths.postgresLogDir, { recursive: true }),
  ]);

  await storage.bootstrap();
}

async function buildStatusResponse(
  mode: "starting" | "ready" | "stopped" = "starting",
): Promise<LocalServiceStatusResponse> {
  const health = await bootstrap.ensureRuntime();

  return {
    ok: true,
    snapshot: {
      status: mode === "ready" ? "ready" : mode === "stopped" ? "stopped" : health.status,
      config,
      health: {
        ...health,
        status: mode === "ready" ? "ready" : mode === "stopped" ? "stopped" : health.status,
        checks:
          mode === "ready"
            ? health.checks.map((check) =>
                check.id === "service.process"
                  ? {
                      ...check,
                      status: "pass",
                      detail: "The local service background process is running.",
                    }
                  : check,
              )
            : health.checks,
      },
    },
  };
}

async function writeStatusFile(mode: "starting" | "ready" | "stopped") {
  const response = await buildStatusResponse(mode);
  await writeFile(
    config.paths.serviceStatusFile,
    `${JSON.stringify(response, null, 2)}\n`,
    "utf8",
  );
  return response;
}

async function statusCommand() {
  await ensureRuntimeDirs();
  const mode = existsSync(config.paths.servicePidFile) ? "ready" : "starting";
  const response = await buildStatusResponse(mode);
  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

async function readJsonStdin<T>(): Promise<T> {
  let raw = "";

  for await (const chunk of input) {
    raw += String(chunk);
  }

  return JSON.parse(raw) as T;
}

async function stopCommand() {
  if (!existsSync(config.paths.servicePidFile)) {
    const response: LocalServiceCommandResponse = {
      ok: true,
      message: "Local service is already stopped.",
    };
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    return;
  }

  const pid = Number((await readFile(config.paths.servicePidFile, "utf8")).trim());
  if (!Number.isNaN(pid)) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // Ignore missing process and still clean up runtime markers.
    }
  }

  await writeStatusFile("stopped");
  await rm(config.paths.servicePidFile, { force: true });

  const response: LocalServiceCommandResponse = {
    ok: true,
    message: "Local service stop signal sent.",
  };
  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

async function bootstrapPostgresCommand() {
  await ensureRuntimeDirs();

  const response: LocalServiceCommandResponse = {
    ok: true,
    message: await bootstrap.bootstrapPostgres(),
  };

  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

async function serveCommand() {
  await ensureRuntimeDirs();
  await writeFile(config.paths.servicePidFile, `${process.pid}\n`, "utf8");
  await writeStatusFile("ready");

  const cleanup = async () => {
    await writeStatusFile("stopped");
    await rm(config.paths.servicePidFile, { force: true });
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void cleanup();
  });
  process.on("SIGTERM", () => {
    void cleanup();
  });

  setInterval(() => {
    void writeStatusFile("ready");
  }, 5000);
}

async function main() {
  const mode = process.argv[2] ?? "status";

  if (mode === "serve") {
    await serveCommand();
    return;
  }

  if (mode === "stop") {
    await stopCommand();
    return;
  }

  if (mode === "postgres-bootstrap") {
    await bootstrapPostgresCommand();
    return;
  }

  if (mode === "inspect-preview") {
    const request = await readJsonStdin<InspectionPreviewRequest>();
    const response = await buildInspectionPreview(request);
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    return;
  }

  if (mode === "inspect-run") {
    await ensureRuntimeDirs();
    const request = await readJsonStdin<InspectionExecutionRequest>();
    const response = await buildInspectionExecution(request, storage);
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    return;
  }

  if (mode === "inspection-history") {
    await ensureRuntimeDirs();
    const response: LocalServiceInspectionHistoryResponse = await readInspectionHistory(storage);
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    return;
  }

  await statusCommand();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown local service failure.";

  process.stderr.write(
    `${JSON.stringify(
      {
        ok: false,
        error: message,
      },
      null,
      2,
    )}\n`,
  );
  process.exitCode = 1;
});
