import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { Asset } from "@opsprobe/core";
import { builtInInspectionTemplateDefinitions, findBuiltInTemplateDefinition } from "@opsprobe/checks";
import type { StorageAdapter } from "../../../packages/storage/src/index.ts";
import type { LocalServiceConfig } from "./config.ts";
import { buildInspectionExecution } from "./inspection.ts";
import type {
  LocalInspectionSchedule,
  LocalInspectionScheduleDeleteRequest,
  LocalInspectionScheduleListResponse,
  LocalInspectionScheduleUpsertRequest,
  LocalInspectionScheduleUpsertResponse,
} from "./protocol.ts";

interface ScheduleSnapshot {
  schedules: LocalInspectionSchedule[];
}

const EMPTY_SCHEDULE_SNAPSHOT: ScheduleSnapshot = {
  schedules: [],
};

function normalizeSchedule(schedule: LocalInspectionSchedule): LocalInspectionSchedule {
  return {
    ...schedule,
    templateId: schedule.templateId ?? builtInInspectionTemplateDefinitions[0].id,
  };
}

function nowIso() {
  return new Date().toISOString();
}

function createScheduleId() {
  return `schedule-${Date.now()}`;
}

function computeNextRunAt(intervalMinutes: number, from = new Date()) {
  return new Date(from.getTime() + intervalMinutes * 60_000).toISOString();
}

function cloneAsset(asset: Asset): Asset {
  return JSON.parse(JSON.stringify(asset)) as Asset;
}

export class LocalScheduleStore {
  private readonly config: LocalServiceConfig;

  constructor(config: LocalServiceConfig) {
    this.config = config;
  }

  async list(): Promise<LocalInspectionSchedule[]> {
    return (await this.readSnapshot()).schedules;
  }

  async listResponse(): Promise<LocalInspectionScheduleListResponse> {
    return {
      ok: true,
      schedules: await this.list(),
      source: "local-service",
    };
  }

  async upsert(request: LocalInspectionScheduleUpsertRequest): Promise<LocalInspectionScheduleUpsertResponse> {
    const snapshot = await this.readSnapshot();
    const timestamp = nowIso();
    const existing = request.id ? snapshot.schedules.find((item) => item.id === request.id) : undefined;
    const intervalMinutes = Math.max(5, Math.floor(request.intervalMinutes));

    const schedule: LocalInspectionSchedule = existing
      ? {
          ...existing,
          asset: cloneAsset(request.asset),
          templateId: request.templateId,
          intervalMinutes,
          enabled: request.enabled ?? existing.enabled,
          updatedAt: timestamp,
          nextRunAt:
            request.enabled === false
              ? existing.nextRunAt
              : existing.enabled || request.enabled !== false
                ? existing.nextRunAt
                : computeNextRunAt(intervalMinutes),
          lastError: existing.lastError,
          lastRunAt: existing.lastRunAt,
          lastRunStatus: existing.lastRunStatus,
        }
      : {
          id: request.id ?? createScheduleId(),
          asset: cloneAsset(request.asset),
          templateId: request.templateId,
          intervalMinutes,
          enabled: request.enabled ?? true,
          nextRunAt: computeNextRunAt(intervalMinutes),
          createdAt: timestamp,
          updatedAt: timestamp,
        };

    if (existing) {
      snapshot.schedules = snapshot.schedules.map((item) => (item.id === schedule.id ? schedule : item));
    } else {
      snapshot.schedules.push(schedule);
    }

    await this.writeSnapshot(snapshot);

    return {
      ok: true,
      schedule,
      source: "local-service",
    };
  }

  async delete(request: LocalInspectionScheduleDeleteRequest) {
    const snapshot = await this.readSnapshot();
    snapshot.schedules = snapshot.schedules.filter((item) => item.id !== request.id);
    await this.writeSnapshot(snapshot);
  }

  async save(schedule: LocalInspectionSchedule) {
    const snapshot = await this.readSnapshot();
    snapshot.schedules = snapshot.schedules.map((item) => (item.id === schedule.id ? schedule : item));
    await this.writeSnapshot(snapshot);
  }

  async saveImported(schedule: LocalInspectionSchedule) {
    const snapshot = await this.readSnapshot();
    const existing = snapshot.schedules.some((item) => item.id === schedule.id);
    snapshot.schedules = existing
      ? snapshot.schedules.map((item) => (item.id === schedule.id ? schedule : item))
      : [...snapshot.schedules, schedule];
    await this.writeSnapshot(snapshot);
  }

  async summarizeFailures() {
    const schedules = await this.list();
    const failedSchedules = schedules.filter((item) => Boolean(item.lastError));

    return {
      total: schedules.length,
      failedSchedules,
      enabledSchedules: schedules.filter((item) => item.enabled).length,
      templateLabels: schedules
        .map((item) => findBuiltInTemplateDefinition(item.templateId)?.name ?? item.templateId)
        .slice(0, 3),
    };
  }

  private async readSnapshot(): Promise<ScheduleSnapshot> {
    await mkdir(this.config.paths.configDir, { recursive: true });

    try {
      const raw = await readFile(this.config.paths.schedulesFile, "utf8");
      const snapshot = JSON.parse(raw) as ScheduleSnapshot;
      return {
        schedules: snapshot.schedules.map(normalizeSchedule),
      };
    } catch {
      return EMPTY_SCHEDULE_SNAPSHOT;
    }
  }

  private async writeSnapshot(snapshot: ScheduleSnapshot) {
    await mkdir(this.config.paths.configDir, { recursive: true });
    await writeFile(this.config.paths.schedulesFile, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  }
}

export class LocalScheduler {
  private readonly runningScheduleIds = new Set<string>();
  private readonly store: LocalScheduleStore;
  private readonly storage: StorageAdapter;

  constructor(
    store: LocalScheduleStore,
    storage: StorageAdapter,
  ) {
    this.store = store;
    this.storage = storage;
  }

  async runDueSchedules() {
    const schedules = await this.store.list();
    const dueSchedules = schedules.filter(
      (schedule) =>
        schedule.enabled &&
        !this.runningScheduleIds.has(schedule.id) &&
        new Date(schedule.nextRunAt).getTime() <= Date.now(),
    );

    for (const schedule of dueSchedules) {
      this.runningScheduleIds.add(schedule.id);
      try {
        const response = await buildInspectionExecution(
          {
            asset: schedule.asset,
            templateId: schedule.templateId,
            trigger: "scheduled",
            taskId: `task-schedule-${schedule.id}-${Date.now()}`,
          },
          this.storage,
        );

        await this.store.save({
          ...schedule,
          nextRunAt: computeNextRunAt(schedule.intervalMinutes),
          lastRunAt: response.run.createdAt,
          lastRunStatus: response.run.status,
          lastError: response.run.status === "failed" ? "Scheduled run returned a failed status." : undefined,
          updatedAt: nowIso(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Scheduled run failed.";
        await this.store.save({
          ...schedule,
          nextRunAt: computeNextRunAt(schedule.intervalMinutes),
          lastRunAt: nowIso(),
          lastRunStatus: "failed",
          lastError: message,
          updatedAt: nowIso(),
        });
      } finally {
        this.runningScheduleIds.delete(schedule.id);
      }
    }
  }
}
