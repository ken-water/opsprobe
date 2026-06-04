import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { Asset } from "@opsprobe/core";
import type { LocalServiceConfig } from "./config.ts";
import type {
  LocalDesktopSettings,
  LocalDesktopSettingsResponse,
  LocalDesktopSettingsUpsertRequest,
} from "./protocol.ts";

const EMPTY_DESKTOP_SETTINGS: LocalDesktopSettings = {};

function cloneAsset(asset: Asset): Asset {
  return JSON.parse(JSON.stringify(asset)) as Asset;
}

function normalizeSettings(settings: LocalDesktopSettings): LocalDesktopSettings {
  return {
    activeAsset: settings.activeAsset ? cloneAsset(settings.activeAsset) : undefined,
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

  constructor(config: LocalServiceConfig) {
    this.config = config;
  }

  async get(): Promise<LocalDesktopSettings> {
    await mkdir(this.config.paths.configDir, { recursive: true });

    try {
      const raw = await readFile(this.config.paths.desktopSettingsFile, "utf8");
      return normalizeSettings(JSON.parse(raw) as LocalDesktopSettings);
    } catch {
      return EMPTY_DESKTOP_SETTINGS;
    }
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

    await mkdir(this.config.paths.configDir, { recursive: true });
    await writeFile(
      this.config.paths.desktopSettingsFile,
      `${JSON.stringify(next, null, 2)}\n`,
      "utf8",
    );

    return {
      ok: true,
      settings: next,
      source: "local-service",
    };
  }
}
