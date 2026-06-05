import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  builtInInspectionTemplateDefinitions,
  resolveTemplateChecks,
  type CheckDefinition,
  type CheckResult,
} from "@opsprobe/checks";
import {
  createInspectionTemplate,
  summarizeResults,
  type Asset,
  type InspectionRun,
  type InspectionTask,
} from "@opsprobe/core";
import type {
  InspectionExecutionResponse,
  InspectionPreviewResponse,
  LocalAssetListResponse,
  LocalConfigImportResponse,
  LocalDesktopSettingsResponse,
  LocalInspectionSchedule,
  LocalInspectionScheduleListResponse,
  LocalInspectionScheduleUpsertResponse,
  LocalServiceCommandResponse,
  LocalServiceInspectionHistoryResponse,
  LocalServiceStatusResponse,
} from "@opsprobe/local-service";
import { runInspection, type SshConnectionTestInput, type SshConnectionTestResult } from "@opsprobe/runner";
import { exportRunPdfReport } from "./pdf";
import "./App.css";
import type { ReportAudience } from "@opsprobe/report";

const initialAsset: Asset = {
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
  },
  createdAt: "2026-06-03T00:00:00.000Z",
  updatedAt: "2026-06-03T00:00:00.000Z",
};

const builtInTemplates = builtInInspectionTemplateDefinitions.map((definition) =>
  createInspectionTemplate(definition),
);
const defaultTemplate = builtInTemplates[0];
const defaultMigrationPath = "/tmp/opsprobe-config.json";
const defaultReportPath = "/tmp/opsprobe-report.html";
const defaultPdfReportPath = "/tmp/opsprobe-report.pdf";
type ServiceHealthCheck = LocalServiceStatusResponse["snapshot"]["health"]["checks"][number];

interface TroubleshootingCard {
  key: string;
  label: string;
  status: "warning" | "critical";
  detail: string;
  actions: string[];
}

function isActionableServiceCheck(
  check: ServiceHealthCheck,
): check is ServiceHealthCheck & { status: "warning" | "critical" } {
  return check.status === "warning" || check.status === "critical";
}

function templateLabel(templateId: string) {
  return builtInTemplates.find((template) => template.id === templateId)?.name ?? templateId;
}

function extractErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return "Unknown error.";
}

function formatActionError(action: string, error: unknown) {
  return `${action} failed. ${extractErrorMessage(error)}`;
}

function buildServiceCheckActions(
  check: ServiceHealthCheck,
  response: LocalServiceStatusResponse | null,
): string[] {
  const port = response?.snapshot.config.postgres.port ?? 15432;
  const paths = response?.snapshot.config.paths;

  switch (check.id) {
    case "service.process":
      return [
        "Use Start Service to launch the background local service.",
        paths?.serviceStatusFile
          ? `If it still does not stay up, inspect ${paths.serviceStatusFile} and the local service logs under ${paths.logDir}.`
          : "If it still does not stay up, inspect the local service status file and logs under ~/.opsprobe/logs.",
      ];
    case "local.binary.ssh":
      return [
        "Install the OpenSSH client on the local machine and ensure `ssh` is in PATH.",
        "Re-run Refresh Service Status after the shell can execute `ssh -V` successfully.",
      ];
    case "local.binary.sshpass":
      return [
        "If you want password-based SSH, install `sshpass` on the local machine.",
        "If you do not want to install `sshpass`, switch the asset to private-key authentication.",
      ];
    case "local.report_dir":
      return [
        paths?.reportDir
          ? `Ensure ${paths.reportDir} exists and is writable by the current desktop user.`
          : "Ensure the configured report directory exists and is writable by the current desktop user.",
        "Move reports to another writable directory if this machine restricts writes under the current location.",
      ];
    case "service.bootstrap":
      return [
        "Install the required PostgreSQL binaries (`postgres`, `pg_ctl`, `initdb`) for the local service runtime.",
        "Re-open the desktop from a shell where those binaries are already available in PATH.",
      ];
    case "postgres.data_dir":
      return [
        "Use Bootstrap PostgreSQL to initialize the dedicated OpsProbe data directory.",
        paths?.postgresDataDir
          ? `Verify ${paths.postgresDataDir} is writable and not managed by another PostgreSQL instance.`
          : "Verify the managed PostgreSQL data directory is writable and not managed by another PostgreSQL instance.",
      ];
    case "postgres.port":
      return [
        `Find what is already using port ${port} with \`ss -ltnp '( sport = :${port} )'\` or \`lsof -i :${port}\`.`,
        "Stop the conflicting service or move OpsProbe to another managed PostgreSQL port before retrying start.",
      ];
    case "postgres.process":
      return [
        "Use Start PostgreSQL after bootstrap completes.",
        paths?.postgresCtlLogFile
          ? `If startup still fails, inspect ${paths.postgresCtlLogFile} and the PostgreSQL log directory for the first fatal error.`
          : "If startup still fails, inspect the managed PostgreSQL control log for the first fatal error.",
      ];
    case "storage.backend":
      return [
        "OpsProbe can continue with local file storage, but history and migration should be rechecked after PostgreSQL is healthy.",
        "Resolve PostgreSQL runtime problems first if you want the intended managed database path.",
      ];
    case "scheduling.local":
      return [
        "Review the affected asset or schedule and rerun the inspection manually to reproduce the failure.",
        "Keep the local service running so recurring schedules can execute on time.",
      ];
    default:
      if (check.id.startsWith("postgres.binary.")) {
        return [
          "Install the missing PostgreSQL binary and confirm it is available in PATH for the desktop process.",
          "Restart the desktop or launch it from a shell that already exports the PostgreSQL bin directory.",
        ];
      }

      return ["Refresh the environment status after correcting the underlying local dependency or permission problem."];
  }
}

function buildSshTroubleshooting(result: SshConnectionTestResult | null, asset: Asset): string[] {
  if (!result || result.ok) {
    return [];
  }

  const message = result.message.toLowerCase();

  if (message.includes("permission denied")) {
    return [
      `Verify the username ${asset.credential.username} and confirm the remote host accepts the selected authentication method.`,
      asset.credential.method === "private-key"
        ? `Check that ${asset.credential.secretRef} matches an authorized key on ${asset.host} and has restrictive permissions such as \`chmod 600\`.`
        : "Retry with a known-good SSH password or switch to private-key mode if password auth is disabled on the host.",
    ];
  }

  if (message.includes("connection refused")) {
    return [
      `Confirm that sshd is listening on ${asset.host}:${asset.port}.`,
      "Check firewall rules, port mapping, and whether the target host uses a non-default SSH port.",
    ];
  }

  if (message.includes("timed out") || message.includes("operation timed out")) {
    return [
      `Verify routing and firewall access from this machine to ${asset.host}:${asset.port}.`,
      "Check VPN, security-group, or office-network restrictions before retrying.",
    ];
  }

  if (message.includes("no route to host") || message.includes("network is unreachable")) {
    return [
      "The target host is not reachable from the current network path.",
      "Confirm DNS/VPN/network segment access and retry from a machine that can reach the host.",
    ];
  }

  if (message.includes("could not resolve hostname") || message.includes("name or service not known")) {
    return [
      `Recheck the host value \`${asset.host}\` for typos or missing DNS records.`,
      "If DNS is not available in this environment, use a direct IP address instead of a hostname.",
    ];
  }

  if (message.includes("sshpass")) {
    return [
      "Install `sshpass` if you want password mode on this machine.",
      "Otherwise switch the asset to private-key authentication and retry the connection test.",
    ];
  }

  if (message.includes("private key")) {
    return [
      `Confirm the private key path ${asset.credential.secretRef} exists and is readable by the current user.`,
      "If the key was copied from another machine, verify permissions and file ownership before retrying.",
    ];
  }

  return [
    "Review the exact SSH error text above and compare it with a manual `ssh` attempt from the same machine.",
    "If the same failure appears outside OpsProbe, fix the local network, credential, or host-side SSH issue first.",
  ];
}

function createDemoRun(
  id: string,
  templateId: string,
  createdAt: string,
  results: CheckResult[],
): InspectionRun {
  return {
    id,
    taskId: `task-${id}`,
    assetId: initialAsset.id,
    templateId,
    status: "completed",
    results,
    summary: summarizeResults(results),
    createdAt,
    updatedAt: createdAt,
  };
}

