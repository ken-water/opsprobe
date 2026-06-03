import type { Asset, InspectionRun, InspectionTask, InspectionTemplate } from "@opsprobe/core";
import { summarizeResults } from "@opsprobe/core";
import type { CheckDefinition, CheckResult } from "@opsprobe/checks";

export interface RunnerAdapter {
  testConnection(asset: Asset): Promise<{ ok: boolean; message: string }>;
}

export interface RunInspectionInput {
  asset: Asset;
  task: InspectionTask;
  template: InspectionTemplate;
  checks: CheckDefinition[];
}

export class MockRunnerAdapter implements RunnerAdapter {
  async testConnection(asset: Asset) {
    return {
      ok: true,
      message: `Mock SSH connectivity to ${asset.host}:${asset.port} succeeded.`,
    };
  }
}

export async function runInspection(
  input: RunInspectionInput,
  adapter: RunnerAdapter,
): Promise<InspectionRun> {
  const connection = await adapter.testConnection(input.asset);
  const now = new Date().toISOString();

  let results: CheckResult[] = [];
  let status: InspectionRun["status"] = "completed";

  if (connection.ok) {
    results = await Promise.all(
      input.checks.map((check) =>
        check.run({
          assetId: input.asset.id,
          assetName: input.asset.name,
          protocol: input.asset.protocol,
          collectedAt: now,
        }),
      ),
    );
  } else {
    status = "failed";
  }

  return {
    id: `run-${input.task.id}`,
    taskId: input.task.id,
    assetId: input.asset.id,
    templateId: input.template.id,
    status,
    results,
    summary: summarizeResults(results),
    createdAt: now,
    updatedAt: now,
  };
}
