import { expect, test, type Page } from "@playwright/test";

interface DesktopMockOptions {
  fail_first_ssh?: boolean;
  history_delay_ms?: number;
}

async function installDesktopMock(page: Page, options: DesktopMockOptions = {}) {
  await page.addInitScript((mockOptions: DesktopMockOptions) => {
    const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
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
    const savedAssets = [
      {
        id: "asset-linux-001",
        name: "opsprobe-demo-host",
        kind: "linux-host",
        protocol: "ssh",
        host: "10.0.0.12",
        port: 22,
        tags: ["demo", "linux"],
        credential: {
          method: "private-key",
          username: "root",
          secretRef: "/home/user/.ssh/id_rsa",
          bindingStatus: "linked",
        },
        createdAt: "2026-06-03T00:00:00.000Z",
        updatedAt: "2026-06-03T00:00:00.000Z",
      },
    ];
    const schedules = [
      {
        id: "schedule-0",
        asset: clone(savedAssets[0]),
        templateId: "template.linux.nginx",
        intervalMinutes: 15,
        enabled: true,
        nextRunAt: "2026-06-05T10:00:00.000Z",
        lastRunStatus: "completed",
        lastRunAt: "2026-06-05T09:45:00.000Z",
      },
    ];
    let serviceStatus = "ready";
    let sshAttemptCount = 0;
    const historyDelayMs = mockOptions.history_delay_ms ?? 0;

    (window as Window & {
      __OPS_PROBE_DESKTOP__?: {
        invoke?: (command: string, payload?: Record<string, unknown>) => Promise<unknown>;
      };
    }).__OPS_PROBE_DESKTOP__ = {
      invoke: async (command: string, payload?: Record<string, unknown>) => {
        if (historyDelayMs > 0 && command === "get_local_service_inspection_history") {
          await new Promise((resolve) => window.setTimeout(resolve, historyDelayMs));
        }

        switch (command) {
          case "get_local_service_settings":
            return { settings: {} };
          case "upsert_local_service_settings":
            return { ok: true };
          case "get_local_service_status":
            return {
              ok: true,
              snapshot: {
                status: serviceStatus,
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
            return { assets: clone(savedAssets) };
          case "get_local_service_schedules":
            return { schedules: clone(schedules) };
          case "get_local_service_inspection_history":
            return { runs: clone(historyRuns) };
          case "test_ssh_connection":
            sshAttemptCount += 1;
            if (mockOptions.fail_first_ssh && sshAttemptCount === 1) {
              return {
                ok: false,
                message: "SSH authentication failed for root@10.0.0.12:22. Verify the private key and retry.",
              };
            }
            return { ok: true, message: "SSH connection successful." };
          case "run_linux_check":
            return {
              checkId: "linux.mock.check",
              title: "Mock Linux Check",
              status: "pass",
              severity: "info",
              summary: "Mock check passed.",
              evidence: [{ label: "Command", value: "ok" }],
              remediation: "No action required.",
            };
          case "get_local_service_inspection_preview":
            return { run: clone(historyRuns[0]) };
          case "run_local_service_inspection":
            return { run: clone(historyRuns[0]) };
          case "export_local_service_html_report":
            return { message: "Exported HTML report." };
          case "export_local_service_config":
            return { message: "Exported local config package." };
          case "import_local_service_config":
            return {
              importedAssets: 1,
              importedTemplates: 2,
              importedSchedules: 1,
              importedFrom: { machineName: "opsprobe-devbox" },
              requiresCredentialRebind: 1,
              disabledSchedules: 1,
            };
          case "save_export_file":
            return "Saved PDF export.";
          case "open_export_path":
            return typeof payload?.path === "string" ? payload.path : "";
          case "reveal_export_path":
            return typeof payload?.path === "string" ? payload.path : "";
          case "upsert_local_service_asset": {
            const nextAsset =
              payload?.input && typeof payload.input === "object"
                ? ((payload.input as { asset?: unknown }).asset as typeof savedAssets[number] | undefined)
                : undefined;
            if (nextAsset) {
              const index = savedAssets.findIndex((asset) => asset.id === nextAsset.id);
              if (index >= 0) {
                savedAssets[index] = clone(nextAsset);
              } else {
                savedAssets.push(clone(nextAsset));
              }
            }
            return { message: "Asset saved." };
          }
          case "upsert_local_service_schedule":
          {
            const input =
              payload?.input && typeof payload.input === "object"
                ? (payload.input as {
                    id?: string;
                    asset?: typeof savedAssets[number];
                    templateId?: string;
                    intervalMinutes?: number;
                    enabled?: boolean;
                  })
                : undefined;
            const schedule = {
              id: input?.id ?? `schedule-${schedules.length + 1}`,
              asset: clone(input?.asset ?? savedAssets[0]),
              templateId: input?.templateId ?? "template.linux.nginx",
              intervalMinutes: input?.intervalMinutes ?? 15,
              enabled: input?.enabled ?? true,
              nextRunAt: "2026-06-05T10:15:00.000Z",
              lastRunStatus: input?.enabled === false ? "disabled" : "pending",
              lastRunAt: "2026-06-05T09:45:00.000Z",
            };
            const index = schedules.findIndex((item) => item.id === schedule.id);
            if (index >= 0) {
              schedules[index] = schedule;
            } else {
              schedules.push(schedule);
            }
            return { schedule: clone(schedule) };
          }
          case "delete_local_service_schedule": {
            const id =
              payload?.input && typeof payload.input === "object"
                ? ((payload.input as { id?: string }).id ?? "")
                : "";
            const index = schedules.findIndex((schedule) => schedule.id === id);
            if (index >= 0) {
              schedules.splice(index, 1);
            }
            return { message: "Schedule deleted." };
          }
          case "start_local_service":
            serviceStatus = "ready";
            return "Local service started.";
          case "stop_local_service":
            serviceStatus = "stopped";
            return { message: "Local service stopped." };
          case "restart_local_service":
            serviceStatus = "ready";
            return { message: "Local service restarted." };
          case "bootstrap_local_service_postgres":
            return { message: "Managed PostgreSQL bootstrapped." };
          case "start_local_service_postgres":
            return { message: "Managed PostgreSQL started." };
          case "stop_local_service_postgres":
            return { message: "Managed PostgreSQL stopped." };
          default:
            return {};
        }
      },
    };
  }, options);
}

test.beforeEach(async ({ page }) => {
  await installDesktopMock(page);
});

test("keeps sidebar concise and switches workspaces with visible feedback", async ({ page }) => {
  await page.goto("/");

  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("button", { name: "Inspection Hub" })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Assets & Strategy" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Inspection" })).toBeVisible();

  await page.getByRole("button", { name: "Inspection Results" }).click();
  await expect(page.getByRole("heading", { name: "Inspection Results", level: 2 })).toBeVisible();
  await expect(page.getByText("Workspace Update")).toBeVisible();
  await expect(page.getByText("Opening Inspection Results...")).toBeVisible();
});

