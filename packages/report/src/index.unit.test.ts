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

const mysqlAsset: Asset = {
  ...asset,
  id: "asset-mysql-001",
  name: "mysql-primary-01",
  host: "10.10.0.25",
  tags: ["mysql", "primary"],
};

const mysqlCorrelatedRun: InspectionRun = {
  ...run,
  id: "run-mysql-001",
  taskId: "task-mysql-001",
  assetId: mysqlAsset.id,
  templateId: "template.linux.mysql",
  createdAt: "2026-06-05T07:00:00.000Z",
  updatedAt: "2026-06-05T07:00:00.000Z",
  summary: {
    total: 4,
    passed: 0,
    warning: 4,
    critical: 0,
    unknown: 0,
  },
  results: [
    {
      checkId: "linux.cpu.usage",
      title: "CPU Usage",
      status: "warning",
      severity: "warning",
      summary: "CPU usage is elevated and should be reviewed.",
      evidence: [{ label: "Usage", value: "84%" }],
      remediation: "Inspect top CPU-consuming processes and review workload spikes.",
    },
    {
      checkId: "linux.mysql.connection.pressure",
      title: "MySQL Connection Pressure",
      status: "warning",
      severity: "warning",
      summary: "MySQL connection pressure should be reviewed before it affects availability.",
      evidence: [{ label: "Signals", value: "max_used_connections near max_connections" }],
      remediation: "Review connection pooling and idle session cleanup if utilization remains elevated.",
    },
    {
      checkId: "linux.mysql.slow-query.risk",
      title: "MySQL Slow Query Risk",
      status: "warning",
      severity: "warning",
      summary: "MySQL slow-query posture should be reviewed for recurring performance issues.",
      evidence: [{ label: "Signals", value: "Slow_queries increased by 540" }],
      remediation: "Investigate repeated slow-query growth before latency increases.",
    },
    {
      checkId: "linux.mysql.temp-disk-table.risk",
      title: "MySQL Temp Disk Table Risk",
      status: "warning",
      severity: "warning",
      summary: "MySQL temporary table spill risk should be reviewed for heavier query patterns.",
      evidence: [{ label: "Signals", value: "Created_tmp_disk_tables ratio elevated" }],
      remediation: "Review temporary table growth and query patterns if disk temp tables keep increasing.",
    },
  ],
};

const redisAsset: Asset = {
  ...asset,
  id: "asset-redis-001",
  name: "redis-cache-01",
  host: "10.10.0.35",
  tags: ["redis", "cache"],
};

const redisCorrelatedRun: InspectionRun = {
  ...run,
  id: "run-redis-001",
  taskId: "task-redis-001",
  assetId: redisAsset.id,
  templateId: "template.linux.redis",
  createdAt: "2026-06-05T08:00:00.000Z",
  updatedAt: "2026-06-05T08:00:00.000Z",
  summary: {
    total: 3,
    passed: 0,
    warning: 3,
    critical: 0,
    unknown: 0,
  },
  results: [
    {
      checkId: "linux.memory.usage",
      title: "Memory Usage",
      status: "warning",
      severity: "warning",
      summary: "Memory usage is elevated and should be reviewed.",
      evidence: [{ label: "Usage", value: "89%" }],
      remediation: "Review overall memory pressure and workload spikes.",
    },
    {
      checkId: "linux.redis.memory.pressure",
      title: "Redis Memory Pressure",
      status: "warning",
      severity: "warning",
      summary: "Redis memory pressure should be reviewed before it impacts latency or writes.",
      evidence: [{ label: "Signals", value: "used_memory at 92% of maxmemory" }],
      remediation: "Review maxmemory sizing and workload growth if Redis memory usage remains elevated.",
    },
    {
      checkId: "linux.redis.eviction.risk",
      title: "Redis Eviction And Rejection Risk",
      status: "warning",
      severity: "warning",
      summary: "Redis eviction or connection rejection risk should be reviewed before it impacts clients.",
      evidence: [{ label: "Signals", value: "evicted_keys and rejected_connections increasing" }],
      remediation: "Review client-count limits and eviction activity before Redis starts dropping useful data.",
    },
  ],
};

const kubernetesAsset: Asset = {
  ...asset,
  id: "asset-k8s-001",
  name: "k8s-node-01",
  host: "10.10.0.45",
  tags: ["kubernetes", "node"],
};

