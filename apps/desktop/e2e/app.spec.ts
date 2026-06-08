import { expect, test, type Page } from "@playwright/test";

async function installDesktopMock(page: Page) {
  await page.addInitScript(() => {
    const historyRuns = [
      {
        id: "history-1",
        taskId: "task-history-1",
        assetId: "asset-linux-001",
        templateId: "template.linux.nginx",
        status: "completed",
        summary: {
          total: 2,
          pass: 1,
          warning: 1,
          critical: 0,
          unknown: 0,
        },
        results: [
          {
            checkId: "linux.nginx.process",
            title: "Nginx Process Status",
            status: "pass",
            severity: "info",
            summary: "nginx is running normally.",
            evidence: [{ label: "Process", value: "nginx" }],
            remediation: "No action required.",
          },
          {
            checkId: "linux.cpu.usage",
            title: "CPU Usage",
            status: "warning",
            severity: "warning",
            summary: "CPU usage is elevated during the inspection window.",
            evidence: [{ label: "Usage", value: "76.4%" }],
            remediation: "Review workload spikes and top CPU consumers.",
          },
        ],
        createdAt: "2026-06-04T08:30:00.000Z",
        updatedAt: "2026-06-04T08:30:00.000Z",
      },
      {
        id: "history-2",
        taskId: "task-history-2",
        assetId: "asset-linux-001",
        templateId: "template.linux.kubernetes",
        status: "completed",
        summary: {
          total: 2,
          pass: 0,
          warning: 1,
          critical: 1,
          unknown: 0,
        },
        results: [
          {
            checkId: "linux.disk.usage",
            title: "Disk Usage",
            status: "critical",
            severity: "critical",
            summary: "Root filesystem usage is high enough to risk node instability.",
            evidence: [{ label: "Usage", value: "92.1%" }],
            remediation: "Free space on the node and review image, log, and container retention settings.",
          },
          {
            checkId: "linux.kubernetes.node.runtime",
            title: "Kubernetes Node Runtime",
            status: "warning",
            severity: "warning",
            summary: "The node is still using an older cgroup driver.",
            evidence: [{ label: "Runtime", value: "Runtime=containerd CgroupDriver=cgroupfs" }],
            remediation: "Align the node runtime with the cluster baseline before the next rollout.",
          },
        ],
        createdAt: "2026-06-04T09:10:00.000Z",
        updatedAt: "2026-06-04T09:10:00.000Z",
      },
    ];

    (window as Window & {
      __OPS_PROBE_DESKTOP__?: {
        invoke?: (command: string, payload?: Record<string, unknown>) => Promise<unknown>;
      };
    }).__OPS_PROBE_DESKTOP__ = {
      invoke: async (command: string, payload?: Record<string, unknown>) => {
        switch (command) {
          case "get_local_service_settings":
            return { settings: {} };
          case "upsert_local_service_settings":
            return { ok: true };
          case "get_local_service_status":
            return {
              ok: true,
              snapshot: {
                status: "ready",
                config: {
                  postgres: { port: 15432 },
                  paths: {
                    reportDir: "/tmp/opsprobe-reports",
                    postgresDataDir: "/tmp/opsprobe-pg/data",
                    postgresLogDir: "/tmp/opsprobe-pg/log",
                  },
                },
                health: {
                  runtime: null,
                  checks: [
                    {
                      id: "service.process",
                      label: "Managed Service Process",
                      status: "pass",
                      detail: "The local service background process is running.",
                    },
                    {
                      id: "local.report_dir",
                      label: "Report Directory",
                      status: "pass",
                      detail: "Report export directory is writable.",
                    },
                  ],
                },
                recoveryActions: [],
              },
            };
          case "get_local_service_assets":
            return { assets: [] };
          case "get_local_service_schedules":
            return { schedules: [] };
          case "get_local_service_inspection_history":
            return { runs: historyRuns };
          case "test_ssh_connection":
            return { ok: true, message: "SSH connection successful." };
          case "get_local_service_inspection_preview":
            return { run: historyRuns[0] };
          case "run_local_service_inspection":
            return { run: historyRuns[0] };
          case "export_local_service_html_report":
            return { message: "Exported HTML report." };
          case "save_export_file":
            return "Saved PDF export.";
          case "upsert_local_service_asset":
            return { message: "Asset saved." };
          case "upsert_local_service_schedule":
            return {
              schedule: {
                id: "schedule-1",
                asset: payload?.input && typeof payload.input === "object" ? (payload.input as { asset?: unknown }).asset : null,
                templateId: "template.linux.nginx",
                intervalMinutes: 15,
                enabled: true,
              },
            };
          case "delete_local_service_schedule":
            return { message: "Schedule deleted." };
          default:
            return {};
        }
      },
    };
  });
}

test.beforeEach(async ({ page }) => {
  await installDesktopMock(page);
});

test("keeps sidebar concise and switches workspaces with visible feedback", async ({ page }) => {
  await page.goto("/");

  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("button", { name: "Overview" })).toBeVisible();
  await expect(nav.getByText("Current posture and first-run progress.")).toHaveCount(0);
  await expect(nav.getByText("Local-first inspection workspace for operators, not a browser landing page.")).toHaveCount(0);

  await page.getByRole("button", { name: "Runner" }).click();
  await expect(page.getByRole("heading", { name: "Inspection Runner", level: 1 })).toBeVisible();
  await expect(page.getByText("Workspace Update")).toBeVisible();
  await expect(page.getByText("Opening Inspection Runner...")).toBeVisible();
});

test("makes setup mode and demo entry explicit", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Setup" }).click();

  await expect(page.getByRole("heading", { name: "First-Run Setup", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Demo Data Loaded" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch to Real Setup" })).toBeVisible();

  await page.getByRole("button", { name: "Switch to Real Setup" }).click();
  await expect(page.getByRole("button", { name: "Real Setup Active" })).toBeVisible();
  await expect(page.getByText("Real setup mode is active")).toBeVisible();

  await page.getByRole("button", { name: "Explore Demo Data" }).click();
  await expect(page.getByRole("button", { name: "Demo Data Loaded" })).toBeVisible();
});

test("switches report audience and exports the selected history run with visible feedback", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Reports" }).click();
  const reportsPanel = page.locator(".reports-config-panel");
  await expect(reportsPanel.getByText("Export Audience")).toBeVisible();
  await page.getByRole("button", { name: "Use Manager Mode" }).click();
  await expect(reportsPanel.getByText("manager", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Setup" }).click();
  await page.getByRole("button", { name: "Switch to Real Setup" }).click();
  await expect(page.getByRole("button", { name: "Real Setup Active" })).toBeVisible();

  await page.getByRole("button", { name: "History" }).click();
  await expect(page.getByRole("heading", { name: "Run History", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: /history-2/ }).click();
  const historyDetail = page.locator(".history-detail-card");
  await expect(historyDetail.getByRole("heading", { name: "Selected Run", level: 3 })).toBeVisible();
  await expect(historyDetail.getByText(/history-2/)).toBeVisible();
  await expect(historyDetail.getByText("Disk Usage")).toBeVisible();

  await page.getByRole("button", { name: "Export manager HTML" }).click();
  await expect(page.getByText("Workspace Update")).toBeVisible();
  await expect(page.getByText("Exported HTML report.")).toBeVisible();
});
