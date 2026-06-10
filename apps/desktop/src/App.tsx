import { startTransition, useEffect, useState } from "react";
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
import { ReportsWorkspace } from "./components/ReportsWorkspace";
import { SetupWorkspace } from "./components/SetupWorkspace";
import { RunnerWorkspace } from "./components/RunnerWorkspace";
import { AssetsWorkspace } from "./components/AssetsWorkspace";
import { ServiceWorkspace } from "./components/ServiceWorkspace";
import { HistoryWorkspace } from "./components/HistoryWorkspace";
import { InspectionHubWorkspace } from "./components/InspectionHubWorkspace";
import { invokeDesktop } from "./tauri-client";

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
type FeedbackTone = "info" | "success" | "error";
type TopbarTone = "info" | "ok" | "warning" | "loading";

interface RepairPack {
  id: string;
  title: string;
  status: "pass" | "warning" | "critical";
  summary: string;
  whyItMatters: string;
  nextAction: string;
  actionLabel: string;
  checks: ServiceHealthCheck[];
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

function isInFlightMessage(message: string | null) {
  if (!message) {
    return false;
  }

  return /^(Opening|Loading|Refreshing|Running|Starting|Stopping|Restarting|Bootstrapping|Saving|Exporting|Importing|Testing|Creating|Deleting|Enabling|Disabling|Revealing)/.test(message);
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

function summarizePackStatus(checks: ServiceHealthCheck[]): RepairPack["status"] {
  if (checks.some((check) => check.status === "critical")) {
    return "critical";
  }

  if (checks.some((check) => check.status === "warning")) {
    return "warning";
  }

  return "pass";
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
    return invokeDesktop<SshConnectionTestResult>("test_ssh_connection", {
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
      return await invokeDesktop<CheckResult>("run_linux_check", {
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

function nextCredentialBindingStatus(
  credential: Asset["credential"],
): NonNullable<Asset["credential"]["bindingStatus"]> {
  if (credential.secretRef.trim().length === 0) {
    return "rebind-required";
  }

  return credential.bindingStatus === "linked" ? "linked" : "verification-required";
}

function App() {
  type WorkspaceId =
    | "inspection-hub"
    | "assets-strategy"
    | "inspection-results"
    | "system-settings";
  type InspectSectionId = "run" | "assets" | "automation";

  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>("inspection-hub");
  const [pendingWorkspace, setPendingWorkspace] = useState<WorkspaceId | null>(null);
  const [activeInspectSection, setActiveInspectSection] = useState<InspectSectionId>("run");
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
  const [serviceMessageTone, setServiceMessageTone] = useState<FeedbackTone>("info");
  const [isBootstrappingWorkspace, setIsBootstrappingWorkspace] = useState(true);
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
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const activeTemplate = builtInTemplates.find((template) => template.id === selectedTemplateId) ?? defaultTemplate;
  const activeChecks = resolveTemplateChecks(activeTemplate.id);
  const hasRealData = savedAssets.length > 0 || serviceHistoryRuns.length > 0 || schedules.length > 0;
  const showingDemoExperience = onboardingMode === "demo";
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
      void invokeDesktop<LocalDesktopSettingsResponse>("upsert_local_service_settings", {
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

  function handleWorkspaceChange(workspaceId: WorkspaceId) {
    if (workspaceId === activeWorkspace) {
      return;
    }

    setPendingWorkspace(workspaceId);
    setServiceMessage(`Opening ${workspaceSections.find((section) => section.id === workspaceId)?.title ?? workspaceId}...`);
    startTransition(() => {
      setActiveWorkspace(workspaceId);
    });
  }

  function handleInspectSectionChange(sectionId: InspectSectionId) {
    setActiveInspectSection(sectionId);
  }

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
      credential: (() => {
        const nextCredential = {
          ...current.credential,
          ...patch,
        };

        return {
          ...nextCredential,
          bindingStatus:
            patch.secretRef !== undefined || patch.method !== undefined || patch.username !== undefined
              ? nextCredential.secretRef.trim().length > 0
                ? "verification-required"
                : "rebind-required"
              : nextCredential.bindingStatus,
        };
      })(),
      updatedAt: new Date().toISOString(),
    }));
  }

  async function loadInitialState() {
    setIsBootstrappingWorkspace(true);
    setServiceMessage("Loading workspace data...");
    setServiceMessageTone("info");
    try {
      const settingsResponse = await invokeDesktop<LocalDesktopSettingsResponse>("get_local_service_settings");
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
      setIsBootstrappingWorkspace(false);
      setServiceMessage("Workspace ready.");
      setServiceMessageTone("success");
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
    setServiceMessageTone("info");
    try {
      const response = await invokeDesktop<LocalServiceStatusResponse>("get_local_service_status");
      setServiceResponse(response);
    } catch (error) {
      setServiceResponse(null);
      setServiceMessage(formatActionError("Refreshing local service status", error));
      setServiceMessageTone("error");
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleStartLocalService() {
    setIsRefreshingService(true);
    setServiceMessage("Starting local service...");
    setServiceMessageTone("info");
    try {
      const message = await invokeDesktop<string>("start_local_service");
      setServiceMessage(message);
      setServiceMessageTone("success");
      await refreshLocalServiceHealth();
    } catch (error) {
      setServiceMessage(formatActionError("Starting local service", error));
      setServiceMessageTone("error");
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleStopLocalService() {
    setIsRefreshingService(true);
    setServiceMessage("Stopping local service...");
    setServiceMessageTone("info");
    try {
      const response = await invokeDesktop<LocalServiceCommandResponse>("stop_local_service");
      setServiceMessage(response.message);
      setServiceMessageTone("success");
      await refreshLocalServiceHealth();
    } catch (error) {
      setServiceMessage(formatActionError("Stopping local service", error));
      setServiceMessageTone("error");
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleRestartLocalService() {
    setIsRefreshingService(true);
    setServiceMessage("Restarting local service...");
    setServiceMessageTone("info");
    try {
      const response = await invokeDesktop<LocalServiceCommandResponse>("restart_local_service");
      setServiceMessage(response.message);
      setServiceMessageTone("success");
      await refreshLocalServiceHealth();
    } catch (error) {
      setServiceMessage(formatActionError("Restarting local service", error));
      setServiceMessageTone("error");
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleBootstrapLocalPostgres() {
    setIsRefreshingService(true);
    setServiceMessage("Bootstrapping managed PostgreSQL...");
    setServiceMessageTone("info");
    try {
      const response = await invokeDesktop<LocalServiceCommandResponse>("bootstrap_local_service_postgres");
      setServiceMessage(response.message);
      setServiceMessageTone("success");
      await refreshLocalServiceHealth();
    } catch (error) {
      setServiceMessage(formatActionError("Bootstrapping managed PostgreSQL", error));
      setServiceMessageTone("error");
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleStartLocalPostgres() {
    setIsRefreshingService(true);
    setServiceMessage("Starting managed PostgreSQL...");
    setServiceMessageTone("info");
    try {
      const response = await invokeDesktop<LocalServiceCommandResponse>("start_local_service_postgres");
      setServiceMessage(response.message);
      setServiceMessageTone("success");
      await refreshLocalServiceHealth();
    } catch (error) {
      setServiceMessage(formatActionError("Starting managed PostgreSQL", error));
      setServiceMessageTone("error");
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function handleStopLocalPostgres() {
    setIsRefreshingService(true);
    setServiceMessage("Stopping managed PostgreSQL...");
    setServiceMessageTone("info");
    try {
      const response = await invokeDesktop<LocalServiceCommandResponse>("stop_local_service_postgres");
      setServiceMessage(response.message);
      setServiceMessageTone("success");
      await refreshLocalServiceHealth();
    } catch (error) {
      setServiceMessage(formatActionError("Stopping managed PostgreSQL", error));
      setServiceMessageTone("error");
    } finally {
      setIsRefreshingService(false);
    }
  }

  async function refreshInspectionPreview() {
    setIsRefreshingPreview(true);
    setServiceMessage("Refreshing manual inspection preview...");
    setServiceMessageTone("info");
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
      setServiceMessage(`Inspection preview refreshed with ${run.summary.total} checks.`);
      setServiceMessageTone("success");
    } catch (error) {
      setServiceMessage(formatActionError("Refreshing manual inspection preview", error));
      setServiceMessageTone("error");
    } finally {
      setIsRefreshingPreview(false);
    }
  }

  async function refreshLocalServiceInspectionPreview() {
    setIsRefreshingServicePreview(true);
    setServiceMessage("Refreshing local service inspection preview...");
    setServiceMessageTone("info");

    try {
      const response = await invokeDesktop<InspectionPreviewResponse>("get_local_service_inspection_preview", {
        input: {
          asset,
          templateId: activeTemplate.id,
        },
      });
      setServiceInspectionRun(response.run);
      setServiceMessage(`Local service preview refreshed with ${response.run.summary.total} checks.`);
      setServiceMessageTone("success");
    } catch (error) {
      setServiceMessage(formatActionError("Refreshing local service inspection preview", error));
      setServiceMessageTone("error");
    } finally {
      setIsRefreshingServicePreview(false);
    }
  }

  async function runLocalServiceInspection() {
    setIsRunningServiceInspection(true);
    setServiceMessage("Running inspection through local service...");
    setServiceMessageTone("info");

    try {
      const response = await invokeDesktop<InspectionExecutionResponse>("run_local_service_inspection", {
        input: {
          asset,
          templateId: activeTemplate.id,
        },
      });
      setServiceExecutionRun(response.run);
      setServiceMessage(`Local service inspection completed with ${response.run.summary.total} checks.`);
      setServiceMessageTone("success");
      await refreshLocalServiceHistory();
    } catch (error) {
      setServiceMessage(formatActionError("Running local service inspection", error));
      setServiceMessageTone("error");
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
    setServiceMessage("Refreshing local inspection history...");
    setServiceMessageTone("info");

    try {
      const assetId = filters?.assetId ?? historyAssetFilter;
      const dateFrom = filters?.dateFrom ?? historyDateFrom;
      const dateTo = filters?.dateTo ?? historyDateTo;
      const response = await invokeDesktop<LocalServiceInspectionHistoryResponse>(
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
      setServiceMessage(`Loaded ${response.runs.length} inspection run${response.runs.length === 1 ? "" : "s"}.`);
      setServiceMessageTone("success");
    } catch (error) {
      setServiceMessage(formatActionError("Refreshing local inspection history", error));
      setServiceMessageTone("error");
    } finally {
      setIsRefreshingHistory(false);
    }
  }

  async function refreshLocalSchedules() {
    setIsRefreshingSchedules(true);
    setServiceMessage("Refreshing local schedules...");
    setServiceMessageTone("info");

    try {
      const response = await invokeDesktop<LocalInspectionScheduleListResponse>("get_local_service_schedules");
      setSchedules(response.schedules);
      setServiceMessage(`Loaded ${response.schedules.length} schedule${response.schedules.length === 1 ? "" : "s"}.`);
      setServiceMessageTone("success");
    } catch (error) {
      setServiceMessage(formatActionError("Refreshing local schedules", error));
      setServiceMessageTone("error");
    } finally {
      setIsRefreshingSchedules(false);
    }
  }

  async function refreshSavedAssets() {
    setIsRefreshingAssets(true);
    setServiceMessage("Refreshing saved assets...");
    setServiceMessageTone("info");

    try {
      const response = await invokeDesktop<LocalAssetListResponse>("get_local_service_assets");
      setSavedAssets(response.assets);
      setServiceMessage(`Loaded ${response.assets.length} saved asset${response.assets.length === 1 ? "" : "s"}.`);
      setServiceMessageTone("success");
    } catch (error) {
      setServiceMessage(formatActionError("Refreshing saved assets", error));
      setServiceMessageTone("error");
    } finally {
      setIsRefreshingAssets(false);
    }
  }

  async function handleSaveAsset() {
    setIsRefreshingAssets(true);
    setServiceMessage("Saving current asset...");
    setServiceMessageTone("info");

    try {
      const assetToSave: Asset = {
        ...asset,
        credential: {
          ...asset.credential,
          bindingStatus: nextCredentialBindingStatus(asset.credential),
        },
      };
      setAsset(assetToSave);
      const response = await invokeDesktop<LocalServiceCommandResponse>("upsert_local_service_asset", {
        input: {
          asset: assetToSave,
        },
      });
      await refreshSavedAssets();
      setServiceMessage(response.message);
      setServiceMessageTone("success");
    } catch (error) {
      setServiceMessage(formatActionError("Saving current asset", error));
      setServiceMessageTone("error");
    } finally {
      setIsRefreshingAssets(false);
    }
  }

  async function handleLoadAsset(savedAsset: Asset) {
    setAsset(savedAsset);
    setHistoryAssetFilter(savedAsset.id);
    setServiceMessage(`Loaded saved asset ${savedAsset.id}.`);
    setServiceMessageTone("success");
    await refreshInspectionPreview();
    await refreshLocalServiceInspectionPreview();
    await refreshLocalServiceHistory({ assetId: savedAsset.id });
  }

  async function handleExportConfig() {
    setIsExportingConfig(true);
    setServiceMessage("Exporting local config package...");
    setServiceMessageTone("info");

    try {
      const response = await invokeDesktop<LocalServiceCommandResponse>("export_local_service_config", {
        input: {
          path: migrationPath,
        },
      });
      setServiceMessage(response.message);
      setServiceMessageTone("success");
    } catch (error) {
      setServiceMessage(formatActionError("Exporting local config package", error));
      setServiceMessageTone("error");
    } finally {
      setIsExportingConfig(false);
    }
  }

  async function handleImportConfig() {
    setIsImportingConfig(true);
    setServiceMessage("Importing local config package...");
    setServiceMessageTone("info");

    try {
      const response = await invokeDesktop<LocalConfigImportResponse>("import_local_service_config", {
        input: {
          path: migrationPath,
        },
      });
      const importedFrom = response.importedFrom
        ? ` from ${response.importedFrom.machineName}`
        : "";
      const importMessage =
        `Imported ${response.importedAssets} assets, ${response.importedTemplates} templates, and ${response.importedSchedules} schedules${importedFrom}. ${response.requiresCredentialRebind} assets require credential rebind, ${response.disabledSchedules} schedules remain disabled, and you should complete SSH verification before resuming automation.`;
      await refreshSavedAssets();
      await refreshLocalSchedules();
      await refreshLocalServiceHealth();
      await refreshLocalServiceHistory();
      setServiceMessage(importMessage);
      setServiceMessageTone("success");
    } catch (error) {
      setServiceMessage(formatActionError("Importing local config package", error));
      setServiceMessageTone("error");
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
    setServiceMessage(`Exporting ${reportAudience} HTML report...`);
    setServiceMessageTone("info");

    try {
      const response = await invokeDesktop<LocalServiceCommandResponse>("export_local_service_html_report", {
        input: {
          path: reportPath,
          run,
          asset: resolveAssetForRun(run),
          audience: reportAudience,
        },
      });
      setServiceMessage(response.message);
      setServiceMessageTone("success");
    } catch (error) {
      setServiceMessage(formatActionError(`Exporting ${reportAudience} HTML report`, error));
      setServiceMessageTone("error");
    } finally {
      setIsExportingReport(false);
    }
  }

  async function handleExportPdfReport(run: InspectionRun) {
    setIsExportingPdfReport(true);
    setServiceMessage(`Exporting ${reportAudience} PDF report...`);
    setServiceMessageTone("info");

    try {
      await exportRunPdfReport(run, resolveAssetForRun(run), pdfReportPath, reportAudience);
      setServiceMessage(`Exported ${reportAudience} PDF report to ${pdfReportPath}.`);
      setServiceMessageTone("success");
    } catch (error) {
      setServiceMessage(formatActionError(`Exporting ${reportAudience} PDF report`, error));
      setServiceMessageTone("error");
    } finally {
      setIsExportingPdfReport(false);
    }
  }

  async function handleOpenExportFile(path: string) {
    setServiceMessage(`Opening exported file ${path}...`);
    setServiceMessageTone("info");

    try {
      await invokeDesktop<string>("open_export_path", { path });
      setServiceMessage(`Opened exported file ${path}.`);
      setServiceMessageTone("success");
    } catch (error) {
      setServiceMessage(formatActionError(`Opening exported file ${path}`, error));
      setServiceMessageTone("error");
    }
  }

  async function handleRevealExportFile(path: string) {
    setServiceMessage(`Revealing exported file ${path}...`);
    setServiceMessageTone("info");

    try {
      await invokeDesktop<string>("reveal_export_path", { path });
      setServiceMessage(`Revealed exported file ${path}.`);
      setServiceMessageTone("success");
    } catch (error) {
      setServiceMessage(formatActionError(`Revealing exported file ${path}`, error));
      setServiceMessageTone("error");
    }
  }

  async function handleSaveSchedule() {
    setIsSavingSchedule(true);
    setServiceMessage("Creating local schedule...");
    setServiceMessageTone("info");

    try {
      const response = await invokeDesktop<LocalInspectionScheduleUpsertResponse>("upsert_local_service_schedule", {
        input: {
          asset,
          templateId: activeTemplate.id,
          intervalMinutes: Number(scheduleIntervalMinutes) || 15,
          enabled: true,
        },
      });
      const successMessage = `Saved schedule ${response.schedule.id}.`;
      await refreshLocalSchedules();
      await refreshLocalServiceHealth();
      setServiceMessage(successMessage);
      setServiceMessageTone("success");
    } catch (error) {
      setServiceMessage(formatActionError("Creating local schedule", error));
      setServiceMessageTone("error");
    } finally {
      setIsSavingSchedule(false);
    }
  }

  async function handleDeleteSchedule(id: string) {
    setIsRefreshingSchedules(true);
    setServiceMessage(`Deleting schedule ${id}...`);
    setServiceMessageTone("info");

    try {
      const response = await invokeDesktop<LocalServiceCommandResponse>("delete_local_service_schedule", {
        input: { id },
      });
      await refreshLocalSchedules();
      await refreshLocalServiceHealth();
      setServiceMessage(response.message);
      setServiceMessageTone("success");
    } catch (error) {
      setServiceMessage(formatActionError(`Deleting schedule ${id}`, error));
      setServiceMessageTone("error");
    } finally {
      setIsRefreshingSchedules(false);
    }
  }

  async function handleToggleSchedule(schedule: LocalInspectionSchedule) {
    setIsRefreshingSchedules(true);
    setServiceMessage(`${schedule.enabled ? "Disabling" : "Enabling"} schedule ${schedule.id}...`);
    setServiceMessageTone("info");

    try {
      const response = await invokeDesktop<LocalInspectionScheduleUpsertResponse>("upsert_local_service_schedule", {
        input: {
          id: schedule.id,
          asset: schedule.asset,
          templateId: schedule.templateId,
          intervalMinutes: schedule.intervalMinutes,
          enabled: !schedule.enabled,
        },
      });
      const successMessage =
        `${response.schedule.id} ${response.schedule.enabled ? "enabled" : "disabled"} successfully.`;
      await refreshLocalSchedules();
      await refreshLocalServiceHealth();
      setServiceMessage(successMessage);
      setServiceMessageTone("success");
    } catch (error) {
      setServiceMessage(formatActionError(`${schedule.enabled ? "Disabling" : "Enabling"} schedule ${schedule.id}`, error));
      setServiceMessageTone("error");
    } finally {
      setIsRefreshingSchedules(false);
    }
  }

  function handleEnterDemoMode() {
    setIsSwitchingMode(true);
    setOnboardingMode("demo");
    setAsset(initialAsset);
    setSelectedTemplateId(demoRuns[0]?.templateId ?? defaultTemplate.id);
    setHistoryAssetFilter(initialAsset.id);
    setHistoryDateFrom("");
    setHistoryDateTo("");
    setSelectedHistoryRun(demoRuns[0] ?? null);
    setServiceMessage("Showing sample runs so you can inspect OpsProbe before connecting a real host.");
    setServiceMessageTone("success");
    window.setTimeout(() => {
      setIsSwitchingMode(false);
    }, 180);
  }

  function handleSwitchToRealSetup() {
    setIsSwitchingMode(true);
    setOnboardingMode("real");
    setSelectedHistoryRun(null);
    setServiceMessage("Demo mode hidden. Configure and save a real asset to start collecting live inspection history.");
    setServiceMessageTone("success");
    window.setTimeout(() => {
      setIsSwitchingMode(false);
    }, 180);
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
  const assetsNeedingVerification = savedAssets.filter(
    (savedAsset) => savedAsset.credential.bindingStatus === "verification-required",
  );
  const repairPacks: RepairPack[] = [
    {
      id: "runtime",
      title: "Managed runtime",
      checks: serviceChecks.filter((check) =>
        [
          "service.process",
          "service.bootstrap",
          "postgres.data_dir",
          "postgres.port",
          "postgres.process",
          "storage.backend",
        ].includes(check.id) || check.id.startsWith("postgres.binary."),
      ),
      summary: "Local service and dedicated PostgreSQL must stay healthy for schedules, saved history, and managed storage.",
      whyItMatters: "If this pack is degraded, repeated inspections and durable history will be unreliable on this machine.",
      nextAction:
        "Start with missing PostgreSQL binaries or port conflicts, then bootstrap or restart the managed runtime and refresh status.",
      actionLabel: "Recheck Runtime",
    },
    {
      id: "reports",
      title: "Report exports",
      checks: serviceChecks.filter((check) => check.id === "local.report_dir"),
      summary: "Exports need a writable local directory so HTML and PDF reports can be generated without manual repair.",
      whyItMatters: "Broken report storage means inspection output cannot be handed off cleanly after a run finishes.",
      nextAction: "Confirm the configured report directory exists, is writable by the desktop user, and then refresh the environment check.",
      actionLabel: "Recheck Report Path",
    },
    {
      id: "ssh-tools",
      title: "Local SSH tools",
      checks: serviceChecks.filter((check) =>
        ["local.binary.ssh", "local.binary.sshpass"].includes(check.id),
      ),
      summary: "OpsProbe depends on the local SSH toolchain to validate credentials and run host checks from the desktop.",
      whyItMatters: "Without a working SSH client, users cannot trust connectivity tests or real inspection runs.",
      nextAction: "Install the missing local SSH dependency or switch the asset authentication mode, then retry the environment check.",
      actionLabel: "Open Asset Setup",
    },
    {
      id: "schedules",
      title: "Recurring inspections",
      checks: serviceChecks.filter((check) => check.id === "scheduling.local"),
      summary: "Recurring jobs need healthy runtime state and valid assets so SMB teams can rely on unattended checks.",
      whyItMatters: "If this pack is degraded, teams will miss expected evidence collection windows and drift detection.",
      nextAction: "Open assets and schedules, repair the affected target, and rerun one manual inspection before re-enabling automation.",
      actionLabel: "Open Assets & Strategy",
    },
  ].map((pack) => ({
    ...pack,
    status: summarizePackStatus(pack.checks),
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
      label: "Rebind and verify credentials",
      done: assetsNeedingRebind.length === 0 && assetsNeedingVerification.length === 0,
      action:
        assetsNeedingRebind.length > 0
          ? () => void handleLoadAsset(assetsNeedingRebind[0])
          : assetsNeedingVerification.length > 0
            ? () => void handleLoadAsset(assetsNeedingVerification[0])
            : undefined,
      actionLabel: "Load First Asset",
      detail:
        assetsNeedingRebind.length > 0
          ? `${assetsNeedingRebind.length} imported assets still need a local key path or password.`
          : assetsNeedingVerification.length > 0
            ? `${assetsNeedingVerification.length} saved assets still need a successful SSH test before schedules can resume.`
            : "No imported assets are waiting for credential rebind or verification.",
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
    setServiceMessage("Testing SSH connection...");
    setServiceMessageTone("info");

    try {
      const result = await invokeDesktop<SshConnectionTestResult>("test_ssh_connection", {
        input: sshInput,
      });
      setSshResult(result);
      if (result.ok) {
        const verifiedAsset: Asset = {
          ...asset,
          credential: {
            ...asset.credential,
            bindingStatus: "linked",
          },
          updatedAt: new Date().toISOString(),
        };
        setAsset(verifiedAsset);
        await invokeDesktop<LocalServiceCommandResponse>("upsert_local_service_asset", {
          input: {
            asset: verifiedAsset,
          },
        }).catch(() => {
          // Keep SSH verification feedback even if persistence is temporarily unavailable.
        });
        await refreshSavedAssets();
        setServiceMessage("SSH connection verified and asset state refreshed.");
        setServiceMessageTone("success");
      } else {
        setServiceMessage(result.message);
        setServiceMessageTone("error");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "SSH test failed.";
      setServiceMessage(message);
      setServiceMessageTone("error");
      setSshResult({
        ok: false,
        message,
      });
    } finally {
      setIsTestingSsh(false);
    }
  }

  const workspaceSections: Array<{ id: WorkspaceId; label: string; title: string; step: string }> = [
    {
      id: "inspection-hub",
      label: "Start",
      title: "Start",
      step: "01",
    },
    {
      id: "assets-strategy",
      label: "Inspect",
      title: "Inspect",
      step: "02",
    },
    {
      id: "inspection-results",
      label: "Reports",
      title: "Reports",
      step: "03",
    },
    {
      id: "system-settings",
      label: "System",
      title: "System",
      step: "04",
    },
  ];
  const runtimeStatus = serviceResponse?.snapshot.status ?? "unknown";
  const runtimeSummary =
    runtimeStatus === "ready"
      ? "Local runtime ready for schedules and exports."
      : runtimeStatus === "degraded"
        ? "Runtime is partially available. Review warnings before automation."
        : runtimeStatus === "starting"
          ? "Runtime bootstrap is still in progress."
          : runtimeStatus === "stopped"
            ? "Runtime is stopped. Start the local service before scheduling."
            : runtimeStatus === "error"
              ? "Runtime reported an error state. Review service recovery guidance."
        : "Runtime still needs setup before local scheduling is reliable.";
  const sidebarStatusLabel =
    showingDemoExperience ? "Demo dataset loaded" : hasRealData ? "Live workspace active" : "Awaiting first saved asset";
  const latestVisibleRun = selectedHistoryRun ?? visibleHistoryRuns[0] ?? serviceExecutionRun ?? serviceInspectionRun ?? null;
  const topbarTitle =
    activeWorkspace === "inspection-hub"
      ? "Start"
      : activeWorkspace === "assets-strategy"
        ? activeInspectSection === "run"
          ? "Inspect"
          : activeInspectSection === "assets"
            ? "Save Target"
            : "Automation"
        : activeWorkspace === "inspection-results"
          ? "Reports"
          : "System";
  const topbarDetail =
    activeWorkspace === "inspection-hub"
      ? "Start with one real inspection."
      : activeWorkspace === "assets-strategy"
        ? activeInspectSection === "run"
          ? "Enter one target, test SSH, and run one preview."
          : activeInspectSection === "assets"
            ? "Save working targets for reuse and migration."
            : "Set schedules only after the first inspection works."
        : activeWorkspace === "inspection-results"
          ? "Review findings and export a report."
          : "Fix only what blocks the first inspection.";
  const inspectionFlowReady = sshResult?.ok === true && inspectionRun !== null;
  const topbarTone: TopbarTone =
    isBootstrappingWorkspace
      ? "loading"
      : blockingChecks.length > 0 || runtimeStatus === "error" || runtimeStatus === "degraded"
        ? "warning"
        : inspectionFlowReady
          ? "ok"
          : "info";
  const topbarStatusLabel =
    topbarTone === "loading"
      ? "Loading workspace"
      : topbarTone === "warning"
        ? blockingChecks.length > 0
          ? `${blockingChecks.length} blockers before inspect`
          : "Runtime needs attention"
        : inspectionFlowReady
          ? "Inspection path proven"
          : "Ready for next step";
  const topbarStatusDetail =
    topbarTone === "loading"
      ? "Preparing local data and runtime status."
      : topbarTone === "warning"
        ? runtimeSummary
        : inspectionFlowReady
          ? "SSH and one preview already succeeded."
          : topbarDetail;
  const feedbackHeading =
    serviceMessageTone === "error"
      ? "Action Needed"
      : serviceMessageTone === "success"
        ? "Done"
        : isInFlightMessage(serviceMessage)
          ? "Working"
          : "Workspace Update";
  const feedbackRole = serviceMessageTone === "error" ? "alert" : "status";

  useEffect(() => {
    if (pendingWorkspace === null || pendingWorkspace !== activeWorkspace) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPendingWorkspace(null);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [activeWorkspace, pendingWorkspace]);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark" aria-hidden="true">
            <svg className="brand-mark-svg" viewBox="0 0 64 64" role="img">
              <path d="M14 14h18c11.046 0 20 8.954 20 20s-8.954 20-20 20H14V14z" />
              <path d="M22 22h10c6.627 0 12 5.373 12 12s-5.373 12-12 12H22V22z" />
              <path d="M41 12h9L31 52h-9z" />
              <circle cx="43" cy="20" r="4" />
            </svg>
          </div>
          <p className="sidebar-kicker">OpsProbe</p>
          <h1>Ops Console</h1>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          <div className="sidebar-group-links">
            {workspaceSections.map((section) => (
              <button
                key={section.id}
                className={`sidebar-link ${activeWorkspace === section.id ? "sidebar-link-active" : ""} ${pendingWorkspace === section.id ? "sidebar-link-pending" : ""}`}
                onClick={() => handleWorkspaceChange(section.id)}
                type="button"
                aria-busy={pendingWorkspace === section.id}
              >
                <span className="sidebar-link-main">
                  <span className="sidebar-link-step">{section.step}</span>
                  <span className="sidebar-link-label">{section.label}</span>
                </span>
                {pendingWorkspace === section.id ? <span className="sidebar-link-pulse" aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-row">
            <span>Runtime</span>
            <strong>{runtimeStatus}</strong>
          </div>
          <div className="sidebar-footer-row">
            <span>Mode</span>
            <strong>{showingDemoExperience ? "Demo" : "Real"}</strong>
          </div>
          <div className="sidebar-footer-note">{sidebarStatusLabel}</div>
          <div className="sidebar-footer-meta">v0.11.10</div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-title-block">
            <h2>{topbarTitle}</h2>
            <p>{topbarDetail}</p>
          </div>
          <div className="topbar-status-strip">
            <div className={`topbar-status-card topbar-status-card-${topbarTone}`}>
              <span className="topbar-status-label">Current Status</span>
              <strong>{topbarStatusLabel}</strong>
              <p>{topbarStatusDetail}</p>
            </div>
            <div className="topbar-metrics">
              <span className={`topbar-chip topbar-chip-${topbarTone}`}>
                {isBootstrappingWorkspace ? "Loading workspace..." : runtimeStatus}
              </span>
              <span className={`topbar-chip ${showingDemoExperience ? "topbar-chip-info" : "topbar-chip-ok"}`}>
                {showingDemoExperience ? "Demo mode" : "Real mode"}
              </span>
            </div>
          </div>
        </header>

        <div className="workspace-scroll">
          {serviceMessage ? (
            <div className={`global-feedback-banner global-feedback-${serviceMessageTone}`} role={feedbackRole} aria-live="polite">
              <strong>{feedbackHeading}</strong>
              <span>{serviceMessage}</span>
            </div>
          ) : null}

          {activeWorkspace === "inspection-hub" ? (
            <InspectionHubWorkspace
              runtimeStatus={runtimeStatus}
              runtimeSummary={runtimeSummary}
              completedSetupSteps={completedSetupSteps}
              totalSetupSteps={firstRunChecklist.length}
              warningCount={warningChecks.length}
              blockingCount={blockingChecks.length}
              assetCount={savedAssets.length}
              scheduleCount={schedules.length}
              historyCount={visibleHistoryRuns.length}
              selectedTemplateName={activeTemplate.name}
              latestRun={latestVisibleRun}
              showingDemoExperience={showingDemoExperience}
              onStartInspection={() => {
                setActiveInspectSection("run");
                handleWorkspaceChange("assets-strategy");
              }}
              onOpenResults={() => handleWorkspaceChange("inspection-results")}
              onOpenSettings={() => handleWorkspaceChange("system-settings")}
            />
          ) : null}

          {activeWorkspace === "assets-strategy" ? (
            <>
              <section className="inspect-shell">
                <div className="inspect-stage-intro inspect-stage-intro-compact">
                  <div>
                    <h3>First inspection path</h3>
                    <p className="helper-text inspect-stage-copy">
                      Finish one manual inspection first. Save targets and automation are follow-up steps.
                    </p>
                  </div>
                  <div className="inspect-mode-switch inspect-mode-switch-inline" aria-label="Inspect entry">
                    <button
                      className={`inspect-mode-button ${activeInspectSection === "run" ? "inspect-mode-button-active" : ""}`}
                      onClick={() => handleInspectSectionChange("run")}
                      type="button"
                    >
                      <span className="inspect-mode-step">Now</span>
                      <span>
                        <strong>Run now</strong>
                        <small>Enter one target, test SSH, and prove one preview.</small>
                      </span>
                    </button>
                    <button
                      className={`inspect-mode-button ${activeInspectSection === "assets" ? "inspect-mode-button-active" : ""}`}
                      onClick={() => handleInspectSectionChange("assets")}
                      type="button"
                    >
                      <span className="inspect-mode-step">Later</span>
                      <span>
                        <strong>Save target</strong>
                        <small>Keep this working target for reuse and machine transfer.</small>
                      </span>
                    </button>
                    <button
                      className={`inspect-mode-button ${activeInspectSection === "automation" ? "inspect-mode-button-active" : ""}`}
                      onClick={() => handleInspectSectionChange("automation")}
                      type="button"
                    >
                      <span className="inspect-mode-step">Later</span>
                      <span>
                        <strong>Automate later</strong>
                        <small>Only schedule recurring runs after the first manual result is trusted.</small>
                      </span>
                    </button>
                  </div>
                </div>
                {!inspectionFlowReady ? (
                  <p className="helper-text inspect-follow-up-note">
                    If you open the later steps early, treat them as preparation only. The real proof is one SSH success and one readable preview result.
                  </p>
                ) : null}
              </section>
              {activeInspectSection === "run" ? (
                <section className="inspect-primary-stage">
                  <RunnerWorkspace
                    asset={asset}
                    builtInTemplates={builtInTemplates}
                    selectedTemplateId={selectedTemplateId}
                    activeTemplate={activeTemplate}
                    activeChecksCount={activeChecks.length}
                    inspectionRun={inspectionRun}
                    isTestingSsh={isTestingSsh}
                    isRefreshingPreview={isRefreshingPreview}
                    sshResult={sshResult}
                    sshTroubleshooting={sshTroubleshooting}
                    onPatchAsset={patchAsset}
                    onPatchCredential={patchCredential}
                    onSelectTemplate={setSelectedTemplateId}
                    onTestSsh={() => void handleSshTest()}
                    onRefreshInspectionPreview={() => void refreshInspectionPreview()}
                    onOpenAssets={() => handleInspectSectionChange("assets")}
                    onOpenResults={() => handleWorkspaceChange("inspection-results")}
                  />
                </section>
              ) : null}
              {activeInspectSection === "assets" ? (
                <section className="inspect-secondary-stage" aria-label="Save target">
                  <AssetsWorkspace
                    asset={asset}
                    savedAssets={savedAssets}
                    migrationPath={migrationPath}
                    isRefreshingAssets={isRefreshingAssets}
                    isExportingConfig={isExportingConfig}
                    isImportingConfig={isImportingConfig}
                    onMigrationPathChange={setMigrationPath}
                    onRefreshSavedAssets={() => void refreshSavedAssets()}
                    onSaveCurrentAsset={() => void handleSaveAsset()}
                    onExportConfig={() => void handleExportConfig()}
                    onImportConfig={() => void handleImportConfig()}
                    onLoadAsset={(savedAsset) => void handleLoadAsset(savedAsset)}
                    onPatchAsset={patchAsset}
                    onPatchCredential={patchCredential}
                  />
                </section>
              ) : null}
              {activeInspectSection === "automation" ? (
                <section className="inspect-secondary-stage" aria-label="Enable automation">
                  <ServiceWorkspace
                    assetId={asset.id}
                    activeTemplateName={activeTemplate.name}
                    scheduleIntervalMinutes={scheduleIntervalMinutes}
                    schedules={schedules}
                    serviceResponse={serviceResponse}
                    serviceMessage={serviceMessage}
                    isRefreshingSchedules={isRefreshingSchedules}
                    isSavingSchedule={isSavingSchedule}
                    isRefreshingService={isRefreshingService}
                    onScheduleIntervalChange={setScheduleIntervalMinutes}
                    onRefreshSchedules={() => void refreshLocalSchedules()}
                    onSaveSchedule={() => void handleSaveSchedule()}
                    onToggleSchedule={(schedule) => void handleToggleSchedule(schedule)}
                    onDeleteSchedule={(id) => void handleDeleteSchedule(id)}
                    onRefreshServiceHealth={() => void refreshLocalServiceHealth()}
                    onStartLocalService={() => void handleStartLocalService()}
                    onStopLocalService={() => void handleStopLocalService()}
                    onRestartLocalService={() => void handleRestartLocalService()}
                    onBootstrapLocalPostgres={() => void handleBootstrapLocalPostgres()}
                    onStartLocalPostgres={() => void handleStartLocalPostgres()}
                    onStopLocalPostgres={() => void handleStopLocalPostgres()}
                  />
                </section>
              ) : null}
            </>
          ) : null}

          {activeWorkspace === "inspection-results" ? (
            <>
              <HistoryWorkspace
                asset={asset}
                activeTemplateName={activeTemplate.name}
                reportAudience={reportAudience}
                reportPath={reportPath}
                pdfReportPath={pdfReportPath}
                serviceExecutionRun={serviceExecutionRun}
                serviceInspectionRun={serviceInspectionRun}
                visibleHistoryRuns={visibleHistoryRuns}
                selectedHistoryRun={selectedHistoryRun}
                repeatedProblems={repeatedProblems}
                showingDemoExperience={showingDemoExperience}
                onboardingMode={onboardingMode}
                historyAssetFilter={historyAssetFilter}
                historyDateFrom={historyDateFrom}
                historyDateTo={historyDateTo}
                isRunningServiceInspection={isRunningServiceInspection}
                isRefreshingServicePreview={isRefreshingServicePreview}
                isRefreshingHistory={isRefreshingHistory}
                isExportingReport={isExportingReport}
                isExportingPdfReport={isExportingPdfReport}
                onReportPathChange={setReportPath}
                onPdfReportPathChange={setPdfReportPath}
                onHistoryAssetFilterChange={setHistoryAssetFilter}
                onHistoryDateFromChange={setHistoryDateFrom}
                onHistoryDateToChange={setHistoryDateTo}
                onRunLocalServiceInspection={() => void runLocalServiceInspection()}
                onRefreshLocalServiceInspectionPreview={() => void refreshLocalServiceInspectionPreview()}
                onRefreshLocalServiceHistory={() => void refreshLocalServiceHistory()}
                onSelectHistoryRun={setSelectedHistoryRun}
                onExportHtmlReport={(run) => void handleExportHtmlReport(run)}
                onExportPdfReport={(run) => void handleExportPdfReport(run)}
                onOpenExportFile={(path) => void handleOpenExportFile(path)}
                onRevealExportFile={(path) => void handleRevealExportFile(path)}
                templateLabel={templateLabel}
              />
              <ReportsWorkspace
                reportAudience={reportAudience}
                setReportAudience={setReportAudience}
              />
            </>
          ) : null}

          {activeWorkspace === "system-settings" ? (
            <>
              <SetupWorkspace
                showingDemoExperience={showingDemoExperience}
                isSwitchingMode={isSwitchingMode}
                completedSetupSteps={completedSetupSteps}
                firstRunChecklist={firstRunChecklist}
                blockingChecks={blockingChecks}
                warningChecks={warningChecks}
                repairPacks={repairPacks}
                onEnterDemoMode={handleEnterDemoMode}
                onSwitchToRealSetup={handleSwitchToRealSetup}
                onOpenAssetsStrategy={() => handleWorkspaceChange("assets-strategy")}
                onRefreshEnvironment={() => void refreshLocalServiceHealth()}
                onOpenInspectionHub={() => handleWorkspaceChange("inspection-hub")}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;
