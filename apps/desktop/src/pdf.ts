import { invoke } from "@tauri-apps/api/core";
import type { Asset, InspectionRun } from "@opsprobe/core";
import { buildSingleRunReportView, type ReportCheckView } from "@opsprobe/report";

async function loadPdfRuntime() {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  return { jsPDF, autoTable };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read export data."));
    };
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to encode export data."));
        return;
      }

      const marker = result.indexOf(",");
      resolve(marker >= 0 ? result.slice(marker + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

function checkRows(checks: ReportCheckView[]) {
  return checks.map((check) => [
    check.assetName,
    check.templateName,
    check.title,
    check.status,
    check.severity,
    check.summary,
    check.remediation,
    check.evidence.map((item) => `${item.label}: ${item.value}`).join(" | "),
  ]);
}

export async function exportRunPdfReport(run: InspectionRun, asset: Asset | undefined, path: string) {
  const { jsPDF, autoTable } = await loadPdfRuntime();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const view = buildSingleRunReportView(run, asset);
  const title = asset ? `OpsProbe Report - ${asset.name}` : `OpsProbe Report - ${run.assetId}`;

  doc.setFontSize(20);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated at ${view.generatedAt}`, 14, 27);

  doc.setFontSize(12);
  doc.text("Overview", 14, 38);
  autoTable(doc, {
    startY: 42,
    head: [["Metric", "Value"]],
    body: [
      ["Template", view.hosts[0]?.runs[0]?.templateName ?? run.templateId],
      ["Total Checks", String(view.overallSummary.total)],
      ["Pass", String(view.overallSummary.pass)],
      ["Warning", String(view.overallSummary.warning)],
      ["Critical", String(view.overallSummary.critical)],
      ["Unknown", String(view.overallSummary.unknown)],
    ],
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [14, 77, 106] },
  });

  const abnormalChecks = view.severityGroups
    .filter((group) => group.severity !== "info")
    .flatMap((group) => group.checks);

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY
      ? ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 42) + 10
      : 80,
    head: [["Abnormal Item", "Status", "Severity", "Summary", "Suggestion"]],
    body:
      abnormalChecks.length > 0
        ? abnormalChecks.map((check) => [
            `${check.assetName} / ${check.templateName} / ${check.title}`,
            check.status,
            check.severity,
            check.summary,
            check.remediation,
          ])
        : [["No abnormal items", "", "", "", ""]],
    styles: { fontSize: 8, cellPadding: 2.2, overflow: "linebreak" },
    headStyles: { fillColor: [159, 75, 18] },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 18 },
      2: { cellWidth: 18 },
      3: { cellWidth: 58 },
      4: { cellWidth: 58 },
    },
  });

  for (const group of view.severityGroups) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text(`${group.severity.toUpperCase()} Results`, 14, 18);
    doc.setFontSize(10);
    doc.text(`${group.checks.length} item(s)`, 14, 24);

    autoTable(doc, {
      startY: 30,
      head: [["Host", "Template", "Check", "Status", "Summary", "Evidence", "Suggestion"]],
      body: checkRows(group.checks),
      styles: { fontSize: 7.5, cellPadding: 2, overflow: "linebreak", valign: "top" },
      headStyles: {
        fillColor:
          group.severity === "critical" ? [138, 31, 31] : group.severity === "warning" ? [138, 91, 0] : [46, 106, 52],
      },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 24 },
        2: { cellWidth: 24 },
        3: { cellWidth: 14 },
        4: { cellWidth: 34 },
        5: { cellWidth: 44 },
        6: { cellWidth: 28 },
      },
    });
  }

  const blob = doc.output("blob");
  const base64Data = await blobToBase64(blob);
  await invoke<string>("save_export_file", {
    input: {
      path,
      base64Data,
    },
  });
}