test("makes setup mode and demo entry explicit", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });
  await nav.getByRole("button", { name: "System Settings" }).click();

  await expect(page.getByRole("heading", { name: "System Settings", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Readiness Summary", level: 2 })).toBeVisible();
  await expect(page.locator(".readiness-hero-card").getByText("Ready for first real inspection", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Actionable Repair Packs", level: 2 })).toBeVisible();
  await expect(page.locator(".repair-pack-card").getByText("Managed runtime", { exact: true })).toBeVisible();
  await expect(page.locator(".repair-pack-card").getByText("Report exports", { exact: true })).toBeVisible();
  await expect(page.locator(".repair-pack-card").getByText("Local SSH tools", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "First-Run Wizard", level: 2 })).toBeVisible();
  await expect(page.locator(".workflow-step-card").first().getByRole("button", { name: /Start Service|Open Assets & Strategy/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Demo Data Loaded" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch to Real Setup" }).last()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Minimum Local Setup", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Troubleshooting Guidance", level: 2 })).toBeVisible();

  await page.getByRole("button", { name: "Switch to Real Setup" }).last().click();
  await expect(page.getByRole("button", { name: "Real Setup Active" })).toBeVisible();
  await expect(page.getByText("Real setup mode is active")).toBeVisible();

  await page.getByRole("button", { name: "Explore Demo Data" }).last().click();
  await expect(page.getByRole("button", { name: "Demo Data Loaded" })).toBeVisible();
});

test("switches report audience and exports the selected history run with visible feedback", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });

  await nav.getByRole("button", { name: "Inspection Results" }).click();
  const reportsPanel = page.locator(".reports-config-panel");
  await expect(reportsPanel.getByText("Export Audience")).toBeVisible();
  await page.getByRole("button", { name: "Use Manager Mode" }).click();
  await expect(reportsPanel.getByText("manager", { exact: true })).toBeVisible();

  await nav.getByRole("button", { name: "System Settings" }).click();
  await page.getByRole("button", { name: "Switch to Real Setup" }).last().click();
  await expect(page.getByRole("button", { name: "Real Setup Active" })).toBeVisible();

  await nav.getByRole("button", { name: "Inspection Results" }).click();
  await expect(page.getByRole("heading", { name: "Inspection Results", level: 2 })).toBeVisible();
  await page.getByRole("button", { name: /history-2/ }).click();
  const historyDetail = page.locator(".history-detail-card");
  await expect(historyDetail.getByRole("heading", { name: "Selected Run", level: 3 })).toBeVisible();
  await expect(historyDetail.getByText(/history-2/)).toBeVisible();
  await expect(historyDetail.getByText("Disk Usage")).toBeVisible();

  await historyDetail.getByRole("button", { name: "Export manager HTML" }).click();
  await expect(page.getByText("Workspace Update")).toBeVisible();
  await expect(page.getByText("Exported HTML report.")).toBeVisible();
});

