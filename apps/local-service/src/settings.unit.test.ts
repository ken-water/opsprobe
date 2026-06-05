import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { Asset } from "@opsprobe/core";
import type { LocalServiceConfig } from "./config";
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

async function createStore() {
  const rootDir = await mkdtemp(join(tmpdir(), "opsprobe-settings-test-"));
  cleanupPaths.push(rootDir);
  return new LocalDesktopSettingsStore(createConfig(rootDir));
}

const asset: Asset = {
  id: "asset-001",
  name: "opsprobe-host",
  kind: "linux-host",
  protocol: "ssh",
  host: "10.0.0.12",
  port: 22,
  tags: ["demo"],
  credential: {
    method: "private-key",
    username: "root",
    secretRef: "/tmp/id_rsa",
  },
  createdAt: "2026-06-05T00:00:00.000Z",
  updatedAt: "2026-06-05T00:00:00.000Z",
};

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("LocalDesktopSettingsStore", () => {
  it("persists normalized settings including report audience", async () => {
    const store = await createStore();

    const response = await store.upsert({
      settings: {
        activeAsset: asset,
        reportAudience: "manager",
        selectedTemplateId: "template.linux.nginx.edge",
      },
    });

    expect(response.settings.reportAudience).toBe("manager");
    expect(response.settings.activeAsset?.name).toBe("opsprobe-host");
    expect(response.settings.activeAsset).not.toBe(asset);
  });

  it("writes desktop settings to disk", async () => {
    const store = await createStore();
    await store.upsert({
      settings: {
        activeAsset: asset,
        onboardingMode: "demo",
      },
    });

    const raw = await readFile((store as { config: LocalServiceConfig }).config.paths.desktopSettingsFile, "utf8");

    expect(raw).toContain("\"onboardingMode\": \"demo\"");
    expect(raw).toContain("\"activeAsset\"");
  });
});
