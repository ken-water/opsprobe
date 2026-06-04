import type { AssetKind, AssetProtocol, AuthenticationMethod, Timestamped } from "@opsprobe/shared";
import type { CheckDefinition, CheckResult } from "@opsprobe/checks";

export interface AssetCredential {
  method: AuthenticationMethod;
  username: string;
  secretRef: string;
  bindingStatus?: "linked" | "rebind-required";
}

export interface Asset extends Timestamped {
  id: string;
  name: string;
  kind: AssetKind;
  protocol: AssetProtocol;
  host: string;
  port: number;
  tags: string[];
  credential: AssetCredential;
}

export interface InspectionTemplate extends Timestamped {
  id: string;
  name: string;
  description?: string;
  assetKind: AssetKind;
  checkIds: string[];
}

export interface InspectionTask extends Timestamped {
  id: string;
  assetId: string;
  templateId: string;
  trigger: "manual" | "scheduled";
}

export interface InspectionRunSummary {
  total: number;
  passed: number;
  warning: number;
  critical: number;
  unknown: number;
}

export interface InspectionRun extends Timestamped {
  id: string;
  taskId: string;
  assetId: string;
  templateId: string;
  status: "completed" | "failed";
  results: CheckResult[];
  summary: InspectionRunSummary;
}

export interface InspectionTemplateInput {
  id: string;
  name: string;
  description?: string;
  assetKind: AssetKind;
  checkIds: string[];
}

export function createInspectionTemplate(input: InspectionTemplateInput): InspectionTemplate {
  const now = new Date().toISOString();

  return {
    ...input,
    createdAt: now,
    updatedAt: now,
  };
}

export function createLinuxHostTemplate(checks: CheckDefinition[]): InspectionTemplate {
  return createInspectionTemplate({
    id: "template.linux.default",
    name: "Linux Host Baseline",
    description: "Balanced Linux host baseline with capacity and state checks.",
    assetKind: "linux-host",
    checkIds: checks.map((check) => check.id),
  });
}

export function summarizeResults(results: CheckResult[]): InspectionRunSummary {
  return results.reduce<InspectionRunSummary>(
    (summary, result) => {
      summary.total += 1;
      if (result.status === "pass") {
        summary.passed += 1;
      } else if (result.status === "warning") {
        summary.warning += 1;
      } else if (result.status === "critical") {
        summary.critical += 1;
      } else {
        summary.unknown += 1;
      }
      return summary;
    },
    {
      total: 0,
      passed: 0,
      warning: 0,
      critical: 0,
      unknown: 0,
    },
  );
}
