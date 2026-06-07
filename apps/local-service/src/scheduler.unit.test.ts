import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { Asset } from "@opsprobe/core";
import { LocalFileStorageAdapter } from "../../../packages/storage/src/index";
import type { LocalServiceConfig } from "./config";
import { LocalScheduleStore } from "./scheduler";

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
  const rootDir = await mkdtemp(join(tmpdir(), "opsprobe-scheduler-test-"));
  cleanupPaths.push(rootDir);
  const config = createConfig(rootDir);
  const storage = new LocalFileStorageAdapter(join(config.paths.dataDir, "opsprobe-storage.json"));
  await storage.bootstrap();

  return {
    config,
    storage,
    store: new LocalScheduleStore(config, () => storage),
  };
}

const asset: Asset = {
  id: "asset-schedule-001",
  name: "scheduler-host",
  kind: "linux-host",
  protocol: "ssh",
  host: "192.0.2.50",
  port: 22,
  tags: ["scheduler"],
  credential: {
    method: "private-key",
    username: "opsprobe",
    secretRef: "/tmp/opsprobe-scheduler-id_rsa",
  },
  createdAt: "2026-06-07T00:00:00.000Z",
  updatedAt: "2026-06-07T00:00:00.000Z",
};

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("LocalScheduleStore", () => {
  it("persists schedules into the unified storage snapshot", async () => {
    const { storage, store } = await createContext();

    await store.upsert({
      asset,
      templateId: "template.linux-baseline",
      intervalMinutes: 15,
      enabled: true,
    });

    const raw = await readFile((storage as { filePath: string }).filePath, "utf8");

    expect(raw).toContain("\"state\"");
    expect(raw).toContain("\"inspection-schedules\"");
    expect(raw).toContain("\"scheduler-host\"");
  });

  it("migrates legacy schedule files into the active state store", async () => {
    const { config, storage, store } = await createContext();
    await mkdir(config.paths.configDir, { recursive: true });
    await writeFile(
      config.paths.schedulesFile,
      `${JSON.stringify(
        {
          schedules: [
            {
              id: "schedule-legacy-001",
              asset,
              templateId: "template.linux-baseline",
              intervalMinutes: 10,
              enabled: true,
              nextRunAt: "2026-06-07T01:10:00.000Z",
              createdAt: "2026-06-07T01:00:00.000Z",
              updatedAt: "2026-06-07T01:00:00.000Z",
            },
          ],
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    const schedules = await store.list();
    const persisted = await storage.state.get<{ schedules: Array<{ id: string }> }>("inspection-schedules");

    expect(schedules).toHaveLength(1);
    expect(schedules[0]?.id).toBe("schedule-legacy-001");
    expect(persisted?.schedules[0]?.id).toBe("schedule-legacy-001");
  });
});
