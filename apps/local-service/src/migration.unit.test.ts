import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { Asset, InspectionTemplate } from "@opsprobe/core";
import { createInspectionTemplate } from "@opsprobe/core";
import { builtInInspectionTemplateDefinitions } from "@opsprobe/checks";
import { LocalFileStorageAdapter } from "../../../packages/storage/src/index";
import type { LocalServiceConfig } from "./config";
import { exportLocalConfig, importLocalConfig } from "./migration";
import { LocalScheduleStore } from "./scheduler";
import { LocalDesktopSettingsStore } from "./settings";

const cleanupPaths: string[] = [];

function createConfig(rootDir: string): LocalServiceConfig {
  return {
    paths: {
      rootDir,
      configDir: join(rootDir, "config"),
      desktopSettingsFile: join(rootDir, "config", "desktop-settings.json"),
      schedulesFile: join(rootDir, "config", "inspection-schedules.json"),
      dataDir: join(rootDir, "data"),
      reportDir: join(rootDir, "reports"),
      logDir: join(rootDir, "logs"),
      runtimeDir: join(rootDir, "runtime"),
      postgresDataDir: join(rootDir, "data", "postgres"),
      postgresLogDir: join(rootDir, "logs", "postgres"),
      postgresCtlLogFile: join(rootDir, "logs", "postgres", "managed-postgres.log"),
      postgresPidFile: join(rootDir, "data", "postgres", "postmaster.pid"),
      servicePidFile: join(rootDir, "runtime", "local-service.pid"),
      serviceStatusFile: join(rootDir, "runtime", "local-service-status.json"),
    },
    postgres: {
      port: 15432,
      version: null,
    },
  };
}

async function createContext() {
  const rootDir = await mkdtemp(join(tmpdir(), "opsprobe-migration-test-"));
  cleanupPaths.push(rootDir);

  const config = createConfig(rootDir);
  const storage = new LocalFileStorageAdapter(join(config.paths.dataDir, "opsprobe-storage.json"));
  const scheduleStore = new LocalScheduleStore(config, () => storage);
  const desktopSettingsStore = new LocalDesktopSettingsStore(config, () => storage);
  await storage.bootstrap();

  return {
    config,
    storage,
    scheduleStore,
    desktopSettingsStore,
  };
}

const asset: Asset = {
  id: "asset-migrate-001",
  name: "migration-host-01",
  kind: "linux-host",
  protocol: "ssh",
  host: "192.0.2.40",
  port: 22,
  tags: ["migration"],
  credential: {
    method: "private-key",
    username: "opsprobe",
    secretRef: "/tmp/opsprobe-migration-id_rsa",
    bindingStatus: "linked",
  },
  createdAt: "2026-06-07T00:00:00.000Z",
  updatedAt: "2026-06-07T00:00:00.000Z",
};

