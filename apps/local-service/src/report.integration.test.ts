import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { Asset, InspectionRun } from "@opsprobe/core";
import { exportHtmlReport } from "./report";

const cleanupPaths: string[] = [];

const asset: Asset = {
  id: "asset-nginx-001",
  name: "edge-gateway-01",
  kind: "linux-host",
  protocol: "ssh",
  host: "10.10.0.15",
  port: 22,
  tags: ["nginx", "edge"],
  credential: {
    method: "private-key",
    username: "root",
    secretRef: "/tmp/id_rsa",
  },
  createdAt: "2026-06-05T00:00:00.000Z",
  updatedAt: "2026-06-05T00:00:00.000Z",
};

const run: InspectionRun = {
  id: "run-nginx-001",
  taskId: "task-nginx-001",
  assetId: asset.id,
  templateId: "template.linux.nginx.edge",
  status: "completed",
  createdAt: "2026-06-05T01:00:00.000Z",
  updatedAt: "2026-06-05T01:00:00.000Z",
  summary: {
    total: 2,
    passed: 0,
    warning: 1,
    critical: 1,
    unknown: 0,
  },
  results: [
    {
      checkId: "linux.nginx.vhost.inventory",
      title: "Nginx Virtual Host Inventory",
      status: "warning",
      severity: "warning",
      summary: "Unexpected inventory drift detected.",
      evidence: [{ label: "Server Blocks", value: "5" }],
      remediation: "Review the active nginx site inventory.",
    },
    {
      checkId: "linux.nginx.tls.expiry",
      title: "Nginx TLS Certificate Expiry",
      status: "critical",
      severity: "critical",
      summary: "A certificate expires within 14 days.",
      evidence: [{ label: "Certificate", value: "/etc/nginx/certs/site.pem expires in 7 day(s)" }],
      remediation: "Renew certificates and reload nginx.",
    },
  ],
};

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("exportHtmlReport", () => {
  it("exports a manager summary report to disk", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "opsprobe-report-test-"));
    cleanupPaths.push(rootDir);
    const path = join(rootDir, "manager-report.html");

    const response = await exportHtmlReport({
      path,
      run,
      asset,
      audience: "manager",
    });

    const html = await readFile(path, "utf8");

    expect(response.message).toContain("manager HTML report");
    expect(html).toContain("Executive Summary");
    expect(html).toContain("Priority Actions");
    expect(html).toContain("edge-gateway-01");
  });
});
