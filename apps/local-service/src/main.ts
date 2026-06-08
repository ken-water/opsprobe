import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { stdin as input } from "node:process";
import { builtInInspectionTemplateDefinitions } from "@opsprobe/checks";
import { createInspectionTemplate } from "@opsprobe/core";
import { createDefaultLocalServiceConfig } from "./index.ts";
import type {
  InspectionExecutionRequest,
  LocalAssetListResponse,
  LocalAssetUpsertRequest,
  LocalDesktopSettings,
  LocalDesktopSettingsResponse,
  LocalDesktopSettingsUpsertRequest,
  LocalConfigExportResponse,
  LocalConfigImportRequest,
  LocalConfigImportResponse,
  LocalFilePathRequest,
  LocalHtmlReportExportRequest,
  LocalInspectionScheduleDeleteRequest,
  LocalInspectionScheduleListResponse,
  LocalInspectionScheduleUpsertRequest,
  LocalInspectionScheduleUpsertResponse,
  LocalServiceInspectionHistoryRequest,
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
import { exportLocalConfig, importLocalConfig } from "./migration.ts";
import { exportHtmlReport } from "./report.ts";
import { LocalScheduleStore, LocalScheduler } from "./scheduler.ts";
import { readPersistedServiceMode } from "./service-status.ts";
import {
  LocalFileStorageAdapter,
  PostgresStorageAdapter,
  type StorageAdapter,
} from "../../../packages/storage/src/index.ts";
import { ManagedLocalServiceBootstrap } from "./runtime.ts";
import { LocalDesktopSettingsStore } from "./settings.ts";

const config = createDefaultLocalServiceConfig();
const bootstrap = new ManagedLocalServiceBootstrap(config);
const fileStorage = new LocalFileStorageAdapter(`${config.paths.dataDir}/opsprobe-storage.json`);
let storage: StorageAdapter = fileStorage;
let storageBackendMessage = "Local file storage adapter is active.";
const scheduleStore = new LocalScheduleStore(config, () => storage);
const desktopSettingsStore = new LocalDesktopSettingsStore(config, () => storage);
const builtInTemplates = builtInInspectionTemplateDefinitions.map((definition) =>
  createInspectionTemplate(definition),
);
const DESKTOP_SETTINGS_STATE_KEY = "desktop-settings";
const SCHEDULES_STATE_KEY = "inspection-schedules";

async function migrateFileRunsToPostgres(postgresStorage: PostgresStorageAdapter) {
  await fileStorage.bootstrap();
  const assets = await fileStorage.assets.list();
  const templates = await fileStorage.templates.list();
  const runs = await fileStorage.inspectionRuns.listRecent(10000);

  for (const asset of assets) {
    await postgresStorage.assets.upsert(asset);
  }

  for (const template of templates) {
    await postgresStorage.templates.upsert(template);
  }

  for (const run of runs.reverse()) {
    await postgresStorage.inspectionRuns.save(run);
  }

  return runs.length;
}

async function migrateLegacyStateIntoStorage(targetStorage: StorageAdapter) {
  const existingSettings = await targetStorage.state.get<LocalDesktopSettings>(DESKTOP_SETTINGS_STATE_KEY);
  if (!existingSettings) {
    try {
      const raw = await readFile(config.paths.desktopSettingsFile, "utf8");
      await targetStorage.state.set(DESKTOP_SETTINGS_STATE_KEY, JSON.parse(raw) as LocalDesktopSettings);
    } catch {
      // Ignore missing legacy desktop settings.
    }
  }

  const existingSchedules = await targetStorage.state.get<{ schedules: LocalInspectionSchedule[] }>(SCHEDULES_STATE_KEY);
  if (!existingSchedules) {
    try {
      const raw = await readFile(config.paths.schedulesFile, "utf8");
      await targetStorage.state.set(
        SCHEDULES_STATE_KEY,
        JSON.parse(raw) as { schedules: LocalInspectionSchedule[] },
      );
    } catch {
      // Ignore missing legacy schedule snapshot.
    }
  }
}

async function migrateFileStateToPostgres(postgresStorage: PostgresStorageAdapter) {
  const fileSettings = await fileStorage.state.get<LocalDesktopSettings>(DESKTOP_SETTINGS_STATE_KEY);
  if (fileSettings) {
    await postgresStorage.state.set(DESKTOP_SETTINGS_STATE_KEY, fileSettings);
  }

  const fileSchedules = await fileStorage.state.get<{ schedules: LocalInspectionSchedule[] }>(SCHEDULES_STATE_KEY);
  if (fileSchedules) {
    await postgresStorage.state.set(SCHEDULES_STATE_KEY, fileSchedules);
  }
}

async function selectStorageAdapter() {
  const health = await bootstrap.ensureRuntime();

  if (health.status === "ready") {
    const postgresStorage = new PostgresStorageAdapter({
      database: "postgres",
      host: config.paths.runtimeDir,
      port: config.postgres.port,
      user: "opsprobe",
    });

    try {
      await postgresStorage.bootstrap();
      const postgresHealth = await postgresStorage.health();
      if (postgresHealth.status === "pass") {
        const migratedRuns = await migrateFileRunsToPostgres(postgresStorage);
        await migrateLegacyStateIntoStorage(fileStorage);
        await migrateFileStateToPostgres(postgresStorage);
        storage = postgresStorage;
        storageBackendMessage =
          migratedRuns > 0
            ? `${postgresHealth.detail} Migrated ${migratedRuns} file-backed inspection runs into PostgreSQL and unified schedules/settings into the active state store.`
            : `${postgresHealth.detail} Schedules and desktop settings now share the active state store with runtime data.`;
        return;
      }
      storageBackendMessage = `Falling back to local file storage: ${postgresHealth.detail}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown PostgreSQL storage bootstrap failure.";
      storageBackendMessage = `Falling back to local file storage: ${message}`;
    }
  } else {
    storageBackendMessage = "Local file storage adapter is active because managed PostgreSQL is not ready.";
  }

  await fileStorage.bootstrap();
  await migrateLegacyStateIntoStorage(fileStorage);
  storage = fileStorage;
}

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

  await selectStorageAdapter();
  for (const template of builtInTemplates) {
    await storage.templates.upsert(template);
  }
}

async function buildStatusResponse(
  mode: "starting" | "ready" | "stopped" = "starting",
): Promise<LocalServiceStatusResponse> {
  const health = await bootstrap.ensureRuntime();
  const scheduleSummary = await scheduleStore.summarizeFailures();
  const failedScheduleLabels = scheduleSummary.failedSchedules.slice(0, 3).map((item) => item.asset.name).join(", ");

  return {
    ok: true,
    snapshot: {
      status: mode === "ready" ? "ready" : mode === "stopped" ? "stopped" : health.status,
      config,
      health: {
        ...health,
        checks: [
          ...(
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
              : health.checks
          ),
          {
            id: "storage.backend",
            label: "Storage Backend",
            status: storage === fileStorage ? "warning" : "pass",
            detail: storageBackendMessage,
          },
          {
            id: "scheduling.local",
            label: "Local Scheduling",
            status: scheduleSummary.failedSchedules.length > 0 ? "warning" : "pass",
            detail:
              scheduleSummary.total === 0
                ? "No local schedules have been configured yet."
                : scheduleSummary.failedSchedules.length > 0
                  ? `${scheduleSummary.failedSchedules.length} schedule failures need review: ${failedScheduleLabels}`
                  : `${scheduleSummary.enabledSchedules} enabled schedules are stored locally.`,
          },
        ],
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

function isProcessAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function resolveServiceMode() {
  if (!existsSync(config.paths.servicePidFile)) {
    return await readPersistedServiceMode(config.paths.serviceStatusFile);
  }

  const rawPid = (await readFile(config.paths.servicePidFile, "utf8").catch(() => "")).trim();
  const pid = Number.parseInt(rawPid, 10);
  if (!Number.isNaN(pid) && isProcessAlive(pid)) {
    return "ready" as const;
  }

  await rm(config.paths.servicePidFile, { force: true });
  return await readPersistedServiceMode(config.paths.serviceStatusFile);
}

async function statusCommand() {
  await ensureRuntimeDirs();
  const mode = await resolveServiceMode();
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
    await ensureRuntimeDirs();
    await writeStatusFile("stopped");
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

  try {
    await storage.shutdown();
    await bootstrap.stopPostgres();
  } catch {
    // Stop should still clean local-service state even if PostgreSQL stop fails.
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

async function startPostgresCommand() {
  await ensureRuntimeDirs();

  const response: LocalServiceCommandResponse = {
    ok: true,
    message: await bootstrap.startPostgres(),
  };

  await selectStorageAdapter();

  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

async function stopPostgresCommand() {
  await ensureRuntimeDirs();

  await storage.shutdown();

  const response: LocalServiceCommandResponse = {
    ok: true,
    message: await bootstrap.stopPostgres(),
  };

  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

async function serveCommand() {
  await ensureRuntimeDirs();
  await writeFile(config.paths.servicePidFile, `${process.pid}\n`, "utf8");
  let scheduler = new LocalScheduler(scheduleStore, storage);

  try {
    await bootstrap.startPostgres();
    await selectStorageAdapter();
    scheduler = new LocalScheduler(scheduleStore, storage);
  } catch {
    // Keep local-service alive even when managed PostgreSQL is not ready.
  }

  await writeStatusFile("ready");

  const cleanup = async () => {
    try {
      await storage.shutdown();
      await bootstrap.stopPostgres();
    } catch {
      // Preserve best-effort shutdown for the service process.
    }
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

  void scheduler.runDueSchedules();
  setInterval(() => {
    void scheduler.runDueSchedules();
  }, 30_000);
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

  if (mode === "postgres-start") {
    await startPostgresCommand();
    return;
  }

  if (mode === "postgres-stop") {
    await stopPostgresCommand();
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
    const request = await readJsonStdin<LocalServiceInspectionHistoryRequest>().catch(() => ({}));
    const response: LocalServiceInspectionHistoryResponse = await readInspectionHistory(storage, request);
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    return;
  }

  if (mode === "assets-list") {
    await ensureRuntimeDirs();
    const response: LocalAssetListResponse = {
      ok: true,
      assets: await storage.assets.list(),
      source: "local-service",
    };
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    return;
  }

  if (mode === "assets-upsert") {
    await ensureRuntimeDirs();
    const request = await readJsonStdin<LocalAssetUpsertRequest>();
    await storage.assets.upsert(request.asset);
    const response: LocalServiceCommandResponse = {
      ok: true,
      message: `Saved asset ${request.asset.id}.`,
    };
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    return;
  }

  if (mode === "settings-get") {
    await ensureRuntimeDirs();
    const response: LocalDesktopSettingsResponse = await desktopSettingsStore.getResponse();
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    return;
  }

  if (mode === "settings-upsert") {
    await ensureRuntimeDirs();
    const request = await readJsonStdin<LocalDesktopSettingsUpsertRequest>();
    const response = await desktopSettingsStore.upsert(request);
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    return;
  }

  if (mode === "schedules-list") {
    await ensureRuntimeDirs();
    const response: LocalInspectionScheduleListResponse = await scheduleStore.listResponse();
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    return;
  }

  if (mode === "config-export") {
    await ensureRuntimeDirs();
    const request = await readJsonStdin<LocalFilePathRequest>();
    const response: LocalConfigExportResponse = await exportLocalConfig(
      storage,
      scheduleStore,
      desktopSettingsStore,
      config,
    );
    await writeFile(request.path, `${JSON.stringify(response.package, null, 2)}\n`, "utf8");
    const commandResponse: LocalServiceCommandResponse = {
      ok: true,
      message: `Exported local configuration to ${request.path}.`,
    };
    process.stdout.write(`${JSON.stringify(commandResponse, null, 2)}\n`);
    return;
  }

  if (mode === "config-import") {
    await ensureRuntimeDirs();
    const request = await readJsonStdin<LocalFilePathRequest>();
    const raw = await readFile(request.path, "utf8");
    const response: LocalConfigImportResponse = await importLocalConfig(
      { package: JSON.parse(raw) as LocalConfigImportRequest["package"] },
      storage,
      scheduleStore,
      desktopSettingsStore,
    );
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    return;
  }

  if (mode === "schedules-upsert") {
    await ensureRuntimeDirs();
    const request = await readJsonStdin<LocalInspectionScheduleUpsertRequest>();
    const response: LocalInspectionScheduleUpsertResponse = await scheduleStore.upsert(request);
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    return;
  }

  if (mode === "schedules-delete") {
    await ensureRuntimeDirs();
    const request = await readJsonStdin<LocalInspectionScheduleDeleteRequest>();
    await scheduleStore.delete(request);
    const response: LocalServiceCommandResponse = {
      ok: true,
      message: `Deleted schedule ${request.id}.`,
    };
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    return;
  }

  if (mode === "report-export-html") {
    await ensureRuntimeDirs();
    const request = await readJsonStdin<LocalHtmlReportExportRequest>();
    const response = await exportHtmlReport(request);
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