const customTemplate: InspectionTemplate = createInspectionTemplate({
  id: "template.custom.migration",
  name: "Custom Migration Review",
  description: "Custom export and import test template.",
  assetKind: "linux-host",
  checkIds: ["linux.cpu.usage", "linux.log.usage"],
});

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("local configuration migration", () => {
  it("exports masked assets, templates, and schedules", async () => {
    const { config, storage, scheduleStore, desktopSettingsStore } = await createContext();

    await storage.assets.upsert(asset);
    await storage.templates.upsert(customTemplate);
    await scheduleStore.upsert({
      asset,
      templateId: customTemplate.id,
      intervalMinutes: 15,
      enabled: true,
    });
    await desktopSettingsStore.upsert({
      settings: {
        activeAsset: asset,
        onboardingMode: "real",
      },
    });

    const response = await exportLocalConfig(storage, scheduleStore, desktopSettingsStore, config);

    expect(response.ok).toBe(true);
    expect(response.package.settings.postgresPort).toBe(15432);
    expect(response.package.assets).toHaveLength(1);
    expect("secretRef" in (response.package.assets[0]?.credential ?? {})).toBe(false);
    expect(response.package.assets[0]?.credential.bindingStatus).toBe("rebind-required");
    expect(response.package.templates.map((template) => template.id)).toContain(customTemplate.id);
    expect(response.package.schedules).toHaveLength(1);
    expect(response.package.schedules[0]?.assetId).toBe(asset.id);
    expect(response.package.settings.desktop?.activeAsset?.credential.bindingStatus).toBe("rebind-required");
    expect("secretRef" in ((response.package.settings.desktop?.activeAsset?.credential ?? {}) as object)).toBe(false);
  });

  it("falls back to built-in templates when exported storage has none", async () => {
    const { config, storage, scheduleStore, desktopSettingsStore } = await createContext();
    await storage.assets.upsert(asset);

    const response = await exportLocalConfig(storage, scheduleStore, desktopSettingsStore, config);

    expect(response.package.templates).toHaveLength(builtInInspectionTemplateDefinitions.length);
    expect(response.package.templates[0]?.id).toBe(builtInInspectionTemplateDefinitions[0]?.id);
  });

  it("reads legacy file snapshots that do not yet contain unified state", async () => {
    const { config, storage, desktopSettingsStore, scheduleStore } = await createContext();
    await rm(join(config.paths.dataDir, "opsprobe-storage.json"), { force: true });
    await writeFile(
      join(config.paths.dataDir, "opsprobe-storage.json"),
      `${JSON.stringify(
        {
          assets: [asset],
          templates: [],
          inspectionRuns: [],
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    const assets = await storage.assets.list();
    const settings = await desktopSettingsStore.get();
    const schedules = await scheduleStore.list();

    expect(assets).toHaveLength(1);
    expect(settings).toEqual({});
    expect(schedules).toEqual([]);
  });

  it("imports rebind-required assets and skips schedules whose assets are missing", async () => {
    const { storage, scheduleStore, desktopSettingsStore } = await createContext();

    const importResponse = await importLocalConfig(
      {
        package: {
          version: 1,
          exportedAt: "2026-06-07T01:00:00.000Z",
          assets: [
            {
              ...asset,
              credential: {
                method: "private-key",
                username: "opsprobe",
                bindingStatus: "rebind-required",
              },
            },
          ],
          templates: [customTemplate],
          schedules: [
            {
              id: "schedule-import-001",
              assetId: asset.id,
              templateId: customTemplate.id,
              intervalMinutes: 10,
              enabled: true,
              nextRunAt: "2026-06-07T01:10:00.000Z",
              createdAt: "2026-06-07T01:00:00.000Z",
              updatedAt: "2026-06-07T01:00:00.000Z",
            },
            {
              id: "schedule-import-002",
              assetId: "missing-asset",
              templateId: customTemplate.id,
              intervalMinutes: 10,
              enabled: true,
              nextRunAt: "2026-06-07T01:10:00.000Z",
              createdAt: "2026-06-07T01:00:00.000Z",
              updatedAt: "2026-06-07T01:00:00.000Z",
            },
          ],
          settings: {
            postgresPort: 15432,
            desktop: {
              activeAsset: {
                ...asset,
                credential: {
                  method: "private-key",
                  username: "opsprobe",
                  bindingStatus: "rebind-required",
                },
              },
              onboardingMode: "real",
            },
          },
        },
      },
      storage,
      scheduleStore,
      desktopSettingsStore,
    );

    const importedAssets = await storage.assets.list();
    const importedTemplates = await storage.templates.list();
    const importedSchedules = await scheduleStore.list();
    const importedSettings = await desktopSettingsStore.get();

    expect(importResponse.ok).toBe(true);
    expect(importResponse.importedAssets).toBe(1);
    expect(importResponse.importedTemplates).toBe(1);
    expect(importResponse.importedSchedules).toBe(1);
    expect(importedAssets[0]?.credential.bindingStatus).toBe("rebind-required");
    expect(importedAssets[0]?.credential.secretRef).toBe("");
    expect(importedTemplates.map((template) => template.id)).toContain(customTemplate.id);
    expect(importedSchedules).toHaveLength(1);
    expect(importedSchedules[0]?.asset.id).toBe(asset.id);
    expect(importedSchedules[0]?.enabled).toBe(false);
    expect(importedSchedules[0]?.lastError).toContain("Credential verification is required");
    expect(importedSettings.activeAsset?.credential.bindingStatus).toBe("rebind-required");
    expect(importedSettings.activeAsset?.credential.secretRef).toBe("");
    expect(importedSettings.onboardingMode).toBe("real");
  });
});
