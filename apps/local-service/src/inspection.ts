import { builtInLinuxChecks } from "@opsprobe/checks";
import {
  createLinuxHostTemplate,
  type Asset,
  type InspectionRun,
  type InspectionTask,
} from "@opsprobe/core";
import { runInspection, type RunnerAdapter, type SshConnectionTestResult } from "@opsprobe/runner";

interface InspectionRunStore {
  inspectionRuns: {
    save(run: InspectionRun): Promise<void>;
    listRecent(limit: number): Promise<InspectionRun[]>;
  };
}

export interface InspectionPreviewRequest {
  asset: Asset;
}

export interface InspectionPreviewResponse {
  ok: boolean;
  run: InspectionRun;
  source: "local-service";
}

export interface InspectionExecutionRequest {
  asset: Asset;
}

export interface InspectionExecutionResponse {
  ok: boolean;
  run: InspectionRun;
  source: "local-service";
}

export interface InspectionHistoryResponse {
  ok: boolean;
  runs: InspectionRun[];
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

function createInspectionTask(asset: Asset, taskId: string): InspectionTask {
  const template = createLinuxHostTemplate(builtInLinuxChecks);
  return {
    id: taskId,
    assetId: asset.id,
    templateId: template.id,
    trigger: "manual",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function buildRun(asset: Asset, taskId: string): Promise<InspectionRun> {
  const template = createLinuxHostTemplate(builtInLinuxChecks);
  const task = createInspectionTask(asset, taskId);

  return runInspection(
    {
      asset,
      task,
      template,
      checks: builtInLinuxChecks,
    },
    new LocalServicePreviewAdapter(),
  );
}

export async function buildInspectionPreview(
  request: InspectionPreviewRequest,
): Promise<InspectionPreviewResponse> {
  return {
    ok: true,
    run: await buildRun(request.asset, "task-local-service-preview"),
    source: "local-service",
  };
}

export async function buildInspectionExecution(
  request: InspectionExecutionRequest,
  storage: InspectionRunStore,
): Promise<InspectionExecutionResponse> {
  const run = await buildRun(request.asset, "task-local-service-run");
  await storage.inspectionRuns.save(run);

  return {
    ok: true,
    run,
    source: "local-service",
  };
}

export async function readInspectionHistory(
  storage: InspectionRunStore,
  limit = 5,
): Promise<InspectionHistoryResponse> {
  return {
    ok: true,
    runs: await storage.inspectionRuns.listRecent(limit),
    source: "local-service",
  };
}
