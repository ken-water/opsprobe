import { mkdir, readFile } from "node:fs/promises";
import type { Asset } from "@opsprobe/core";
import type { StorageAdapter } from "../../../packages/storage/src/index.ts";
import type { LocalServiceConfig } from "./config.ts";
import type {
  LocalDesktopSettings,
  LocalDesktopSettingsResponse,
  LocalDesktopSettingsUpsertRequest,
} from "./protocol.ts";

const EMPTY_DESKTOP_SETTINGS: LocalDesktopSettings = {};
const DESKTOP_SETTINGS_STATE_KEY = "desktop-settings";

function cloneAsset(asset: Asset): Asset {
  return JSON.parse(JSON.stringify(asset)) as Asset;
}

function normalizeSettings(settings: LocalDesktopSettings): LocalDesktopSettings {
  return {
    activeAsset: settings.activeAsset ? cloneAsset(settings.activeAsset) : undefined,
    selectedTemplateId: settings.selectedTemplateId,
    onboardingMode: settings.onboardingMode,
    reportAudience: settings.reportAudience,
    historyAssetFilter: settings.historyAssetFilter,
    historyDateFrom: settings.historyDateFrom,
    historyDateTo: settings.historyDateTo,
    scheduleIntervalMinutes: settings.scheduleIntervalMinutes,
    migrationPath: settings.migrationPath,
    reportPath: settings.reportPath,
    pdfReportPath: settings.pdfReportPath,
  };
}

export class LocalDesktopSettingsStore {
  private readonly config: LocalServiceConfig;
  private readonly getStorage: () => StorageAdapter;

  constructor(config: LocalServiceConfig, getStorage: () => StorageAdapter) {
    this.config = config;
    this.getStorage = getStorage;
  }

  async get(): Promise<LocalDesktopSettings> {
    const persisted = await this.getStorage().state.get<LocalDesktopSettings>(DESKTOP_SETTINGS_STATE_KEY);
    if (persisted) {
      return normalizeSettings(persisted);
    }

    const migrated = await this.readLegacySettings();
    if (migrated) {
      const normalized = normalizeSettings(migrated);
      await this.getStorage().state.set(DESKTOP_SETTINGS_STATE_KEY, normalized);
      return normalized;
    }

    return EMPTY_DESKTOP_SETTINGS;
  }

  async getResponse(): Promise<LocalDesktopSettingsResponse> {
    return {
      ok: true,
      settings: await this.get(),
      source: "local-service",
    };
  }

  async upsert(request: LocalDesktopSettingsUpsertRequest): Promise<LocalDesktopSettingsResponse> {
    const current = await this.get();
    const next = normalizeSettings({
      ...current,
      ...request.settings,
    });

    await this.getStorage().state.set(DESKTOP_SETTINGS_STATE_KEY, next);

    return {
      ok: true,
      settings: next,
      source: "local-service",
    };
  }

  private async readLegacySettings(): Promise<LocalDesktopSettings | null> {
    await mkdir(this.config.paths.configDir, { recursive: true });

    try {
      const raw = await readFile(this.config.paths.desktopSettingsFile, "utf8");
      return JSON.parse(raw) as LocalDesktopSettings;
    } catch {
      return null;
    }
  }
}
