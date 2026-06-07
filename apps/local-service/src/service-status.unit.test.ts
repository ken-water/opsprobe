import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readPersistedServiceMode } from "./service-status";

const cleanupPaths: string[] = [];

async function createTempDir() {
  const rootDir = await mkdtemp(join(tmpdir(), "opsprobe-service-status-test-"));
  cleanupPaths.push(rootDir);
  return rootDir;
}

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("readPersistedServiceMode", () => {
  it("returns stopped when the persisted snapshot says stopped", async () => {
    const rootDir = await createTempDir();
    const statusFile = join(rootDir, "local-service-status.json");

    await writeFile(
      statusFile,
      `${JSON.stringify({ snapshot: { status: "stopped" } }, null, 2)}\n`,
      "utf8",
    );

    await expect(readPersistedServiceMode(statusFile)).resolves.toBe("stopped");
  });

  it("falls back to starting when the file is missing or malformed", async () => {
    const rootDir = await createTempDir();
    const missingFile = join(rootDir, "missing-status.json");
    const malformedFile = join(rootDir, "malformed-status.json");

    await writeFile(malformedFile, "{not-json}\n", "utf8");

    await expect(readPersistedServiceMode(missingFile)).resolves.toBe("starting");
    await expect(readPersistedServiceMode(malformedFile)).resolves.toBe("starting");
  });
});
