import { describe, expect, it } from "vitest";
import type { Asset, InspectionRun } from "@opsprobe/core";
import { buildSingleRunReportView, renderInspectionReportHtml } from "./index";

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
    total: 3,
    passed: 1,
    warning: 1,
    critical: 1,
    unknown: 0,
  },
  results: [
    {
      checkId: "linux.nginx.process",
      title: "Nginx Process Status",
      status: "pass",
      severity: "info",
      summary: "nginx is running.",
      evidence: [{ label: "Process", value: "nginx" }],
      remediation: "No action required.",
    },
    {
      checkId: "linux.nginx.vhost.inventory",
      title: "Nginx Virtual Host Inventory",
      status: "warning",
      severity: "warning",
      summary: "Unexpected virtual host count detected.",
      evidence: [{ label: "Server Blocks", value: "5" }],
      remediation: "Review active sites before the next rollout.",
    },
    {
      checkId: "linux.nginx.tls.expiry",
      title: "Nginx TLS Certificate Expiry",
      status: "critical",
      severity: "critical",
      summary: "A certificate expires within 14 days.",
      evidence: [{ label: "Certificate", value: "/etc/nginx/certs/site.pem expires in 7 day(s)" }],
      remediation: "Renew certificates before expiry and reload nginx.",
    },
  ],
};

describe("report view model", () => {
  it("builds grouped host and severity summaries for a single run", () => {
    const view = buildSingleRunReportView(run, asset);

    expect(view.hosts).toHaveLength(1);
    expect(view.hosts[0]?.assetName).toBe("edge-gateway-01");
    expect(view.overallSummary.critical).toBe(1);
    expect(view.overallSeveritySummary.warning).toBe(1);
    expect(view.severityGroups[0]?.severity).toBe("critical");
    expect(view.severityGroups[0]?.checks[0]?.actionFocus).toBe(
      "Renew certificates before expiry and reload nginx.",
    );
    expect(view.severityGroups[0]?.checks[0]?.evidenceHighlight).toContain("Certificate:");
  });

  it("renders distinct operator and manager report variants", () => {
    const view = buildSingleRunReportView(run, asset);

    const operatorHtml = renderInspectionReportHtml(view, {
      title: "Operator Report",
      audience: "operator",
    });
    const managerHtml = renderInspectionReportHtml(view, {
      title: "Manager Report",
      audience: "manager",
    });

    expect(operatorHtml).toContain("Detailed Results");
    expect(operatorHtml).toContain("Action Queue");
    expect(operatorHtml).toContain("Action focus:");
    expect(operatorHtml).toContain("Evidence signal:");
    expect(operatorHtml).toContain("Suggestion:");
    expect(managerHtml).toContain("Executive Summary");
    expect(managerHtml).toContain("Priority Actions");
    expect(managerHtml).toContain("Action focus:");
    expect(managerHtml).toContain("Evidence signal:");
    expect(managerHtml).not.toContain("Detailed Results");
  });
});