const demoRuns: InspectionRun[] = [
  createDemoRun("demo-run-nginx-001", "template.linux.nginx", "2026-06-04T08:30:00.000Z", [
    {
      checkId: "linux.cpu.usage",
      title: "CPU Usage",
      status: "warning",
      severity: "warning",
      summary: "CPU usage is elevated during the morning traffic window.",
      evidence: [{ label: "Usage", value: "76.4%" }],
      remediation: "Review top CPU consumers and confirm whether traffic growth is expected.",
    },
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
      checkId: "linux.nginx.config",
      title: "Nginx Configuration Validation",
      status: "warning",
      severity: "warning",
      summary: "Configuration validation passed, but a deprecated directive is still present.",
      evidence: [{ label: "Command Output", value: "warning: the 'http2_max_field_size' directive is deprecated" }],
      remediation: "Update the nginx config to remove deprecated directives before the next upgrade window.",
    },
  ]),
  createDemoRun("demo-run-k8s-001", "template.linux.kubernetes", "2026-06-04T09:10:00.000Z", [
    {
      checkId: "linux.kubelet.process",
      title: "Kubelet Process Status",
      status: "pass",
      severity: "info",
      summary: "kubelet is running.",
      evidence: [{ label: "Process", value: "kubelet" }],
      remediation: "No action required.",
    },
    {
      checkId: "linux.kubernetes.node.runtime",
      title: "Kubernetes Node Runtime",
      status: "warning",
      severity: "warning",
      summary: "Node runtime info was collected, but the container runtime is still using an older cgroup driver.",
      evidence: [{ label: "Runtime", value: "Runtime=containerd CgroupDriver=cgroupfs" }],
      remediation: "Review node runtime alignment with the cluster standard before the next node rollout.",
    },
    {
      checkId: "linux.disk.usage",
      title: "Disk Usage",
      status: "critical",
      severity: "critical",
      summary: "Root filesystem usage is high enough to risk node instability.",
      evidence: [{ label: "Usage", value: "92.1%" }],
      remediation: "Free space on the node and review image, log, and container retention settings.",
    },
  ]),
];

class TauriRunnerAdapter {
  async testConnection(asset: Asset): Promise<SshConnectionTestResult> {
    return invoke<SshConnectionTestResult>("test_ssh_connection", {
      input: {
        host: asset.host,
        port: asset.port,
        username: asset.credential.username,
        authMethod: asset.credential.method,
        secretRef: asset.credential.secretRef,
      } satisfies SshConnectionTestInput,
    });
  }

