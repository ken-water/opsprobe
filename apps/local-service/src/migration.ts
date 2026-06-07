import { builtInInspectionTemplateDefinitions } from "@opsprobe/checks";
import { createInspectionTemplate, type Asset, type InspectionTemplate } from "@opsprobe/core";
import type { StorageAdapter } from "../../../packages/storage/src/index.ts";
import type { LocalServiceConfig } from "./config.ts";
import { LocalScheduleStore } from "./scheduler.ts";
import { LocalDesktopSettingsStore } from "./settings.ts";
import type {
  LocalConfigExportPackage,
  LocalConfigExportResponse,
  LocalConfigImportRequest,
  LocalConfigImportResponse,
  LocalDesktopSettings,
  LocalInspectionSchedule,
  PortableAsset,
} from "./protocol.ts";

function maskAsset(asset: Asset): PortableAsset {
  return {
    ...asset,
    credential: {
      method: asset.credential.method,
      username: asset.credential.username,
      bindingStatus: "rebind-required",
    },
  };
}

function rebindAsset(asset: PortableAsset): Asset {
  return {
    ...asset,
    credential: {
      method: asset.credential.method,
      username: asset.credential.username,
      secretRef: "",
      bindingStatus: "rebind-required",
    },
  };
}

function maskSettings(settings: LocalDesktopSettings): LocalDesktopSettings {
  return {
    ...settings,
    activeAsset: settings.activeAsset ? maskAsset(settings.activeAsset) : undefined,
  };
}

function rebindSettings(settings: LocalDesktopSettings): LocalDesktopSettings {
  return {
    ...settings,
    activeAsset: settings.activeAsset ? rebindAsset(settings.activeAsset as PortableAsset) : undefined,
  };
}

export async function exportLocalConfig(
  storage: StorageAdapter,
  scheduleStore: LocalScheduleStore,
  desktopSettingsStore: LocalDesktopSettingsStore,
  config: LocalServiceConfig,
): Promise<LocalConfigExportResponse> {
  const [assets, templates, schedules, desktop] = await Promise.all([
    storage.assets.list(),
    storage.templates.list(),
    scheduleStore.list(),
    desktopSettingsStore.get(),
  ]);
  const exportedTemplates =
    templates.length > 0
      ? templates
      : builtInInspectionTemplateDefinitions.map((definition) => createInspectionTemplate(definition));

  const portableSchedules = schedules.map((schedule) => ({
    id: schedule.id,
    assetId: schedule.asset.id,
    templateId: schedule.templateId,
    intervalMinutes: schedule.intervalMinutes,
    enabled: schedule.enabled,
    nextRunAt: schedule.nextRunAt,
    lastRunAt: schedule.lastRunAt,
    lastRunStatus: schedule.lastRunStatus,
    lastError: schedule.lastError,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
  }));

  return {
    ok: true,
    package: {
      version: 1,
      exportedAt: new Date().toISOString(),
      assets: assets.map(maskAsset),
      templates: exportedTemplates,
      schedules: portableSchedules,
      settings: {
        postgresPort: config.postgres.port,
        desktop: maskSettings(desktop),
      },
    },
    source: "local-service",
  };
}

function buildImportedSchedule(
  schedule: LocalConfigExportPackage["schedules"][number],
  assetsById: Map<string, Asset>,
): LocalInspectionSchedule | null {
  const asset = assetsById.get(schedule.assetId);
  if (!asset) {
    return null;
  }

  return {
    id: schedule.id,
    asset,
    templateId: schedule.templateId ?? builtInInspectionTemplateDefinitions[0].id,
    intervalMinutes: schedule.intervalMinutes,
    enabled: schedule.enabled,
    nextRunAt: schedule.nextRunAt,
    lastRunAt: schedule.lastRunAt,
    lastRunStatus: schedule.lastRunStatus,
    lastError: schedule.lastError,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
  };
}

export async function importLocalConfig(
  request: LocalConfigImportRequest,
  storage: StorageAdapter,
  scheduleStore: LocalScheduleStore,
  desktopSettingsStore: LocalDesktopSettingsStore,
): Promise<LocalConfigImportResponse> {
  const assets = request.package.assets.map(rebindAsset);
  const assetsById = new Map<string, Asset>(assets.map((asset) => [asset.id, asset]));

  for (const asset of assets) {
    await storage.assets.upsert(asset);
  }

  for (const template of request.package.templates) {
    await storage.templates.upsert(template as InspectionTemplate);
  }

  let importedSchedules = 0;
  for (const schedule of request.package.schedules) {
    const importedSchedule = buildImportedSchedule(schedule, assetsById);
    if (!importedSchedule) {
      continue;
    }

    await scheduleStore.saveImported(importedSchedule);
    importedSchedules += 1;
  }

  if (request.package.settings.desktop) {
    await desktopSettingsStore.upsert({
      settings: rebindSettings(request.package.settings.desktop),
    });
  }

  return {
    ok: true,
    importedAssets: assets.length,
    importedTemplates: request.package.templates.length,
    importedSchedules,
    source: "local-service",
  };
}
