import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { buildSingleRunReportView, renderInspectionReportHtml } from "@opsprobe/report";
import type { LocalHtmlReportExportRequest, LocalServiceCommandResponse } from "./protocol.ts";

export async function exportHtmlReport(
  request: LocalHtmlReportExportRequest,
): Promise<LocalServiceCommandResponse> {
  const view = buildSingleRunReportView(request.run, request.asset);
  const title = request.asset
    ? `OpsProbe Report - ${request.asset.name}`
    : `OpsProbe Report - ${request.run.assetId}`;
  const html = renderInspectionReportHtml(view, { title });

  await mkdir(dirname(request.path), { recursive: true });
  await writeFile(request.path, html, "utf8");

  return {
    ok: true,
    message: `Exported HTML report to ${request.path}.`,
  };
}
