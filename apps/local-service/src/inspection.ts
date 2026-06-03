import { builtInLinuxChecks } from "@opsprobe/checks";
import {
  createLinuxHostTemplate,
  type Asset,
  type InspectionRun,
  type InspectionTask,
} from "@opsprobe/core";
import { runInspection, type RunnerAdapter, type SshConnectionTestResult } from "@opsprobe/runner";

export interface InspectionPreviewRequest {
  asset: Asset;
}

export interface InspectionPreviewResponse {
  ok: boolean;
  run: InspectionRun;
  source: "local-service";
}

class LocalServicePreviewAdapter implements RunnerAdapter {
  async testConnection(asset: Asset): Promise<SshConnectionTestResult> {
    return {
      ok: true,
      message: `Local service preview accepted ${asset.host}:${asset.port} for orchestration.`,
    };
  }
}

export async function buildInspectionPreview(
  request: InspectionPreviewRequest,
): Promise<InspectionPreviewResponse> {
  const template = createLinuxHostTemplate(builtInLinuxChecks);
  const task: InspectionTask = {
    id: "task-local-service-preview",
    assetId: request.asset.id,
    templateId: template.id,
    trigger: "manual",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const run = await runInspection(
    {
      asset: request.asset,
      task,
      template,
      checks: builtInLinuxChecks,
    },
    new LocalServicePreviewAdapter(),
  );

  return {
    ok: true,
    run,
    source: "local-service",
  };
}
