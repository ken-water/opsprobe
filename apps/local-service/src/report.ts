import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { buildSingleRunReportView, renderInspectionReportHtml } from "@opsprobe/report";
import type { LocalHtmlReportExportRequest, LocalServiceCommandResponse } from "./protocol.ts";

export async function exportHtmlReport(
  request: LocalHtmlReportExportRequest,
): Promise<LocalServiceCommandResponse> {
  const view = buildSingleRunReportView(request.run, request.asset);
  const audience = request.audience ?? "operator";
  const title = request.asset
    ? `OpsProbe ${audience === "manager" ? "Summary" : "Report"} - ${request.asset.name}`
    : `OpsProbe ${audience === "manager" ? "Summary" : "Report"} - ${request.run.assetId}`;
  const html = renderInspectionReportHtml(view, { title, audience });

  await mkdir(dirname(request.path), { recursive: true });
  await writeFile(request.path, html, "utf8");

  return {
    ok: true,
    message: `Exported ${audience} HTML report to ${request.path}.`,
  };
}
