import type { CheckResult } from "@opsprobe/checks";
import type { Asset, InspectionRun } from "@opsprobe/core";

export interface ReportSection {
  title: string;
  entries: string[];
}

export interface ReportStatusSummary {
  pass: number;
  warning: number;
  critical: number;
  unknown: number;
  total: number;
}

export interface ReportSeveritySummary {
  info: number;
  warning: number;
  critical: number;
  total: number;
}

export interface ReportCheckView {
  assetId: string;
  assetName: string;
  host: string;
  runId: string;
  runStatus: InspectionRun["status"];
  collectedAt: string;
  checkId: string;
  title: string;
  status: CheckResult["status"];
  severity: CheckResult["severity"];
  summary: string;
  evidence: CheckResult["evidence"];
  remediation: string;
}

export interface ReportSeverityGroup {
  severity: CheckResult["severity"];
  checks: ReportCheckView[];
  summary: ReportStatusSummary;
}

export interface ReportHostView {
  assetId: string;
  assetName: string;
  host: string;
  runs: Array<{
    runId: string;
    status: InspectionRun["status"];
    createdAt: string;
    summary: ReportStatusSummary;
    severitySummary: ReportSeveritySummary;
  }>;
  summary: ReportStatusSummary;
  severitySummary: ReportSeveritySummary;
  severityGroups: ReportSeverityGroup[];
}

export interface InspectionReportView {
  generatedAt: string;
  hosts: ReportHostView[];
  overallSummary: ReportStatusSummary;
  overallSeveritySummary: ReportSeveritySummary;
  severityGroups: ReportSeverityGroup[];
}

interface BuildInspectionReportViewInput {
  runs: InspectionRun[];
  assets?: Asset[];
}

interface AssetSnapshot {
  id: string;
  name: string;
  host: string;
}

const SEVERITY_ORDER: CheckResult["severity"][] = ["critical", "warning", "info"];

function emptyStatusSummary(): ReportStatusSummary {
  return {
    pass: 0,
    warning: 0,
    critical: 0,
    unknown: 0,
    total: 0,
  };
}

function emptySeveritySummary(): ReportSeveritySummary {
  return {
    info: 0,
    warning: 0,
    critical: 0,
    total: 0,
  };
}

function summarizeStatuses(results: CheckResult[]): ReportStatusSummary {
  return results.reduce<ReportStatusSummary>((summary, result) => {
    summary[result.status] += 1;
    summary.total += 1;
    return summary;
  }, emptyStatusSummary());
}

function summarizeSeverities(results: CheckResult[]): ReportSeveritySummary {
  return results.reduce<ReportSeveritySummary>((summary, result) => {
    summary[result.severity] += 1;
    summary.total += 1;
    return summary;
  }, emptySeveritySummary());
}

function addStatusSummary(target: ReportStatusSummary, source: ReportStatusSummary) {
  target.pass += source.pass;
  target.warning += source.warning;
  target.critical += source.critical;
  target.unknown += source.unknown;
  target.total += source.total;
}

function addSeveritySummary(target: ReportSeveritySummary, source: ReportSeveritySummary) {
  target.info += source.info;
  target.warning += source.warning;
  target.critical += source.critical;
  target.total += source.total;
}

function buildAssetMap(assets: Asset[] = []) {
  return new Map<string, AssetSnapshot>(
    assets.map((asset) => [
      asset.id,
      {
        id: asset.id,
        name: asset.name,
        host: asset.host,
      },
    ]),
  );
}

function toReportCheckView(run: InspectionRun, asset: AssetSnapshot, result: CheckResult): ReportCheckView {
  return {
    assetId: run.assetId,
    assetName: asset.name,
    host: asset.host,
    runId: run.id,
    runStatus: run.status,
    collectedAt: run.createdAt,
    checkId: result.checkId,
    title: result.title,
    status: result.status,
    severity: result.severity,
    summary: result.summary,
    evidence: result.evidence,
    remediation: result.remediation,
  };
}

function groupChecksBySeverity(checks: ReportCheckView[]): ReportSeverityGroup[] {
  return SEVERITY_ORDER.map((severity) => {
    const severityChecks = checks.filter((check) => check.severity === severity);
    return {
      severity,
      checks: severityChecks,
      summary: summarizeStatuses(severityChecks),
    };
  }).filter((group) => group.checks.length > 0);
}

function summarizeStatusesFromCheckViews(checks: ReportCheckView[]): ReportStatusSummary {
  return checks.reduce<ReportStatusSummary>((summary, check) => {
    summary[check.status] += 1;
    summary.total += 1;
    return summary;
  }, emptyStatusSummary());
}

function fallbackAsset(run: InspectionRun): AssetSnapshot {
  return {
    id: run.assetId,
    name: run.assetId,
    host: "unknown-host",
  };
}

export function buildInspectionReportView(
  input: BuildInspectionReportViewInput,
): InspectionReportView {
  const assetMap = buildAssetMap(input.assets);
  const hostMap = new Map<string, ReportHostView>();
  const allChecks: ReportCheckView[] = [];

  for (const run of input.runs) {
    const asset = assetMap.get(run.assetId) ?? fallbackAsset(run);
    const runStatusSummary = summarizeStatuses(run.results);
    const runSeveritySummary = summarizeSeverities(run.results);
    const hostKey = asset.id;
    const hostChecks = run.results.map((result) => toReportCheckView(run, asset, result));
    allChecks.push(...hostChecks);

    const existingHost = hostMap.get(hostKey);
    if (!existingHost) {
      hostMap.set(hostKey, {
        assetId: asset.id,
        assetName: asset.name,
        host: asset.host,
        runs: [
          {
            runId: run.id,
            status: run.status,
            createdAt: run.createdAt,
            summary: runStatusSummary,
            severitySummary: runSeveritySummary,
          },
        ],
        summary: runStatusSummary,
        severitySummary: runSeveritySummary,
        severityGroups: groupChecksBySeverity(hostChecks),
      });
      continue;
    }

    existingHost.runs.push({
      runId: run.id,
      status: run.status,
      createdAt: run.createdAt,
      summary: runStatusSummary,
      severitySummary: runSeveritySummary,
    });
    addStatusSummary(existingHost.summary, runStatusSummary);
    addSeveritySummary(existingHost.severitySummary, runSeveritySummary);
    const mergedChecks = existingHost.severityGroups.flatMap((group) => group.checks).concat(hostChecks);
    existingHost.severityGroups = groupChecksBySeverity(mergedChecks);
  }

  const overallSummary = summarizeStatusesFromCheckViews(allChecks);
  const overallSeveritySummary = allChecks.reduce<ReportSeveritySummary>((summary, check) => {
    summary[check.severity] += 1;
    summary.total += 1;
    return summary;
  }, emptySeveritySummary());

  const hosts = Array.from(hostMap.values()).sort((left, right) => left.assetName.localeCompare(right.assetName));
  for (const host of hosts) {
    host.runs.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  return {
    generatedAt: new Date().toISOString(),
    hosts,
    overallSummary,
    overallSeveritySummary,
    severityGroups: groupChecksBySeverity(allChecks),
  };
}

export function buildSingleRunReportView(run: InspectionRun, asset?: Asset): InspectionReportView {
  return buildInspectionReportView({
    runs: [run],
    assets: asset ? [asset] : undefined,
  });
}
