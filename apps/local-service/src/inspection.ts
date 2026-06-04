import { builtInLinuxChecks } from "@opsprobe/checks";
import {
  createLinuxHostTemplate,
  type Asset,
  type InspectionRun,
  type InspectionTask,
} from "@opsprobe/core";
import { runInspection, type RunnerAdapter } from "@opsprobe/runner";
import { LocalServicePreviewAdapter, LocalServiceSshRunnerAdapter } from "./ssh.ts";
import type {
  InspectionExecutionRequest,
  InspectionExecutionResponse,
  LocalServiceInspectionHistoryRequest,
  InspectionPreviewRequest,
  InspectionPreviewResponse,
  LocalServiceInspectionHistoryResponse,
} from "./protocol.ts";

interface InspectionRunStore {
  inspectionRuns: {
    save(run: InspectionRun): Promise<void>;
    listRecent(limit: number): Promise<InspectionRun[]>;
  };
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

function createTaskId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

async function buildRun(
  asset: Asset,
  taskId: string,
  adapter: RunnerAdapter,
): Promise<InspectionRun> {
  const template = createLinuxHostTemplate(builtInLinuxChecks);
  const task = createInspectionTask(asset, taskId);

  return runInspection(
    {
      asset,
      task,
      template,
      checks: builtInLinuxChecks,
    },
    adapter,
  );
}

export async function buildInspectionPreview(
  request: InspectionPreviewRequest,
): Promise<InspectionPreviewResponse> {
  return {
    ok: true,
    run: await buildRun(
      request.asset,
      createTaskId("task-local-service-preview"),
      new LocalServicePreviewAdapter(),
    ),
    source: "local-service",
  };
}

export async function buildInspectionExecution(
  request: InspectionExecutionRequest,
  storage: InspectionRunStore,
): Promise<InspectionExecutionResponse> {
  const run = await buildRun(
    request.asset,
    createTaskId("task-local-service-run"),
    new LocalServiceSshRunnerAdapter(),
  );
  await storage.inspectionRuns.save(run);

  return {
    ok: true,
    run,
    source: "local-service",
  };
}

export async function readInspectionHistory(
  storage: InspectionRunStore,
  request: LocalServiceInspectionHistoryRequest = {},
): Promise<LocalServiceInspectionHistoryResponse> {
  const limit = request.limit ?? 20;
  const candidateRuns = await storage.inspectionRuns.listRecent(Math.max(limit, 200));
  const filteredRuns = candidateRuns.filter((run) => {
    if (request.assetId && run.assetId !== request.assetId) {
      return false;
    }

    if (request.dateFrom && run.createdAt < request.dateFrom) {
      return false;
    }

    if (request.dateTo && run.createdAt > request.dateTo) {
      return false;
    }

    return true;
  });

  return {
    ok: true,
    runs: filteredRuns.slice(0, limit),
    source: "local-service",
  };
}
