import { describe, expect, it } from "vitest";
import type { Asset, InspectionRun } from "@opsprobe/core";
import { buildInspectionReportView, buildSingleRunReportView, renderInspectionReportHtml } from "./index";

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

const repeatedRun: InspectionRun = {
  ...run,
  id: "run-nginx-002",
  createdAt: "2026-06-05T05:00:00.000Z",
  updatedAt: "2026-06-05T05:00:00.000Z",
};

const correlatedRun: InspectionRun = {
  ...run,
  id: "run-nginx-003",
  createdAt: "2026-06-05T06:00:00.000Z",
  updatedAt: "2026-06-05T06:00:00.000Z",
  summary: {
    total: 4,
    passed: 0,
    warning: 3,
    critical: 1,
    unknown: 0,
  },
  results: [
    {
      checkId: "linux.disk.usage",
      title: "Disk Usage",
      status: "warning",
      severity: "warning",
      summary: "Disk usage is elevated and should be reviewed.",
      evidence: [{ label: "Usage", value: "91%" }],
      remediation: "Review filesystem growth and cleanup opportunities.",
    },
    {
      checkId: "linux.log.usage",
      title: "Log Directory Usage",
      status: "warning",
      severity: "warning",
      summary: "/var/log usage is elevated and should be reviewed.",
      evidence: [{ label: "Usage", value: "88%" }],
      remediation: "Review log rotation and oversized files in /var/log.",
    },
    {
      checkId: "linux.nginx.log.risk",
      title: "Nginx Error Log Risk",
      status: "warning",
      severity: "warning",
      summary: "Recent nginx error-log activity should be reviewed.",
      evidence: [{ label: "Signals", value: "upstream timed out, permission denied" }],
      remediation: "Review recent upstream failures and repeated edge errors.",
    },
    {
      checkId: "linux.nginx.tls.expiry",
      title: "Nginx TLS Certificate Expiry",
      status: "critical",
      severity: "critical",
      summary: "A certificate expires within 7 days.",
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

  it("builds recurring actions across repeated abnormal findings", () => {
    const view = buildInspectionReportView({
      runs: [run, repeatedRun],
      assets: [asset],
    });
    const operatorHtml = renderInspectionReportHtml(view, {
      title: "Operator Report",
      audience: "operator",
    });

    expect(view.recurringActions).toHaveLength(2);
    expect(view.recurringActions[0]?.occurrences).toBe(2);
    expect(operatorHtml).toContain("Recurring Actions");
    expect(operatorHtml).toContain("2x");
    expect(operatorHtml).toContain("Last seen 2026-06-05T05:00:00.000Z");
  });

  it("builds correlated priority actions from host and service findings", () => {
    const view = buildInspectionReportView({
      runs: [correlatedRun],
      assets: [asset],
    });
    const managerHtml = renderInspectionReportHtml(view, {
      title: "Manager Report",
      audience: "manager",
    });
    const correlatedAction = view.priorityActions.find((action) => action.correlationKind === "host-service");

    expect(view.priorityActions).toHaveLength(2);
    expect(correlatedAction?.title).toContain("Correlate host storage and log risk with Nginx edge service");
    expect(correlatedAction?.relatedCheckCount).toBe(3);
    expect(correlatedAction?.relatedCheckTitles).toContain("Disk Usage");
    expect(correlatedAction?.relatedCheckTitles).toContain("Nginx Error Log Risk");
    expect(managerHtml).toContain("Related checks:");
    expect(managerHtml).toContain("3 related signal(s)");
    expect(managerHtml).toContain("Correlate host storage and log risk with Nginx edge service");
  });
});