  async executeCheck(asset: Asset, check: CheckDefinition): Promise<CheckResult> {
    try {
      return await invoke<CheckResult>("run_linux_check", {
        input: {
          host: asset.host,
          port: asset.port,
          username: asset.credential.username,
          authMethod: asset.credential.method,
          secretRef: asset.credential.secretRef,
          checkId: check.id,
          title: check.title,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Check execution failed.";
      return {
        checkId: check.id,
        title: check.title,
        status: "unknown",
        severity: "warning",
        summary: message,
        evidence: [{ label: "Execution", value: "Failed before result normalization" }],
        remediation: "Verify SSH connectivity, command availability, and host permissions.",
      };
    }
  }
}

function App() {
  const [asset, setAsset] = useState<Asset>(initialAsset);
  const [inspectionRun, setInspectionRun] = useState<InspectionRun | null>(null);
  const [serviceInspectionRun, setServiceInspectionRun] = useState<InspectionRun | null>(null);
  const [serviceExecutionRun, setServiceExecutionRun] = useState<InspectionRun | null>(null);
  const [serviceHistoryRuns, setServiceHistoryRuns] = useState<InspectionRun[]>([]);
  const [selectedHistoryRun, setSelectedHistoryRun] = useState<InspectionRun | null>(null);
  const [onboardingMode, setOnboardingMode] = useState<"demo" | "real">("demo");
  const [reportAudience, setReportAudience] = useState<ReportAudience>("operator");
  const [schedules, setSchedules] = useState<LocalInspectionSchedule[]>([]);
  const [savedAssets, setSavedAssets] = useState<Asset[]>([]);
  const [serviceResponse, setServiceResponse] = useState<LocalServiceStatusResponse | null>(null);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [sshResult, setSshResult] = useState<SshConnectionTestResult | null>(null);
  const [isTestingSsh, setIsTestingSsh] = useState(false);
  const [isRefreshingPreview, setIsRefreshingPreview] = useState(false);
  const [isRefreshingService, setIsRefreshingService] = useState(false);
  const [isRefreshingServicePreview, setIsRefreshingServicePreview] = useState(false);
  const [isRunningServiceInspection, setIsRunningServiceInspection] = useState(false);
  const [isRefreshingHistory, setIsRefreshingHistory] = useState(false);
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");
  const [historyAssetFilter, setHistoryAssetFilter] = useState(initialAsset.id);
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplate.id);
  const [scheduleIntervalMinutes, setScheduleIntervalMinutes] = useState("15");
  const [isRefreshingSchedules, setIsRefreshingSchedules] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [migrationPath, setMigrationPath] = useState(defaultMigrationPath);
  const [reportPath, setReportPath] = useState(defaultReportPath);
  const [pdfReportPath, setPdfReportPath] = useState(defaultPdfReportPath);
  const [isRefreshingAssets, setIsRefreshingAssets] = useState(false);
  const [isExportingConfig, setIsExportingConfig] = useState(false);
  const [isImportingConfig, setIsImportingConfig] = useState(false);
  const [isExportingReport, setIsExportingReport] = useState(false);
  const [isExportingPdfReport, setIsExportingPdfReport] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const activeTemplate = builtInTemplates.find((template) => template.id === selectedTemplateId) ?? defaultTemplate;
  const activeChecks = resolveTemplateChecks(activeTemplate.id);
  const hasRealData = savedAssets.length > 0 || serviceHistoryRuns.length > 0 || schedules.length > 0;
  const showingDemoExperience = !hasRealData && onboardingMode === "demo";
  const visibleHistoryRuns = showingDemoExperience ? demoRuns : serviceHistoryRuns;

  const task: InspectionTask = {
    id: "task-manual-001",
    assetId: asset.id,
    templateId: activeTemplate.id,
    trigger: "manual",
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };

  const sshInput: SshConnectionTestInput = {
    host: asset.host,
    port: asset.port,
    username: asset.credential.username,
    authMethod: asset.credential.method,
    secretRef: asset.credential.secretRef,
  };

  useEffect(() => {
    void loadInitialState();
  }, []);

  useEffect(() => {
    if (!serviceResponse) {
      return;
    }

    setReportPath((current) =>
      current === defaultReportPath
        ? `${serviceResponse.snapshot.config.paths.reportDir}/opsprobe-report-${Date.now()}.html`
        : current,
    );
    setPdfReportPath((current) =>
      current === defaultPdfReportPath
        ? `${serviceResponse.snapshot.config.paths.reportDir}/opsprobe-report-${Date.now()}.pdf`
        : current,
    );
  }, [serviceResponse]);

  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }

    const timer = window.setTimeout(() => {
      void invoke<LocalDesktopSettingsResponse>("upsert_local_service_settings", {
        input: {
          settings: {
            activeAsset: asset,
            selectedTemplateId,
            onboardingMode,
            reportAudience,
            historyAssetFilter,
            historyDateFrom,
            historyDateTo,
            scheduleIntervalMinutes,
            migrationPath,
            reportPath,
            pdfReportPath,
          },
        },
      }).catch(() => {
        // Keep desktop editing responsive even if persistence is temporarily unavailable.
      });
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    asset,
    historyAssetFilter,
    historyDateFrom,
    historyDateTo,
    scheduleIntervalMinutes,
    migrationPath,
    onboardingMode,
    pdfReportPath,
    reportAudience,
    reportPath,
    selectedTemplateId,
    settingsLoaded,
  ]);

  function patchAsset(patch: Partial<Asset>) {
    setAsset((current) => ({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  }

  function patchCredential(patch: Partial<Asset["credential"]>) {
    setAsset((current) => ({
      ...current,
      credential: {
        ...current.credential,
        ...patch,
        bindingStatus:
          patch.secretRef !== undefined || patch.method !== undefined || patch.username !== undefined
            ? "linked"
            : current.credential.bindingStatus,
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  async function loadInitialState() {
    try {
      const settingsResponse = await invoke<LocalDesktopSettingsResponse>("get_local_service_settings");
      const restoredSettings = settingsResponse.settings;

      if (restoredSettings.activeAsset) {
        setAsset(restoredSettings.activeAsset);
      }
      if (restoredSettings.selectedTemplateId !== undefined) {
        setSelectedTemplateId(restoredSettings.selectedTemplateId);
      }
      if (restoredSettings.onboardingMode === "demo" || restoredSettings.onboardingMode === "real") {
        setOnboardingMode(restoredSettings.onboardingMode);
      }
      if (restoredSettings.reportAudience === "operator" || restoredSettings.reportAudience === "manager") {
        setReportAudience(restoredSettings.reportAudience);
      }
      if (restoredSettings.historyAssetFilter !== undefined) {
        setHistoryAssetFilter(restoredSettings.historyAssetFilter);
      } else if (restoredSettings.activeAsset) {
        setHistoryAssetFilter(restoredSettings.activeAsset.id);
      }
      if (restoredSettings.historyDateFrom !== undefined) {
        setHistoryDateFrom(restoredSettings.historyDateFrom);
      }
      if (restoredSettings.historyDateTo !== undefined) {
        setHistoryDateTo(restoredSettings.historyDateTo);
      }
      if (restoredSettings.scheduleIntervalMinutes !== undefined) {
        setScheduleIntervalMinutes(restoredSettings.scheduleIntervalMinutes);
      }
      if (restoredSettings.migrationPath !== undefined) {
        setMigrationPath(restoredSettings.migrationPath);
      }
      if (restoredSettings.reportPath !== undefined) {
        setReportPath(restoredSettings.reportPath);
      }
      if (restoredSettings.pdfReportPath !== undefined) {
        setPdfReportPath(restoredSettings.pdfReportPath);
      }

      const activeAsset = restoredSettings.activeAsset ?? initialAsset;
      const assetFilter = restoredSettings.historyAssetFilter ?? activeAsset.id;
      const dateFrom = restoredSettings.historyDateFrom ?? "";
      const dateTo = restoredSettings.historyDateTo ?? "";

      await refreshLocalServiceHealth();
      await refreshSavedAssets();
      await refreshLocalSchedules();
      await refreshLocalServiceHistory({
        assetId: assetFilter,
        dateFrom,
        dateTo,
      });
    } catch {
      await refreshLocalServiceHealth();
      await refreshSavedAssets();
      await refreshLocalSchedules();
      await refreshLocalServiceHistory({
        assetId: initialAsset.id,
        dateFrom: "",
        dateTo: "",
      });
    } finally {
      setSettingsLoaded(true);
    }
  }

  useEffect(() => {
    setSelectedHistoryRun((current) => {
      if (visibleHistoryRuns.length === 0) {
        return null;
      }

      if (!current) {
        return visibleHistoryRuns[0];
      }

      return visibleHistoryRuns.find((run) => run.id === current.id) ?? visibleHistoryRuns[0];
    });
  }, [visibleHistoryRuns]);

  async function refreshLocalServiceHealth() {
    setIsRefreshingService(true);
    try {
      const response = await invoke<LocalServiceStatusResponse>("get_local_service_status");
      setServiceResponse(response);
    } catch (error) {
      setServiceResponse(null);
      setServiceMessage(formatActionError("Refreshing local service status", error));
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleStartLocalService() {
    setIsRefreshingService(true);
    setServiceMessage(null);
    try {
      const message = await invoke<string>("start_local_service");
      setServiceMessage(message);
      await refreshLocalServiceHealth();
    } catch (error) {
      setServiceMessage(formatActionError("Starting local service", error));
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleStopLocalService() {
    setIsRefreshingService(true);
    setServiceMessage(null);
    try {
      const response = await invoke<LocalServiceCommandResponse>("stop_local_service");
      setServiceMessage(response.message);
      await refreshLocalServiceHealth();
    } catch (error) {
      setServiceMessage(formatActionError("Stopping local service", error));
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleBootstrapLocalPostgres() {
    setIsRefreshingService(true);
    setServiceMessage(null);
    try {
      const response = await invoke<LocalServiceCommandResponse>("bootstrap_local_service_postgres");
      setServiceMessage(response.message);
      await refreshLocalServiceHealth();
    } catch (error) {
      setServiceMessage(formatActionError("Bootstrapping managed PostgreSQL", error));
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleStartLocalPostgres() {
    setIsRefreshingService(true);
    setServiceMessage(null);
    try {
      const response = await invoke<LocalServiceCommandResponse>("start_local_service_postgres");
      setServiceMessage(response.message);
      await refreshLocalServiceHealth();
    } catch (error) {
      setServiceMessage(formatActionError("Starting managed PostgreSQL", error));
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleStopLocalPostgres() {
    setIsRefreshingService(true);
    setServiceMessage(null);
    try {
      const response = await invoke<LocalServiceCommandResponse>("stop_local_service_postgres");
      setServiceMessage(response.message);
      await refreshLocalServiceHealth();
    } catch (error) {
      setServiceMessage(formatActionError("Stopping managed PostgreSQL", error));
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function refreshInspectionPreview() {
    setIsRefreshingPreview(true);
    const adapter = new TauriRunnerAdapter();

    try {
      const run = await runInspection(
        {
          asset,
          task,
          template: activeTemplate,
          checks: activeChecks,
        },
        adapter,
      );
      setInspectionRun(run);
    } finally {
      setIsRefreshingPreview(false);
    }
  }

  async function refreshLocalServiceInspectionPreview() {
    setIsRefreshingServicePreview(true);

    try {
      const response = await invoke<InspectionPreviewResponse>("get_local_service_inspection_preview", {
        input: {
          asset,
          templateId: activeTemplate.id,
        },
      });
      setServiceInspectionRun(response.run);
    } catch (error) {
      setServiceMessage(formatActionError("Refreshing local service inspection preview", error));
    } finally {
      setIsRefreshingServicePreview(false);
    }
  }

  async function runLocalServiceInspection() {
    setIsRunningServiceInspection(true);

    try {
      const response = await invoke<InspectionExecutionResponse>("run_local_service_inspection", {
        input: {
          asset,
          templateId: activeTemplate.id,
        },
      });
      setServiceExecutionRun(response.run);
      await refreshLocalServiceHistory();
    } catch (error) {
      setServiceMessage(formatActionError("Running local service inspection", error));
    } finally {
      setIsRunningServiceInspection(false);
    }
  }

  async function refreshLocalServiceHistory(filters?: {
    assetId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    setIsRefreshingHistory(true);

    try {
      const assetId = filters?.assetId ?? historyAssetFilter;
      const dateFrom = filters?.dateFrom ?? historyDateFrom;
      const dateTo = filters?.dateTo ?? historyDateTo;
      const response = await invoke<LocalServiceInspectionHistoryResponse>(
        "get_local_service_inspection_history",
        {
          input: {
            assetId: assetId.trim() || undefined,
            dateFrom: dateFrom ? `${dateFrom}T00:00:00.000Z` : undefined,
            dateTo: dateTo ? `${dateTo}T23:59:59.999Z` : undefined,
            limit: 20,
          },
        },
      );
      setServiceHistoryRuns(response.runs);
      setSelectedHistoryRun((current) => {
        if (response.runs.length === 0) {
          return null;
        }

        if (!current) {
          return response.runs[0];
        }

        return response.runs.find((run) => run.id === current.id) ?? response.runs[0];
      });
    } catch (error) {
      setServiceMessage(formatActionError("Refreshing local inspection history", error));
    } finally {
      setIsRefreshingHistory(false);
    }
  }

  async function refreshLocalSchedules() {
    setIsRefreshingSchedules(true);

    try {
      const response = await invoke<LocalInspectionScheduleListResponse>("get_local_service_schedules");
      setSchedules(response.schedules);
    } catch (error) {
      setServiceMessage(formatActionError("Refreshing local schedules", error));
    } finally {
      setIsRefreshingSchedules(false);
    }
  }

  async function refreshSavedAssets() {
    setIsRefreshingAssets(true);

    try {
      const response = await invoke<LocalAssetListResponse>("get_local_service_assets");
      setSavedAssets(response.assets);
    } catch (error) {
      setServiceMessage(formatActionError("Refreshing saved assets", error));
    } finally {
      setIsRefreshingAssets(false);
    }
  }

  async function handleSaveAsset() {
    setIsRefreshingAssets(true);
    setServiceMessage(null);

    try {
      const assetToSave: Asset = {
        ...asset,
        credential: {
          ...asset.credential,
          bindingStatus: asset.credential.secretRef.trim().length > 0 ? "linked" : asset.credential.bindingStatus,
        },
      };
      setAsset(assetToSave);
      const response = await invoke<LocalServiceCommandResponse>("upsert_local_service_asset", {
        input: {
          asset: assetToSave,
        },
      });
      setServiceMessage(response.message);
      await refreshSavedAssets();
    } finally {
      setIsRefreshingAssets(false);
    }
  }

  async function handleLoadAsset(savedAsset: Asset) {
    setAsset(savedAsset);
    setHistoryAssetFilter(savedAsset.id);
    setServiceMessage(`Loaded saved asset ${savedAsset.id}.`);
    await refreshInspectionPreview();
    await refreshLocalServiceInspectionPreview();
    await refreshLocalServiceHistory({ assetId: savedAsset.id });
  }

  async function handleExportConfig() {
    setIsExportingConfig(true);
    setServiceMessage(null);

    try {
      const response = await invoke<LocalServiceCommandResponse>("export_local_service_config", {
        input: {
          path: migrationPath,
        },
      });
      setServiceMessage(response.message);
    } finally {
      setIsExportingConfig(false);
    }
  }

  async function handleImportConfig() {
    setIsImportingConfig(true);
    setServiceMessage(null);

    try {
      const response = await invoke<LocalConfigImportResponse>("import_local_service_config", {
        input: {
          path: migrationPath,
        },
      });
      setServiceMessage(
        `Imported ${response.importedAssets} assets, ${response.importedTemplates} templates, ${response.importedSchedules} schedules.`,
      );
      await refreshSavedAssets();
      await refreshLocalSchedules();
      await refreshLocalServiceHealth();
      await refreshLocalServiceHistory();
    } finally {
      setIsImportingConfig(false);
    }
  }

  function resolveAssetForRun(run: InspectionRun): Asset | undefined {
    if (run.assetId === initialAsset.id) {
      return asset.id === run.assetId ? asset : initialAsset;
    }

    if (asset.id === run.assetId) {
      return asset;
    }

    return savedAssets.find((savedAsset) => savedAsset.id === run.assetId);
  }

  async function handleExportHtmlReport(run: InspectionRun) {
    setIsExportingReport(true);
    setServiceMessage(null);

    try {
      const response = await invoke<LocalServiceCommandResponse>("export_local_service_html_report", {
        input: {
          path: reportPath,
          run,
          asset: resolveAssetForRun(run),
          audience: reportAudience,
        },
      });
      setServiceMessage(response.message);
    } finally {
      setIsExportingReport(false);
    }
  }

  async function handleExportPdfReport(run: InspectionRun) {
    setIsExportingPdfReport(true);
    setServiceMessage(null);

    try {
      await exportRunPdfReport(run, resolveAssetForRun(run), pdfReportPath, reportAudience);
      setServiceMessage(`Exported ${reportAudience} PDF report to ${pdfReportPath}.`);
    } finally {
      setIsExportingPdfReport(false);
    }
  }

  async function handleSaveSchedule() {
    setIsSavingSchedule(true);
    setServiceMessage(null);

    try {
      const response = await invoke<LocalInspectionScheduleUpsertResponse>("upsert_local_service_schedule", {
        input: {
          asset,
          templateId: activeTemplate.id,
          intervalMinutes: Number(scheduleIntervalMinutes) || 15,
          enabled: true,
        },
      });
      setServiceMessage(`Saved schedule ${response.schedule.id}.`);
      await refreshLocalSchedules();
      await refreshLocalServiceHealth();
    } finally {
      setIsSavingSchedule(false);
    }
  }

  async function handleDeleteSchedule(id: string) {
    setIsRefreshingSchedules(true);
    setServiceMessage(null);

    try {
      const response = await invoke<LocalServiceCommandResponse>("delete_local_service_schedule", {
        input: { id },
      });
      setServiceMessage(response.message);
      await refreshLocalSchedules();
      await refreshLocalServiceHealth();
    } finally {
      setIsRefreshingSchedules(false);
    }
  }

  async function handleToggleSchedule(schedule: LocalInspectionSchedule) {
    setIsRefreshingSchedules(true);
    setServiceMessage(null);

    try {
      const response = await invoke<LocalInspectionScheduleUpsertResponse>("upsert_local_service_schedule", {
        input: {
          id: schedule.id,
          asset: schedule.asset,
          templateId: schedule.templateId,
          intervalMinutes: schedule.intervalMinutes,
          enabled: !schedule.enabled,
        },
      });
      setServiceMessage(
        `${response.schedule.id} ${response.schedule.enabled ? "enabled" : "disabled"} successfully.`,
      );
      await refreshLocalSchedules();
      await refreshLocalServiceHealth();
    } finally {
      setIsRefreshingSchedules(false);
    }
  }

  function handleEnterDemoMode() {
    setOnboardingMode("demo");
    setAsset(initialAsset);
    setSelectedTemplateId(demoRuns[0]?.templateId ?? defaultTemplate.id);
    setHistoryAssetFilter(initialAsset.id);
    setHistoryDateFrom("");
    setHistoryDateTo("");
    setSelectedHistoryRun(demoRuns[0] ?? null);
    setServiceMessage("Showing sample runs so you can inspect OpsProbe before connecting a real host.");
  }

  function handleSwitchToRealSetup() {
    setOnboardingMode("real");
    setSelectedHistoryRun(null);
    setServiceMessage("Demo mode hidden. Configure and save a real asset to start collecting live inspection history.");
  }

  const repeatedProblems = visibleHistoryRuns
    .flatMap((run) => run.results
      .filter((result) => result.status !== "pass")
      .map((result) => ({ result, templateId: run.templateId })))
    .reduce<Array<{ checkId: string; title: string; count: number; templateIds: string[] }>>((summary, result) => {
      const existing = summary.find((item) => item.checkId === result.result.checkId);
      if (existing) {
        existing.count += 1;
        if (!existing.templateIds.includes(result.templateId)) {
          existing.templateIds.push(result.templateId);
        }
      } else {
        summary.push({
          checkId: result.result.checkId,
          title: result.result.title,
          count: 1,
          templateIds: [result.templateId],
        });
      }
      return summary;
    }, [])
    .sort((left, right) => right.count - left.count);

  const serviceChecks = serviceResponse?.snapshot.health.checks ?? [];
  const blockingChecks = serviceChecks.filter((check) => check.status === "critical");
  const warningChecks = serviceChecks.filter((check) => check.status === "warning");
  const assetsNeedingRebind = savedAssets.filter((savedAsset) => savedAsset.credential.bindingStatus === "rebind-required");
  const troubleshootingCards: TroubleshootingCard[] = serviceChecks
    .filter(isActionableServiceCheck)
    .map((check) => ({
      key: check.id,
      label: check.label,
      status: check.status,
      detail: check.detail,
      actions: buildServiceCheckActions(check, serviceResponse),
    }));
  const sshTroubleshooting = buildSshTroubleshooting(sshResult, asset);
  const firstRunChecklist = [
    {
      id: "setup.service",
      label: "Start local service",
      done: serviceResponse?.snapshot.health.checks.some((check) => check.id === "service.process" && check.status === "pass") ?? false,
      action: () => void handleStartLocalService(),
      actionLabel: "Start Service",
      detail: "The background local service is required for schedules, history, and migration.",
    },
    {
      id: "setup.asset",
      label: "Save at least one asset",
      done: savedAssets.length > 0,
      action: () => void handleSaveAsset(),
      actionLabel: "Save Current Asset",
      detail: "Saved assets can be reused, migrated, and scheduled without re-entering host details.",
    },
    {
      id: "setup.rebind",
      label: "Rebind imported credentials",
      done: assetsNeedingRebind.length === 0,
      action: assetsNeedingRebind.length > 0 ? () => void handleLoadAsset(assetsNeedingRebind[0]) : undefined,
      actionLabel: "Load First Asset",
      detail:
        assetsNeedingRebind.length > 0
          ? `${assetsNeedingRebind.length} imported assets still need a local key path or password.`
          : "No imported assets are waiting for credential rebind.",
    },
    {
      id: "setup.reports",
      label: "Validate report directory",
      done: serviceChecks.some((check) => check.id === "local.report_dir" && check.status === "pass"),
      action: () => void refreshLocalServiceHealth(),
      actionLabel: "Recheck Environment",
      detail: serviceResponse?.snapshot.config.paths.reportDir
        ? `Reports will be written under ${serviceResponse.snapshot.config.paths.reportDir}.`
        : "OpsProbe needs a writable local report directory.",
    },
  ];
  const completedSetupSteps = firstRunChecklist.filter((item) => item.done).length;

  async function handleSshTest() {
    setIsTestingSsh(true);
    setSshResult(null);

    try {
      const result = await invoke<SshConnectionTestResult>("test_ssh_connection", {
        input: sshInput,
      });
      setSshResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "SSH test failed.";
      setSshResult({
        ok: false,
        message,
      });
    } finally {
      setIsTestingSsh(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">OpsProbe Open Source Edition</p>
        <h1>Local-first infrastructure inspection for SMB teams.</h1>
        <p className="summary">
          `0.7.4` closes the external-validation cycle by summarizing what friction was fixed,
          what is still deferred, and why the next step is a `0.8.x` exploration line instead of
          `1.0.0`.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Current Focus</h2>
          <ul>
            <li>Feedback-driven stabilization checkpoint</li>
            <li>Explicit fixed-versus-deferred decisions</li>
            <li>Evidence for the next product stage</li>
          </ul>
        </article>

        <article className="card">
          <h2>Next Milestone</h2>
          <p className="version">v0.7.4</p>
          <ul>
            <li>Validation-cycle closure</li>
            <li>Stabilization checkpoint</li>
            <li>Next-stage decision with evidence</li>
          </ul>
        </article>

        <article className="card support-card">
          <h2>Support OpsProbe</h2>
          <p>
            If this project saves you time, you can buy me a coffee and help fund
            the next inspection features.
          </p>
          <a
            className="support-link"
            href="https://github.com/sponsors/ken-water"
            target="_blank"
            rel="noreferrer"
          >
            Buy Me a Coffee
          </a>
        </article>
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.7.4 Current Release</p>
            <h2>Validation Summary</h2>
          </div>
        </div>

        <div className="service-checks">
          <article className="service-card">
            <div className="service-card-header">
              <strong>Addressed In 0.7.x</strong>
              <span className="badge badge-pass">stabilized</span>
            </div>
            <ul className="troubleshooting-list">
              <li>Demo mode reduced first-run comprehension friction.</li>
              <li>Runtime diagnostics explain SSH, dependency, and PostgreSQL setup failures.</li>
              <li>Operator and manager report variants cover different readers.</li>
              <li>Structured issue templates and feedback prompts now route outside-user input.</li>
            </ul>
          </article>

          <article className="service-card">
            <div className="service-card-header">
              <strong>Explicitly Deferred</strong>
              <span className="badge badge-warning">not next</span>
            </div>
            <ul className="troubleshooting-list">
              <li>Web report publishing and customer login.</li>
              <li>Notification delivery and multi-user collaboration.</li>
              <li>Trend reporting across many runs.</li>
              <li>In-product feedback submission backend.</li>
            </ul>
          </article>

          <article className="service-card">
            <div className="service-card-header">
              <strong>Next Stage Decision</strong>
              <span className="badge badge-pass">0.8.x</span>
            </div>
            <p>
              OpsProbe should continue into a `0.8.x` exploration line focused on deeper
              inspection quality and local workflow reliability, not `1.0.0` yet.
            </p>
            <p className="helper-text">
              Rationale: the product is more understandable now, but it still needs stronger
              real-world inspection depth and broader outside validation before a stable milestone.
            </p>
          </article>
        </div>

        <p className="helper-text">
          Decision document: <a href="https://github.com/ken-water/opsprobe/blob/main/docs/validation-cycle-0.7.md" target="_blank" rel="noreferrer">docs/validation-cycle-0.7.md</a>
        </p>
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.7.4 Current Release</p>
            <h2>Feedback Paths</h2>
          </div>
        </div>

        <div className="service-checks">
          <article className="service-card">
            <div className="service-card-header">
              <strong>Inspection Need</strong>
              <span className="badge badge-warning">missing check</span>
            </div>
            <p>Use this when a template, evidence field, or service check is missing from your real inspection workflow.</p>
            <a
              className="support-link"
              href="https://github.com/ken-water/opsprobe/issues/new?template=inspection-need.yml"
              target="_blank"
              rel="noreferrer"
            >
              Open Inspection Need
            </a>
          </article>
          <article className="service-card">
            <div className="service-card-header">
              <strong>Report Feedback</strong>
              <span className="badge badge-warning">report fit</span>
            </div>
            <p>Use this when the report exists, but the detail level, structure, wording, or audience fit is wrong.</p>
            <a
              className="support-link"
              href="https://github.com/ken-water/opsprobe/issues/new?template=report-feedback.yml"
              target="_blank"
              rel="noreferrer"
            >
              Open Report Feedback
            </a>
          </article>
          <article className="service-card">
            <div className="service-card-header">
              <strong>Workflow Friction</strong>
              <span className="badge badge-warning">real usage pain</span>
            </div>
            <p>Use this when OpsProbe does not fit the real sequence of work you need to complete, even if no single feature is missing.</p>
            <a
              className="support-link"
              href="https://github.com/ken-water/opsprobe/issues/new?template=workflow-friction.yml"
              target="_blank"
              rel="noreferrer"
            >
              Open Workflow Friction
            </a>
          </article>
        </div>

        <p className="helper-text">
          Good feedback includes the environment you were inspecting, what you were trying to finish,
          what manual workaround you used, and what output or workflow you expected instead.
        </p>

        <p className="helper-text">
          Guide: <a href="https://github.com/ken-water/opsprobe/blob/main/docs/feedback.md" target="_blank" rel="noreferrer">docs/feedback.md</a>
        </p>
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.7.4 Current Release</p>
            <h2>Report Variants</h2>
          </div>
        </div>

        <div className="ssh-grid">
          <label>
            <span>Audience</span>
            <select
              value={reportAudience}
              onChange={(event) => setReportAudience(event.target.value as ReportAudience)}
            >
              <option value="operator">Operator Detailed Report</option>
              <option value="manager">Manager Summary Report</option>
            </select>
          </label>
        </div>

        <div className="service-checks">
          <article className="service-card">
            <div className="service-card-header">
              <strong>Operator Detailed Report</strong>
              <span className={`badge badge-${reportAudience === "operator" ? "pass" : "unknown"}`}>
                {reportAudience === "operator" ? "selected" : "available"}
              </span>
            </div>
            <p>Includes detailed evidence, grouped results by severity, and per-check remediation text for operators doing the actual repair work.</p>
          </article>
          <article className="service-card">
            <div className="service-card-header">
              <strong>Manager Summary Report</strong>
              <span className={`badge badge-${reportAudience === "manager" ? "pass" : "unknown"}`}>
                {reportAudience === "manager" ? "selected" : "available"}
              </span>
            </div>
            <p>Condenses the run into risk summary, host overview, and priority actions for stakeholders who need decision-ready context.</p>
          </article>
        </div>

        <p className="helper-text">
          The selected audience affects both HTML and PDF export paths, so you can compare which report structure is more useful to early users.
        </p>
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.7.4 Current Release</p>
            <h2>First-Run Demo Experience</h2>
          </div>
          <div className="service-actions">
            <button
              className="secondary-button"
              onClick={handleEnterDemoMode}
              type="button"
            >
              Explore Demo Data
            </button>
            <button
              className="primary-button"
              onClick={handleSwitchToRealSetup}
              type="button"
            >
              Switch to Real Setup
            </button>
          </div>
        </div>

        <div className={`onboarding-banner ${showingDemoExperience ? "onboarding-demo" : "onboarding-real"}`}>
          <strong>{showingDemoExperience ? "Sample runs are visible" : "Real setup mode is active"}</strong>
          <span>
            {showingDemoExperience
              ? "These results are bundled examples and are not written into your local service history."
              : "Demo data is hidden. Save an asset and run inspections to build your own history."}
          </span>
        </div>

        <p className="helper-text">
          Use demo mode to review report quality, remediation wording, and result layout. Switch to
          real setup when you are ready to connect your own hosts.
        </p>
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.7.4 Current Release</p>
            <h2>Minimum Local Setup</h2>
          </div>
          <div className="summary-strip">
            <span>{completedSetupSteps}/{firstRunChecklist.length} steps complete</span>
            <span>{blockingChecks.length} blocking checks</span>
            <span>{warningChecks.length} warnings</span>
          </div>
        </div>

        <div className="setup-grid">
          {firstRunChecklist.map((item) => (
            <article className="setup-card" key={item.id}>
              <div className="service-card-header">
                <strong>{item.label}</strong>
                <span className={`badge badge-${item.done ? "pass" : "warning"}`}>
                  {item.done ? "done" : "todo"}
                </span>
              </div>
              <p>{item.detail}</p>
              {!item.done && item.action ? (
                <button className="secondary-button" onClick={item.action} type="button">
                  {item.actionLabel}
                </button>
              ) : null}
            </article>
          ))}
        </div>

        {blockingChecks.length > 0 ? (
          <div className="service-checks">
            {blockingChecks.map((check) => (
              <article className="service-card" key={`blocking-${check.id}`}>
                <div className="service-card-header">
                  <strong>{check.label}</strong>
                  <span className="badge badge-critical">blocking</span>
                </div>
                <p>{check.detail}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="helper-text">No blocking environment problems are currently detected.</p>
        )}

        {warningChecks.length > 0 ? (
          <div className="service-checks">
            {warningChecks.map((check) => (
              <article className="service-card" key={`warning-${check.id}`}>
                <div className="service-card-header">
                  <strong>{check.label}</strong>
                  <span className="badge badge-warning">warning</span>
                </div>
                <p>{check.detail}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.7.4 Current Release</p>
            <h2>Troubleshooting Guidance</h2>
          </div>
          <div className="summary-strip">
            <span>{troubleshootingCards.length} environment issues</span>
            <span>{sshTroubleshooting.length > 0 ? "SSH guidance ready" : "SSH guidance idle"}</span>
          </div>
        </div>

        {troubleshootingCards.length > 0 ? (
          <div className="service-checks">
            {troubleshootingCards.map((card) => (
              <article className="service-card" key={`troubleshoot-${card.key}`}>
                <div className="service-card-header">
                  <strong>{card.label}</strong>
                  <span className={`badge badge-${card.status}`}>{card.status}</span>
                </div>
                <p>{card.detail}</p>
                <ul className="troubleshooting-list">
                  {card.actions.map((action) => (
                    <li key={`${card.key}-${action}`}>{action}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <p className="helper-text">No environment problems currently need repair guidance.</p>
        )}

        {sshTroubleshooting.length > 0 ? (
          <article className="service-card ssh-guidance-card">
            <div className="service-card-header">
              <strong>SSH Connection Repair Steps</strong>
              <span className="badge badge-warning">ssh</span>
            </div>
            <p>{sshResult?.message}</p>
            <ul className="troubleshooting-list">
              {sshTroubleshooting.map((action) => (
                <li key={`ssh-guidance-${action}`}>{action}</li>
              ))}
            </ul>
          </article>
        ) : null}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.7.4 Current Release</p>
            <h2>Machine Migration</h2>
          </div>
          <div className="service-actions">
            <button
              className="secondary-button"
              onClick={() => void refreshSavedAssets()}
              type="button"
            >
              {isRefreshingAssets ? "Refreshing..." : "Refresh Saved Assets"}
            </button>
            <button
              className="secondary-button"
              onClick={() => void handleSaveAsset()}
              type="button"
            >
              Save Current Asset
            </button>
          </div>
        </div>

        <div className="ssh-grid">
          <label>
            <span>Migration File</span>
            <input
              value={migrationPath}
              onChange={(event) => setMigrationPath(event.target.value)}
              placeholder="/tmp/opsprobe-config.json"
            />
          </label>
        </div>

        <div className="service-actions">
          <button
            className="primary-button"
            onClick={() => void handleExportConfig()}
            type="button"
          >
            {isExportingConfig ? "Exporting..." : "Export Local Config"}
          </button>
          <button
            className="secondary-button"
            onClick={() => void handleImportConfig()}
            type="button"
          >
            {isImportingConfig ? "Importing..." : "Import Local Config"}
          </button>
        </div>

        <p className="helper-text">
          Exported packages exclude secret values. Imported assets are marked for credential rebind
          before use on the new machine.
        </p>

        {savedAssets.length > 0 ? (
          <div className="service-checks">
            {savedAssets.map((savedAsset) => (
              <article className="service-card" key={`asset-${savedAsset.id}`}>
                <div className="service-card-header">
                  <strong>{savedAsset.name}</strong>
                  <span className={`badge badge-${savedAsset.id === asset.id ? "pass" : "unknown"}`}>
                    {savedAsset.id === asset.id ? "active" : "saved"}
                  </span>
                </div>
                <p>
                  {savedAsset.id} · {savedAsset.host}:{savedAsset.port}
                </p>
                <p>
                  Credential: {savedAsset.credential.method} / {savedAsset.credential.username}
                  {savedAsset.credential.bindingStatus ? ` / ${savedAsset.credential.bindingStatus}` : ""}
                </p>
                <div className="service-actions">
                  <button
                    className="secondary-button"
                    onClick={() => void handleLoadAsset(savedAsset)}
                    type="button"
                  >
                    Load Asset
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="helper-text">No saved assets yet. Save the current asset before exporting.</p>
        )}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.7.4 Current Release</p>
            <h2>Local Scheduling</h2>
          </div>
          <div className="service-actions">
            <button
              className="secondary-button"
              onClick={() => void refreshLocalSchedules()}
              type="button"
            >
              {isRefreshingSchedules ? "Refreshing..." : "Refresh Schedules"}
            </button>
            <button
              className="primary-button"
              onClick={() => void handleSaveSchedule()}
              type="button"
            >
              {isSavingSchedule ? "Saving..." : "Create Schedule"}
            </button>
          </div>
        </div>

        <div className="ssh-grid">
          <label>
            <span>Scheduled Asset</span>
            <input value={asset.id} readOnly />
          </label>

          <label>
            <span>Template</span>
            <input value={activeTemplate.name} readOnly />
          </label>

          <label>
            <span>Interval Minutes</span>
            <input
              type="number"
              min="5"
              step="5"
              value={scheduleIntervalMinutes}
              onChange={(event) => setScheduleIntervalMinutes(event.target.value)}
            />
          </label>
        </div>

        <p className="helper-text">
          Schedules are stored locally by the service and executed by the background process. Keep
          the local service running for recurring inspections.
        </p>

        {schedules.length > 0 ? (
          <div className="service-checks">
            {schedules.map((schedule) => (
              <article className="service-card" key={schedule.id}>
                <div className="service-card-header">
                  <strong>{schedule.asset.name}</strong>
                  <span className={`badge badge-${schedule.enabled ? "pass" : "unknown"}`}>
                    {schedule.enabled ? "enabled" : "disabled"}
                  </span>
                </div>
                <p>{schedule.id}</p>
                <p>
                  Every {schedule.intervalMinutes} minutes · next run {schedule.nextRunAt}
                </p>
                <p>Template: {templateLabel(schedule.templateId)}</p>
                <p>
                  Last status: {schedule.lastRunStatus ?? "pending"}
                  {schedule.lastRunAt ? ` at ${schedule.lastRunAt}` : ""}
                </p>
                {schedule.lastError ? <p className="result-error">Failure: {schedule.lastError}</p> : null}
                <div className="service-actions">
                  <button
                    className="secondary-button"
                    onClick={() => void handleToggleSchedule(schedule)}
                    type="button"
                  >
                    {schedule.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => void handleDeleteSchedule(schedule.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="helper-text">No local schedules configured yet.</p>
        )}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.7.4 Current Release</p>
            <h2>Local Service Status</h2>
          </div>
          <div className="service-actions">
            <button
              className="secondary-button"
              onClick={() => void refreshLocalServiceHealth()}
              type="button"
            >
              {isRefreshingService ? "Refreshing..." : "Refresh Service Status"}
            </button>
            <button
              className="primary-button"
              onClick={() => void handleStartLocalService()}
              type="button"
            >
              Start Service
            </button>
            <button
              className="secondary-button"
              onClick={() => void handleStopLocalService()}
              type="button"
            >
              Stop Service
            </button>
            <button
              className="secondary-button"
              onClick={() => void handleBootstrapLocalPostgres()}
              type="button"
            >
              Bootstrap PostgreSQL
            </button>
            <button
              className="secondary-button"
              onClick={() => void handleStartLocalPostgres()}
              type="button"
            >
              Start PostgreSQL
            </button>
            <button
              className="secondary-button"
              onClick={() => void handleStopLocalPostgres()}
              type="button"
            >
              Stop PostgreSQL
            </button>
          </div>
        </div>

        {serviceResponse ? (
          <>
            <div className="service-banner">
              <span className={`service-pill service-${serviceResponse.snapshot.status}`}>
                {serviceResponse.snapshot.status}
              </span>
              {serviceResponse.snapshot.health.runtime ? (
                <>
                  <span>port {serviceResponse.snapshot.health.runtime.port}</span>
                  <span>{serviceResponse.snapshot.config.paths.postgresDataDir}</span>
                  <span>{serviceResponse.snapshot.config.paths.postgresLogDir}</span>
                </>
              ) : (
                <span>No runtime metadata available</span>
              )}
            </div>

            <div className="service-checks">
              {serviceResponse.snapshot.health.checks.map((check) => (
                <article className="service-card" key={check.id}>
                  <div className="service-card-header">
                    <strong>{check.label}</strong>
                    <span className={`badge badge-${check.status}`}>{check.status}</span>
                  </div>
                  <p>{check.detail}</p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="helper-text">Local service bootstrap has not been queried yet.</p>
        )}

        {serviceMessage ? <p className="helper-text">{serviceMessage}</p> : null}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.7.4 Current Release</p>
            <h2>Local Service Inspection Run</h2>
          </div>
          <div className="service-actions">
            <button
              className="primary-button"
              onClick={() => void runLocalServiceInspection()}
              type="button"
            >
              {isRunningServiceInspection ? "Running..." : "Run Through Local Service"}
            </button>
            {serviceExecutionRun ? (
              <>
                  <button
                    className="secondary-button"
                    onClick={() => void handleExportHtmlReport(serviceExecutionRun)}
                    type="button"
                  >
                    {isExportingReport ? "Exporting..." : `Export ${reportAudience} HTML`}
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => void handleExportPdfReport(serviceExecutionRun)}
                    type="button"
                  >
                    {isExportingPdfReport ? "Exporting..." : `Export ${reportAudience} PDF`}
                  </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="ssh-grid">
          <label>
            <span>Report File</span>
            <input
              value={reportPath}
              onChange={(event) => setReportPath(event.target.value)}
              placeholder="/tmp/opsprobe-report.html"
            />
          </label>
          <label>
            <span>PDF Report File</span>
            <input
              value={pdfReportPath}
              onChange={(event) => setPdfReportPath(event.target.value)}
              placeholder="/tmp/opsprobe-report.pdf"
            />
          </label>
        </div>

        {serviceExecutionRun ? (
          <>
            <div className="summary-strip">
              <span>Total {serviceExecutionRun.summary.total}</span>
              <span>Pass {serviceExecutionRun.summary.passed}</span>
              <span>Warn {serviceExecutionRun.summary.warning}</span>
              <span>Critical {serviceExecutionRun.summary.critical}</span>
            </div>

            <div className="asset-banner">
              <strong>{asset.name}</strong>
              <span>
                {asset.host}:{asset.port}
              </span>
              <span>service-owned execution</span>
              <span>{activeTemplate.name}</span>
            </div>

            <div className="results-list">
              {serviceExecutionRun.results.map((result) => (
                <article className="result-card" key={`service-run-${result.checkId}`}>
                  <div className="result-header">
                    <div>
                      <h3>{result.title}</h3>
                      <p>{result.summary}</p>
                    </div>
                    <span className={`badge badge-${result.status}`}>{result.status}</span>
                  </div>

                  <ul className="evidence-list">
                    {result.evidence.map((item) => (
                      <li key={`service-run-${result.checkId}-${item.label}`}>
                        <strong>{item.label}:</strong> {item.value}
                      </li>
                    ))}
                  </ul>

                  <p className="remediation">
                    <strong>Remediation:</strong> {result.remediation}
                  </p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="helper-text">Local service has not executed an inspection run yet.</p>
        )}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">0.7.4 Current Release</p>
            <h2>Local Service Inspection Preview</h2>
          </div>
          <button
            className="secondary-button"
            onClick={() => void refreshLocalServiceInspectionPreview()}
            type="button"
          >
            {isRefreshingServicePreview ? "Refreshing..." : "Refresh Service Preview"}
          </button>
        </div>

        {serviceInspectionRun ? (
          <>
            <div className="asset-banner">
              <strong>{asset.name}</strong>
              <span>service-owned preview</span>
              <span>{serviceInspectionRun.summary.total} checks</span>
              <span>{activeTemplate.name}</span>
            </div>

            <div className="results-list">
              {serviceInspectionRun.results.map((result) => (
                <article className="result-card" key={`service-${result.checkId}`}>
                  <div className="result-header">
                    <div>
                      <h3>{result.title}</h3>
                      <p>{result.summary}</p>
                    </div>
                    <span className={`badge badge-${result.status}`}>{result.status}</span>
                  </div>

                  <ul className="evidence-list">
                    {result.evidence.map((item) => (
                      <li key={`service-${result.checkId}-${item.label}`}>
                        <strong>{item.label}:</strong> {item.value}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="helper-text">Local service has not generated an inspection preview yet.</p>
        )}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Service Persistence Preview</p>
            <h2>Recent Local Service Runs</h2>
          </div>
          <button
            className="secondary-button"
            onClick={() => void refreshLocalServiceHistory()}
            type="button"
          >
            {isRefreshingHistory ? "Refreshing..." : "Refresh History"}
          </button>
        </div>

        {showingDemoExperience ? (
          <div className="asset-banner">
            <strong>Demo History</strong>
            <span>sample data only</span>
            <span>{demoRuns.length} bundled runs</span>
            <span>safe to explore and export</span>
          </div>
        ) : null}

        <div className="ssh-grid">
          <label>
            <span>Asset Filter</span>
            <input
              value={historyAssetFilter}
              onChange={(event) => setHistoryAssetFilter(event.target.value)}
              placeholder="asset-linux-001"
            />
          </label>

          <label>
            <span>Date From</span>
            <input
              type="date"
              value={historyDateFrom}
              onChange={(event) => setHistoryDateFrom(event.target.value)}
            />
          </label>

          <label>
            <span>Date To</span>
            <input
              type="date"
              value={historyDateTo}
              onChange={(event) => setHistoryDateTo(event.target.value)}
            />
          </label>
        </div>

        {visibleHistoryRuns.length > 0 ? (
          <>
            <div className="results-list">
              {visibleHistoryRuns.map((run) => (
                <article
                  className="result-card"
                  key={`history-${run.id}`}
                  onClick={() => setSelectedHistoryRun(run)}
                >
                  <div className="result-header">
                    <div>
                      <h3>{run.id}</h3>
                      <p>
                        {run.assetId} · {run.summary.total} checks · {run.summary.warning} warn ·{" "}
                        {run.summary.critical} critical
                      </p>
                      <p className="helper-text">Template: {templateLabel(run.templateId)}</p>
                      {showingDemoExperience ? <p className="helper-text">Sample run bundled with OpsProbe.</p> : null}
                    </div>
                    <span className={`badge badge-${run.status === "completed" ? "pass" : "critical"}`}>
                      {run.status}
                    </span>
                  </div>
                  <p className="helper-text">{run.createdAt}</p>
                </article>
              ))}
            </div>

            {repeatedProblems.length > 0 ? (
              <div className="service-checks">
                {repeatedProblems.slice(0, 5).map((problem) => (
                  <article className="service-card" key={`repeat-${problem.checkId}`}>
                    <div className="service-card-header">
                      <strong>{problem.title}</strong>
                      <span className="badge badge-warning">{problem.count}x</span>
                    </div>
                    <p>{problem.checkId}</p>
                    <p className="helper-text">
                      Templates: {problem.templateIds.map((templateId) => templateLabel(templateId)).join(", ")}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="helper-text">No repeated problem checks were found in the filtered history.</p>
            )}

            {selectedHistoryRun ? (
              <div className="results-list">
                <article className="result-card" key={`selected-${selectedHistoryRun.id}`}>
                  <div className="result-header">
                    <div>
                      <h3>Selected Run</h3>
                      <p>
                        {selectedHistoryRun.id} · {selectedHistoryRun.assetId} · {selectedHistoryRun.createdAt}
                      </p>
                      <p className="helper-text">Template: {templateLabel(selectedHistoryRun.templateId)}</p>
                      {showingDemoExperience ? (
                        <p className="helper-text">This is sample inspection data and is not part of your persisted history.</p>
                      ) : null}
                    </div>
                    <span
                      className={`badge badge-${
                        selectedHistoryRun.status === "completed" ? "pass" : "critical"
                      }`}
                    >
                      {selectedHistoryRun.status}
                    </span>
                  </div>

                  <div className="service-actions">
                    <button
                      className="secondary-button"
                      onClick={() => void handleExportHtmlReport(selectedHistoryRun)}
                      type="button"
                    >
                      {isExportingReport ? "Exporting..." : `Export ${reportAudience} HTML`}
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => void handleExportPdfReport(selectedHistoryRun)}
                      type="button"
                    >
                      {isExportingPdfReport ? "Exporting..." : `Export ${reportAudience} PDF`}
                    </button>
                  </div>

                  {selectedHistoryRun.results.length > 0 ? (
                    <div className="results-list">
                      {selectedHistoryRun.results.map((result) => (
                        <article className="result-card" key={`selected-${selectedHistoryRun.id}-${result.checkId}`}>
                          <div className="result-header">
                            <div>
                              <h3>{result.title}</h3>
                              <p>{result.summary}</p>
                              <p className="helper-text">{templateLabel(selectedHistoryRun.templateId)}</p>
                            </div>
                            <span className={`badge badge-${result.status}`}>{result.status}</span>
                          </div>
                          <ul className="evidence-list">
                            {result.evidence.map((item) => (
                              <li key={`selected-${selectedHistoryRun.id}-${result.checkId}-${item.label}`}>
                                <strong>{item.label}:</strong> {item.value}
                              </li>
                            ))}
                          </ul>
                          <p className="remediation">
                            <strong>Remediation:</strong> {result.remediation}
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="helper-text">This historical run has no normalized check results to reopen.</p>
                  )}
                </article>
              </div>
            ) : null}
          </>
        ) : (
          <p className="helper-text">
            {onboardingMode === "real"
              ? "No persisted runs have been recorded by local service yet."
              : "No persisted runs yet. Explore the bundled demo data or switch to real setup."}
          </p>
        )}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Legacy Comparison</p>
            <h2>Linux Host Asset</h2>
          </div>
        </div>

        <div className="ssh-grid">
          <label>
            <span>Asset Name</span>
            <input
              value={asset.name}
              onChange={(event) => patchAsset({ name: event.target.value })}
              placeholder="opsprobe-demo-host"
            />
          </label>

          <label>
            <span>Host</span>
            <input
              value={asset.host}
              onChange={(event) => patchAsset({ host: event.target.value })}
              placeholder="10.0.0.12"
            />
          </label>

          <label>
            <span>Port</span>
            <input
              type="number"
              value={asset.port}
              onChange={(event) => patchAsset({ port: Number(event.target.value) || 22 })}
              placeholder="22"
            />
          </label>

          <label>
            <span>Username</span>
            <input
              value={asset.credential.username}
              onChange={(event) => patchCredential({ username: event.target.value })}
              placeholder="root"
            />
          </label>

          <label>
            <span>Auth Method</span>
            <select
              value={asset.credential.method}
              onChange={(event) =>
                patchCredential({
                  method: event.target.value as SshConnectionTestInput["authMethod"],
                })
              }
            >
              <option value="private-key">private-key</option>
              <option value="password">password</option>
            </select>
          </label>

          <label>
            <span>Tags</span>
            <input
              value={asset.tags.join(", ")}
              onChange={(event) =>
                patchAsset({
                  tags: event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                })
              }
              placeholder="demo, linux"
            />
          </label>

          <label>
            <span>Inspection Template</span>
            <select
              value={selectedTemplateId}
              onChange={(event) => setSelectedTemplateId(event.target.value)}
            >
              {builtInTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="helper-text">
          {activeTemplate.description} This template currently includes {activeChecks.length} checks.
        </p>

        <label className="field-block">
          <span>
            {asset.credential.method === "private-key" ? "Private Key Path" : "Password Secret"}
          </span>
          <input
            type={asset.credential.method === "password" ? "password" : "text"}
            value={asset.credential.secretRef}
            onChange={(event) => patchCredential({ secretRef: event.target.value })}
            placeholder={
              asset.credential.method === "private-key"
                ? "/home/user/.ssh/id_rsa"
                : "Enter the SSH password used for this host."
            }
          />
        </label>

        <div className="ssh-actions">
          <button className="primary-button" onClick={() => void handleSshTest()} type="button">
            {isTestingSsh ? "Testing..." : "Test SSH Connection"}
          </button>
          <button
            className="secondary-button"
            onClick={() => void refreshInspectionPreview()}
            type="button"
          >
            {isRefreshingPreview ? "Refreshing..." : "Refresh Inspection Preview"}
          </button>
          <p className="helper-text">
            Asset fields are shared by the SSH test and the inspection runner preview. Password mode
            requires `sshpass` on the local machine.
          </p>
        </div>

        {sshResult ? (
          <p className={`connection-result ${sshResult.ok ? "result-ok" : "result-error"}`}>
            {sshResult.message}
          </p>
        ) : null}
      </section>

      <section className="run-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Legacy Comparison</p>
            <h2>Desktop Runner Preview</h2>
          </div>
          {inspectionRun ? (
            <div className="summary-strip">
              <span>Total {inspectionRun.summary.total}</span>
              <span>Pass {inspectionRun.summary.passed}</span>
              <span>Warn {inspectionRun.summary.warning}</span>
              <span>Critical {inspectionRun.summary.critical}</span>
            </div>
          ) : null}
        </div>

        <div className="asset-banner">
          <strong>{asset.name}</strong>
          <span>
            {asset.host}:{asset.port}
          </span>
          <span>{activeTemplate.name}</span>
          <span>{asset.tags.join(", ") || "no tags"}</span>
        </div>

        <div className="results-list">
          {inspectionRun?.results.map((result) => (
            <article className="result-card" key={result.checkId}>
              <div className="result-header">
                <div>
                  <h3>{result.title}</h3>
                  <p>{result.summary}</p>
                </div>
                <span className={`badge badge-${result.status}`}>{result.status}</span>
              </div>

              <ul className="evidence-list">
                {result.evidence.map((item) => (
                  <li key={`${result.checkId}-${item.label}`}>
                    <strong>{item.label}:</strong> {item.value}
                  </li>
                ))}
              </ul>

              <p className="remediation">
                <strong>Remediation:</strong> {result.remediation}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
