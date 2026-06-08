import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { Asset } from "@opsprobe/core";
import { LocalFileStorageAdapter } from "./index";

const cleanupPaths: string[] = [];

const asset: Asset = {
  id: "asset-storage-001",
  name: "storage-host",
  kind: "linux-host",
  protocol: "ssh",
  host: "192.0.2.60",
  port: 22,
  tags: ["storage"],
  credential: {
    method: "private-key",
    username: "opsprobe",
    secretRef: "/tmp/opsprobe-storage-id_rsa",
    bindingStatus: "linked",
  },
  createdAt: "2026-06-08T00:00:00.000Z",
  updatedAt: "2026-06-08T00:00:00.000Z",
};

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

async function createAdapter() {
  const rootDir = await mkdtemp(join(tmpdir(), "opsprobe-storage-unit-"));
  cleanupPaths.push(rootDir);
  const filePath = join(rootDir, "opsprobe-storage.json");
  return {
    rootDir,
    filePath,
    adapter: new LocalFileStorageAdapter(filePath),
  };
}

describe("LocalFileStorageAdapter", () => {
  it("recovers from malformed storage snapshots by quarantining and rebuilding", async () => {
    const { adapter, filePath, rootDir } = await createAdapter();

    await writeFile(filePath, "{not-json}\n", "utf8");

    const assets = await adapter.assets.list();
    const files = await readdir(rootDir);
    const rebuilt = await readFile(filePath, "utf8");

    expect(assets).toEqual([]);
    expect(files.some((file) => file.startsWith("opsprobe-storage.json.corrupt-"))).toBe(true);
    expect(rebuilt).toContain("\"assets\": []");
    expect(rebuilt).toContain("\"state\": {}");
  });

  it("preserves new writes after recovering from malformed storage", async () => {
    const { adapter, filePath } = await createAdapter();

    await writeFile(filePath, "{broken-json}\n", "utf8");
    await adapter.assets.upsert(asset);

    const assets = await adapter.assets.list();

    expect(assets).toHaveLength(1);
    expect(assets[0]?.id).toBe(asset.id);
  });
});