test("shows immediate runner feedback for ssh test and preview refresh", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });

  await nav.getByRole("button", { name: "Assets & Strategy" }).click();

  await page.getByRole("button", { name: "Test SSH Connection" }).click();
  await expect(page.getByText("Workspace Update")).toBeVisible();
  await expect(page.getByRole("status").getByText("SSH connection verified and asset state refreshed.")).toBeVisible();
  await expect(page.getByText("SSH connection successful.")).toBeVisible();

  await page.getByRole("button", { name: "Preview Inspection Results" }).click();
  await expect(page.getByRole("status").getByText(/Inspection preview refreshed with \d+ checks\./)).toBeVisible();
  await expect(page.locator(".runner-results-panel").getByText("Inspection Preview", { exact: true })).toBeVisible();
});

test("keeps assets and service actions visibly responsive", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });

  await nav.getByRole("button", { name: "System Settings" }).click();
  await page.getByRole("button", { name: "Switch to Real Setup" }).last().click();
  await expect(page.getByRole("button", { name: "Real Setup Active" })).toBeVisible();

  await nav.getByRole("button", { name: "Assets & Strategy" }).click();
  await page.getByRole("button", { name: "Save Current Asset" }).click();
  await expect(page.getByRole("status").getByText("Asset saved.")).toBeVisible();
  await expect(page.locator(".assets-list-panel").getByText("1 total")).toBeVisible();

  await page.getByRole("button", { name: "Export Local Config" }).click();
  await expect(page.getByRole("status").getByText("Exported local config package.")).toBeVisible();

  await page.getByRole("button", { name: "Import Local Config" }).click();
  await expect(
    page.getByRole("status").getByText(/Imported 1 assets, 2 templates, and 1 schedules from opsprobe-devbox/),
  ).toBeVisible();

  const servicePanel = page.locator(".service-runtime-panel");
  await page.getByRole("button", { name: "Start Service", exact: true }).click();
  await expect(page.getByRole("status").getByText("Local service started.")).toBeVisible();
  await expect(servicePanel.locator(".service-pill").getByText("ready")).toBeVisible();

  await page.getByRole("button", { name: "Create Schedule" }).click();
  await expect(page.getByRole("status").getByText("Saved schedule schedule-2.")).toBeVisible();
  await expect(page.getByText("2 total")).toBeVisible();

  await page.getByRole("button", { name: "Disable" }).first().click();
  await expect(page.getByRole("status").getByText("schedule-0 disabled successfully.")).toBeVisible();

  await page.getByRole("button", { name: "Delete" }).first().click();
  await expect(page.getByRole("status").getByText("Schedule deleted.")).toBeVisible();
});

test("surfaces ssh failure clearly and lets the operator retry successfully", async ({ page }) => {
  await installDesktopMock(page, { fail_first_ssh: true });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });

  await nav.getByRole("button", { name: "Assets & Strategy" }).click();
  await page.getByRole("button", { name: "Test SSH Connection" }).click();
  await expect(page.getByRole("status").getByText(/SSH authentication failed/)).toBeVisible();
  await expect(page.locator(".global-feedback-error")).toBeVisible();
  await expect(page.getByText("Repair Guide")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry SSH Test" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch To Password" })).toBeVisible();

  await page.getByRole("button", { name: "Test SSH Connection" }).click();
  await expect(page.getByRole("status").getByText("SSH connection verified and asset state refreshed.")).toBeVisible();
  await expect(page.locator(".global-feedback-success")).toBeVisible();
});

test("shows loading feedback when history refresh is slow", async ({ page }) => {
  await installDesktopMock(page, { history_delay_ms: 450 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });

  await nav.getByRole("button", { name: "Inspection Results" }).click();
  await page.getByRole("button", { name: "Refresh History" }).click();
  await expect(page.getByText("Loading run history")).toBeVisible();
  await expect(page.getByRole("status").getByText(/Loaded \d+ inspection runs?/)).toBeVisible();
});

test("supports opening exported files and revealing them in the local folder", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });

  await nav.getByRole("button", { name: "Inspection Results" }).click();

  await page.getByRole("button", { name: "Open HTML File" }).click();
  await expect(page.getByRole("status").getByText(/Opened exported file .*opsprobe-report.*\.html/)).toBeVisible();

  await page.getByRole("button", { name: "Show PDF In Folder" }).click();
  await expect(page.getByRole("status").getByText(/Revealed exported file .*opsprobe-report.*\.pdf/)).toBeVisible();
});
