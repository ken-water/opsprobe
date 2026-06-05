import { findBuiltInTemplateDefinition, type CheckResult } from "@opsprobe/checks";
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
  templateId: string;
  templateName: string;
  templateDescription: string;
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
  actionFocus: string;
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
  templateIds: string[];
  templateNames: string[];
  runs: Array<{
    runId: string;
    templateId: string;
    templateName: string;
    templateDescription: string;
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

export type ReportAudience = "operator" | "manager";

export interface RenderInspectionReportHtmlOptions {
  title?: string;
  audience?: ReportAudience;
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

interface TemplateSnapshot {
  id: string;
  name: string;
  description: string;
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

function resolveTemplateSnapshot(run: InspectionRun): TemplateSnapshot {
  const template = findBuiltInTemplateDefinition(run.templateId);

  return {
    id: run.templateId,
    name: template?.name ?? run.templateId,
    description: template?.description ?? "Template metadata is unavailable for this run.",
  };
}

function toReportCheckView(
  run: InspectionRun,
  asset: AssetSnapshot,
  template: TemplateSnapshot,
  result: CheckResult,
): ReportCheckView {
  const actionFocus = deriveActionFocus(result);

  return {
    assetId: run.assetId,
    assetName: asset.name,
    host: asset.host,
    templateId: template.id,
    templateName: template.name,
    templateDescription: template.description,
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
    actionFocus,
  };
}

function deriveActionFocus(result: CheckResult) {
  const firstSentence = result.remediation.split(/[.;]/)[0]?.trim();

  if (result.checkId === "linux.kubelet.health.summary") {
    return "Inspect kubelet state, restart growth, and recent failures first.";
  }

  if (result.checkId === "linux.kubernetes.node.pressure") {
    return "Check eviction hints and filesystem or memory pressure first.";
  }

  if (result.checkId === "linux.kubernetes.static-pod.inventory") {
    return "Confirm critical static pod manifests and control-plane containers first.";
  }

  if (result.checkId === "linux.kubernetes.node.summary") {
    return "Verify runtime endpoint and unexpected pod-count drift first.";
  }

  if (firstSentence && firstSentence.length > 0) {
    return firstSentence.endsWith(".") ? firstSentence : `${firstSentence}.`;
  }

  return "Review the finding and confirm the next operator action.";
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
    const template = resolveTemplateSnapshot(run);
    const runStatusSummary = summarizeStatuses(run.results);
    const runSeveritySummary = summarizeSeverities(run.results);
    const hostKey = asset.id;
    const hostChecks = run.results.map((result) => toReportCheckView(run, asset, template, result));
    allChecks.push(...hostChecks);

    const existingHost = hostMap.get(hostKey);
    if (!existingHost) {
      hostMap.set(hostKey, {
        assetId: asset.id,
        assetName: asset.name,
        host: asset.host,
        templateIds: [template.id],
        templateNames: [template.name],
        runs: [
          {
            runId: run.id,
            templateId: template.id,
            templateName: template.name,
            templateDescription: template.description,
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
      templateId: template.id,
      templateName: template.name,
      templateDescription: template.description,
      status: run.status,
      createdAt: run.createdAt,
      summary: runStatusSummary,
      severitySummary: runSeveritySummary,
    });
    if (!existingHost.templateIds.includes(template.id)) {
      existingHost.templateIds.push(template.id);
    }
    if (!existingHost.templateNames.includes(template.name)) {
      existingHost.templateNames.push(template.name);
    }
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderStatusSummary(summary: ReportStatusSummary) {
  return `
    <ul class="summary-list">
      <li>Total <strong>${summary.total}</strong></li>
      <li>Pass <strong>${summary.pass}</strong></li>
      <li>Warning <strong>${summary.warning}</strong></li>
      <li>Critical <strong>${summary.critical}</strong></li>
      <li>Unknown <strong>${summary.unknown}</strong></li>
    </ul>
  `;
}

function renderEvidence(check: ReportCheckView) {
  if (check.evidence.length === 0) {
    return "<p class=\"helper\">No evidence was recorded.</p>";
  }

  return `
    <ul class="evidence-list">
      ${check.evidence
        .map(
          (item) =>
            `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</li>`,
        )
        .join("")}
    </ul>
  `;
}

function renderSeveritySummary(summary: ReportSeveritySummary) {
  return `
    <ul class="summary-list">
      <li>Critical <strong>${summary.critical}</strong></li>
      <li>Warning <strong>${summary.warning}</strong></li>
      <li>Info <strong>${summary.info}</strong></li>
      <li>Total <strong>${summary.total}</strong></li>
    </ul>
  `;
}

function highestRiskLabel(view: InspectionReportView) {
  if (view.overallSeveritySummary.critical > 0) {
    return "critical";
  }

  if (view.overallSeveritySummary.warning > 0) {
    return "warning";
  }

  return "stable";
}

export function renderInspectionReportHtml(
  view: InspectionReportView,
  options: RenderInspectionReportHtmlOptions = {},
) {
  const title = options.title ?? "OpsProbe Inspection Report";
  const audience = options.audience ?? "operator";
  const abnormalChecks = view.severityGroups
    .filter((group) => group.severity !== "info")
    .flatMap((group) => group.checks);
  const topAbnormalChecks = abnormalChecks.slice(0, 8);
  const criticalChecks = abnormalChecks.filter((check) => check.severity === "critical");
  const warningChecks = abnormalChecks.filter((check) => check.severity === "warning");
  const managerHighlights = [
    criticalChecks.length > 0
      ? `${criticalChecks.length} critical item(s) need immediate attention.`
      : "No critical items were detected.",
    warningChecks.length > 0
      ? `${warningChecks.length} warning item(s) should be scheduled into the next maintenance window.`
      : "No warning items were detected.",
    `${view.hosts.length} host(s) are included in this inspection summary.`,
  ];

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        color: #182028;
        background: #f6f4ee;
      }
      body {
        margin: 0;
        background:
          radial-gradient(circle at top left, rgba(255, 201, 92, 0.28), transparent 30%),
          linear-gradient(135deg, #f8f4ea 0%, #ecf2f6 54%, #dde7ee 100%);
      }
      main {
        max-width: 1120px;
        margin: 0 auto;
        padding: 40px 24px 72px;
      }
      h1, h2, h3 { margin: 0; }
      p { line-height: 1.7; }
      .hero, .panel, .check-card {
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(24, 32, 40, 0.08);
        border-radius: 24px;
        box-shadow: 0 16px 44px rgba(51, 67, 84, 0.08);
      }
      .hero, .panel { padding: 24px; margin-top: 24px; }
      .eyebrow {
        margin-bottom: 10px;
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #8a4b17;
      }
      .summary-list, .evidence-list {
        margin: 12px 0 0;
        padding-left: 18px;
        line-height: 1.7;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
      .host-grid, .checks-grid {
        display: grid;
        gap: 16px;
        margin-top: 18px;
      }
      .host-grid { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
      .checks-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
      .check-card {
        padding: 18px;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .severity-critical, .status-critical {
        background: #ffd8d8;
        color: #8a1f1f;
      }
      .severity-warning, .status-warning {
        background: #fff0cc;
        color: #8a5b00;
      }
      .severity-info, .status-pass {
        background: #dcefdc;
        color: #2e6a34;
      }
      .status-unknown {
        background: #e2e7ed;
        color: #495663;
      }
      .meta {
        color: #475463;
        font-size: 0.95rem;
      }
      .helper {
        color: #5a6673;
      }
      .spaced {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
      }
      .host-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }
      .run-list {
        margin-top: 14px;
        padding-left: 18px;
        line-height: 1.7;
      }
      @media (max-width: 720px) {
        main {
          padding: 24px 16px 56px;
        }
        .spaced, .host-header {
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <p class="eyebrow">OpsProbe Report</p>
        <div class="spaced">
          <div>
            <h1>${escapeHtml(title)}</h1>
            <p class="meta">Generated at ${escapeHtml(view.generatedAt)}</p>
          </div>
          <div class="pill status-pass">${view.hosts.length} host${view.hosts.length === 1 ? "" : "s"}</div>
        </div>
        ${renderStatusSummary(view.overallSummary)}
      </section>

      <section class="panel">
        <p class="eyebrow">Overview</p>
        <div class="grid">
          <div>
            <h3>Status Summary</h3>
            ${renderStatusSummary(view.overallSummary)}
          </div>
          <div>
            <h3>Severity Summary</h3>
            ${renderSeveritySummary(view.overallSeveritySummary)}
          </div>
        </div>
      </section>

      <section class="panel">
        <p class="eyebrow">${audience === "manager" ? "Executive Summary" : "Abnormal Items"}</p>
        ${
          audience === "manager"
            ? `<div class="grid">
                <article class="check-card">
                  <h3>Overall Risk</h3>
                  <p class="meta">Highest active severity</p>
                  <p><span class="pill severity-${highestRiskLabel(view) === "stable" ? "info" : highestRiskLabel(view)}">${escapeHtml(highestRiskLabel(view))}</span></p>
                  ${renderSeveritySummary(view.overallSeveritySummary)}
                </article>
                <article class="check-card">
                  <h3>Key Highlights</h3>
                  <ul class="summary-list">
                    ${managerHighlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                  </ul>
                </article>
              </div>`
            : abnormalChecks.length > 0
              ? `<div class="checks-grid">
                ${abnormalChecks
                  .map(
                    (check) => `
                  <article class="check-card">
                    <div class="spaced">
                    <div>
                      <h3>${escapeHtml(check.title)}</h3>
                        <p class="meta">${escapeHtml(check.assetName)} · ${escapeHtml(check.host)} · ${escapeHtml(check.templateName)}</p>
                      </div>
                      <span class="pill severity-${check.severity}">${escapeHtml(check.severity)}</span>
                    </div>
                    <p>${escapeHtml(check.summary)}</p>
                    <p><strong>Action focus:</strong> ${escapeHtml(check.actionFocus)}</p>
                    ${renderEvidence(check)}
                    <p><strong>Suggestion:</strong> ${escapeHtml(check.remediation)}</p>
                  </article>`,
                  )
                  .join("")}
              </div>`
              : "<p class=\"helper\">No abnormal items were found in this report.</p>"
        }
      </section>

      <section class="panel">
        <p class="eyebrow">${audience === "manager" ? "Asset Summary" : "Hosts"}</p>
        <div class="host-grid">
          ${view.hosts
            .map(
              (host) => `
            <article class="check-card">
              <div class="host-header">
                <div>
                  <h3>${escapeHtml(host.assetName)}</h3>
                  <p class="meta">${escapeHtml(host.assetId)} · ${escapeHtml(host.host)}</p>
                  <p class="meta">Templates: ${escapeHtml(host.templateNames.join(", "))}</p>
                </div>
                <span class="pill status-pass">${host.runs.length} run${host.runs.length === 1 ? "" : "s"}</span>
              </div>
              ${renderStatusSummary(host.summary)}
              <ul class="run-list">
                ${host.runs
                  .map(
                    (run) =>
                      `<li>${escapeHtml(run.createdAt)} · ${escapeHtml(run.runId)} · ${escapeHtml(run.templateName)} · ${escapeHtml(run.status)}</li>`,
                  )
                  .join("")}
              </ul>
            </article>`,
            )
            .join("")}
        </div>
      </section>

      ${
        audience === "manager"
          ? `<section class="panel">
        <p class="eyebrow">Priority Actions</p>
        ${
          topAbnormalChecks.length > 0
            ? `<div class="checks-grid">
              ${topAbnormalChecks
                .map(
                  (check) => `
                <article class="check-card">
                  <div class="spaced">
                    <div>
                      <h3>${escapeHtml(check.title)}</h3>
                      <p class="meta">${escapeHtml(check.assetName)} · ${escapeHtml(check.templateName)}</p>
                    </div>
                    <span class="pill severity-${check.severity}">${escapeHtml(check.severity)}</span>
                  </div>
                  <p>${escapeHtml(check.summary)}</p>
                  <p><strong>Action focus:</strong> ${escapeHtml(check.actionFocus)}</p>
                  <p><strong>Suggested next step:</strong> ${escapeHtml(check.remediation)}</p>
                </article>`
                )
                .join("")}
            </div>`
            : "<p class=\"helper\">No priority actions are required from this inspection run.</p>"
        }
      </section>`
          : `<section class="panel">
        <p class="eyebrow">Detailed Results</p>
        ${view.severityGroups
          .map(
            (group) => `
          <section class="panel">
            <div class="spaced">
              <div>
                <h2>${escapeHtml(group.severity)} checks</h2>
                <p class="meta">${group.checks.length} item${group.checks.length === 1 ? "" : "s"}</p>
              </div>
              <span class="pill severity-${group.severity}">${escapeHtml(group.severity)}</span>
            </div>
            <div class="checks-grid">
              ${group.checks
                .map(
                  (check) => `
                <article class="check-card">
                  <div class="spaced">
                    <div>
                      <h3>${escapeHtml(check.title)}</h3>
                      <p class="meta">${escapeHtml(check.assetName)} · ${escapeHtml(check.host)} · ${escapeHtml(check.templateName)} · ${escapeHtml(check.runId)}</p>
                    </div>
                    <span class="pill status-${check.status}">${escapeHtml(check.status)}</span>
                  </div>
                  <p>${escapeHtml(check.summary)}</p>
                  <p><strong>Action focus:</strong> ${escapeHtml(check.actionFocus)}</p>
                  ${renderEvidence(check)}
                  <p><strong>Suggestion:</strong> ${escapeHtml(check.remediation)}</p>
                </article>`,
                )
                .join("")}
            </div>
          </section>`,
          )
          .join("")}
      </section>`
      }
    </main>
  </body>
</html>`;
}