const kubernetesCorrelatedRun: InspectionRun = {
  ...run,
  id: "run-k8s-001",
  taskId: "task-k8s-001",
  assetId: kubernetesAsset.id,
  templateId: "template.linux.kubernetes",
  createdAt: "2026-06-05T09:00:00.000Z",
  updatedAt: "2026-06-05T09:00:00.000Z",
  summary: {
    total: 3,
    passed: 0,
    warning: 3,
    critical: 0,
    unknown: 0,
  },
  results: [
    {
      checkId: "linux.kubernetes.static-pod.inventory",
      title: "Kubernetes Static Pod Inventory",
      status: "warning",
      severity: "warning",
      summary: "Kubernetes static pod and critical container inventory should be reviewed.",
      evidence: [{ label: "Inventory", value: "critical control-plane container not running" }],
      remediation: "Review missing static pod manifests or non-running critical node containers before the next release window.",
    },
    {
      checkId: "linux.kubernetes.node.pressure",
      title: "Kubernetes Node Pressure Signals",
      status: "warning",
      severity: "warning",
      summary: "Kubernetes node pressure signals should be reviewed.",
      evidence: [{ label: "Pressure", value: "imagefs.available below threshold" }],
      remediation: "Review memory, filesystem, or PID pressure before the node begins evicting workloads.",
    },
    {
      checkId: "linux.kubelet.health.summary",
      title: "Kubelet Health Summary",
      status: "warning",
      severity: "warning",
      summary: "Kubelet health summary should be reviewed.",
      evidence: [{ label: "Kubelet", value: "restart count increased by 6" }],
      remediation: "Review unexpected restart growth or recent kubelet failures before the next maintenance window.",
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
    expect(view.priorityActions[0]?.priorityRank).toBe(1);
    expect(view.priorityActions[0]?.urgencyLabel).toBe("immediate");
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
    expect(operatorHtml).toContain("Why now:");
    expect(operatorHtml).toContain("P1");
    expect(operatorHtml).toContain("Suggestion:");
    expect(managerHtml).toContain("Executive Summary");
    expect(managerHtml).toContain("Priority Actions");
    expect(managerHtml).toContain("Action focus:");
    expect(managerHtml).toContain("Evidence signal:");
    expect(managerHtml).toContain("Why now:");
    expect(managerHtml).toContain("Lead Queue Item");
    expect(managerHtml).toContain("priority action(s) are marked immediate");
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
    expect(correlatedAction?.title).toContain("Stabilize Nginx edge service by addressing host storage pressure");
    expect(correlatedAction?.relatedCheckCount).toBe(3);
    expect(correlatedAction?.relatedCheckTitles).toContain("Disk Usage");
    expect(correlatedAction?.relatedCheckTitles).toContain("Nginx Error Log Risk");
    expect(correlatedAction?.rationale).toContain("Cross-layer evidence links host storage and log findings");
    expect(managerHtml).toContain("Related checks:");
    expect(managerHtml).toContain("3 related signal(s)");
    expect(managerHtml).toContain("Stabilize Nginx edge service by addressing host storage pressure");
  });

  it("groups mysql service signals into combined capacity and storage actions", () => {
    const view = buildInspectionReportView({
      runs: [mysqlCorrelatedRun],
      assets: [mysqlAsset],
    });

    const hostServiceAction = view.priorityActions.find((action) => action.correlationKind === "host-service");
    const storageAction = view.priorityActions.find((action) => action.relatedCheckTitles.includes("MySQL Temp Disk Table Risk"));

    expect(hostServiceAction?.title).toContain("Stabilize MySQL service by addressing host capacity pressure");
    expect(hostServiceAction?.relatedCheckTitles).toContain("CPU Usage");
    expect(hostServiceAction?.relatedCheckTitles).toContain("MySQL Connection Pressure");
    expect(hostServiceAction?.relatedCheckTitles).toContain("MySQL Slow Query Risk");
    expect(storageAction?.correlationKind).toBe("single");
    expect(storageAction?.title).toContain("Direct action:");
  });

  it("groups redis host and service pressure into one action queue item", () => {
    const view = buildInspectionReportView({
      runs: [redisCorrelatedRun],
      assets: [redisAsset],
    });
    const operatorHtml = renderInspectionReportHtml(view, {
      title: "Operator Report",
      audience: "operator",
    });
    const hostServiceAction = view.priorityActions.find((action) => action.correlationKind === "host-service");

    expect(view.priorityActions).toHaveLength(1);
    expect(hostServiceAction?.title).toContain("Stabilize Redis service by addressing host capacity pressure");
    expect(hostServiceAction?.relatedCheckCount).toBe(3);
    expect(hostServiceAction?.priorityRank).toBe(1);
    expect(operatorHtml).toContain("redis-cache-01");
    expect(operatorHtml).toContain("Redis service");
  });

  it("groups kubernetes availability signals while keeping pressure separate", () => {
    const view = buildInspectionReportView({
      runs: [kubernetesCorrelatedRun],
      assets: [kubernetesAsset],
    });

    const availabilityAction = view.priorityActions.find((action) => action.correlationKind === "service-cluster");
    const pressureAction = view.priorityActions.find((action) =>
      action.relatedCheckTitles.includes("Kubernetes Node Pressure Signals"),
    );

    expect(view.priorityActions).toHaveLength(2);
    expect(availabilityAction?.title).toContain("Handle related Kubernetes node availability risk together");
    expect(availabilityAction?.relatedCheckTitles).toContain("Kubernetes Static Pod Inventory");
    expect(availabilityAction?.relatedCheckTitles).toContain("Kubelet Health Summary");
    expect(pressureAction?.correlationKind).toBe("single");
  });
});
