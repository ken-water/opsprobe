import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import type { Asset, InspectionRun } from "@opsprobe/core";
import type {
  InspectionPreviewResponse,
  LocalAssetListResponse,
  LocalServiceCommandResponse,
} from "./protocol.ts";
const cleanupPaths: string[] = [];

const asset: Asset = {
  id: "asset-functional-001",
  name: "functional-preview-host",
  kind: "linux-host",
  protocol: "ssh",
  host: "192.0.2.10",
  port: 22,
  tags: ["functional", "preview"],
  credential: {
    method: "private-key",
    username: "opsprobe",
    secretRef: "/tmp/opsprobe-functional-id_rsa",
  },
  createdAt: "2026-06-05T00:00:00.000Z",
  updatedAt: "2026-06-05T00:00:00.000Z",
};

async function runLocalServiceCommand<T>(homeDir: string, mode: string, payload?: unknown): Promise<T> {
  const command = spawnSync(
    "node",
    ["--experimental-strip-types", "./src/main.ts", mode],
    {
      cwd: join(process.cwd(), "apps/local-service"),
      env: {
        ...process.env,
        HOME: homeDir,
      },
      input: payload ? JSON.stringify(payload) : undefined,
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    },
  );

  if (command.status !== 0) {
    throw new Error(command.stderr || `local-service command ${mode} failed`);
  }

  return JSON.parse(command.stdout) as T;
}

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("local-service CLI functional flow", () => {
  it("saves an asset, previews an inspection, and exports an operator HTML report", async () => {
    const homeDir = await mkdtemp(join(tmpdir(), "opsprobe-functional-cli-"));
    cleanupPaths.push(homeDir);

    const saveResponse = await runLocalServiceCommand<LocalServiceCommandResponse>(homeDir, "assets-upsert", {
      asset,
    });
    expect(saveResponse.ok).toBe(true);
    expect(saveResponse.message).toContain(asset.id);

    const listResponse = await runLocalServiceCommand<LocalAssetListResponse>(homeDir, "assets-list");
    expect(listResponse.ok).toBe(true);
    expect(listResponse.assets.map((item) => item.id)).toContain(asset.id);

    const previewResponse = await runLocalServiceCommand<InspectionPreviewResponse>(homeDir, "inspect-preview", {
      asset,
      templateId: "template.linux.nginx.edge",
    });
    expect(previewResponse.ok).toBe(true);
    expect(previewResponse.run.assetId).toBe(asset.id);
    expect(previewResponse.run.results.length).toBeGreaterThan(0);
    expect(previewResponse.run.summary.total).toBe(previewResponse.run.results.length);

    const reportPath = join(homeDir, "preview-operator-report.html");
    const exportResponse = await runLocalServiceCommand<LocalServiceCommandResponse>(
      homeDir,
      "report-export-html",
      {
        path: reportPath,
        run: previewResponse.run satisfies InspectionRun,
        asset,
        audience: "operator",
      },
    );

    const html = await readFile(reportPath, "utf8");

    expect(exportResponse.ok).toBe(true);
    expect(exportResponse.message).toContain("operator HTML report");
    expect(html).toContain("Action Queue");
    expect(html).toContain("functional-preview-host");
    expect(html).toContain("Nginx");
  });

  it("previews the mysql template with deeper connection, replication, and slow-query checks", async () => {
    const homeDir = await mkdtemp(join(tmpdir(), "opsprobe-functional-cli-"));
    cleanupPaths.push(homeDir);

    await runLocalServiceCommand<LocalServiceCommandResponse>(homeDir, "assets-upsert", {
      asset,
    });

    const previewResponse = await runLocalServiceCommand<InspectionPreviewResponse>(homeDir, "inspect-preview", {
      asset,
      templateId: "template.linux.mysql",
    });

    const checkIds = previewResponse.run.results.map((result) => result.checkId);
    expect(previewResponse.ok).toBe(true);
    expect(checkIds).toContain("linux.mysql.connection.pressure");
    expect(checkIds).toContain("linux.mysql.replication.hints");
    expect(checkIds).toContain("linux.mysql.slow-query.risk");
    expect(previewResponse.run.results.some((result) => result.title === "MySQL Connection Pressure")).toBe(true);
  });
});
