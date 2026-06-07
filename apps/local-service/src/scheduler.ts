import { mkdir, readFile } from "node:fs/promises";
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

const SCHEDULES_STATE_KEY = "inspection-schedules";
const CREDENTIAL_REVALIDATION_MESSAGE =
  "Credential verification is required before this schedule can resume.";

function emptyScheduleSnapshot(): ScheduleSnapshot {
  return {
    schedules: [],
  };
}

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

function credentialReadyForSchedules(asset: Asset) {
  return asset.credential.bindingStatus === "linked" && asset.credential.secretRef.trim().length > 0;
}

export class LocalScheduleStore {
  private readonly config: LocalServiceConfig;
  private readonly getStorage: () => StorageAdapter;

  constructor(config: LocalServiceConfig, getStorage: () => StorageAdapter) {
    this.config = config;
    this.getStorage = getStorage;
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
    const asset = await this.resolveLatestAsset(request.asset);
    const requestedEnabled = request.enabled ?? existing?.enabled ?? true;

    if (requestedEnabled && !credentialReadyForSchedules(asset)) {
      throw new Error(CREDENTIAL_REVALIDATION_MESSAGE);
    }

    const schedule: LocalInspectionSchedule = existing
      ? {
          ...existing,
          asset: cloneAsset(asset),
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
          lastError: request.enabled === true ? undefined : existing.lastError,
          lastRunAt: existing.lastRunAt,
          lastRunStatus: existing.lastRunStatus,
        }
      : {
          id: request.id ?? createScheduleId(),
          asset: cloneAsset(asset),
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
    const asset = await this.resolveLatestAsset(schedule.asset);
    const requiresVerification = !credentialReadyForSchedules(asset);
    const importedSchedule: LocalInspectionSchedule = {
      ...schedule,
      asset,
      enabled: requiresVerification ? false : schedule.enabled,
      lastError: requiresVerification ? CREDENTIAL_REVALIDATION_MESSAGE : schedule.lastError,
    };
    const existing = snapshot.schedules.some((item) => item.id === schedule.id);
    snapshot.schedules = existing
      ? snapshot.schedules.map((item) => (item.id === schedule.id ? importedSchedule : item))
      : [...snapshot.schedules, importedSchedule];
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
    const persisted = await this.getStorage().state.get<ScheduleSnapshot>(SCHEDULES_STATE_KEY);
    if (persisted) {
      return {
        schedules: (persisted.schedules ?? []).map(normalizeSchedule),
      };
    }

    const migrated = await this.readLegacySnapshot();
    if (migrated) {
      const normalized = {
        schedules: migrated.schedules.map(normalizeSchedule),
      };
      await this.getStorage().state.set(SCHEDULES_STATE_KEY, normalized);
      return normalized;
    }

    return emptyScheduleSnapshot();
  }

  private async readLegacySnapshot(): Promise<ScheduleSnapshot | null> {
    await mkdir(this.config.paths.configDir, { recursive: true });
    try {
      const raw = await readFile(this.config.paths.schedulesFile, "utf8");
      return JSON.parse(raw) as ScheduleSnapshot;
    } catch {
      return null;
    }
  }

  private async writeSnapshot(snapshot: ScheduleSnapshot) {
    await this.getStorage().state.set(SCHEDULES_STATE_KEY, snapshot);
  }

  private async resolveLatestAsset(asset: Asset): Promise<Asset> {
    const assets = await this.getStorage().assets.list();
    return assets.find((candidate) => candidate.id === asset.id) ?? asset;
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
      let latestAsset = schedule.asset;
      try {
        const assets = await this.storage.assets.list();
        latestAsset = assets.find((candidate) => candidate.id === schedule.asset.id) ?? schedule.asset;

        if (!credentialReadyForSchedules(latestAsset)) {
          await this.store.save({
            ...schedule,
            asset: latestAsset,
            enabled: false,
            lastRunAt: nowIso(),
            lastRunStatus: "failed",
            lastError: CREDENTIAL_REVALIDATION_MESSAGE,
            updatedAt: nowIso(),
          });
          continue;
        }

        const response = await buildInspectionExecution(
          {
            asset: latestAsset,
            templateId: schedule.templateId,
            trigger: "scheduled",
            taskId: `task-schedule-${schedule.id}-${Date.now()}`,
          },
          this.storage,
        );

        await this.store.save({
          ...schedule,
          asset: latestAsset,
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
          asset: latestAsset,
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
