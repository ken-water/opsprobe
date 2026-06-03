import type { Asset, InspectionRun, InspectionTemplate } from "@opsprobe/core";

export interface StorageHealth {
  status: "pass" | "warning" | "critical";
  detail: string;
}

export interface StorageBootstrapResult {
  ok: boolean;
  detail: string;
}

export interface AssetRepository {
  list(): Promise<Asset[]>;
  upsert(asset: Asset): Promise<void>;
}

export interface TemplateRepository {
  list(): Promise<InspectionTemplate[]>;
}

export interface InspectionRunRepository {
  save(run: InspectionRun): Promise<void>;
  listRecent(limit: number): Promise<InspectionRun[]>;
}

export interface StorageAdapter {
  bootstrap(): Promise<StorageBootstrapResult>;
  health(): Promise<StorageHealth>;
  assets: AssetRepository;
  templates: TemplateRepository;
  inspectionRuns: InspectionRunRepository;
}

export class StubPostgresStorageAdapter implements StorageAdapter {
  readonly assets: AssetRepository = {
    async list() {
      return [];
    },
    async upsert() {
      return;
    },
  };

  readonly templates: TemplateRepository = {
    async list() {
      return [];
    },
  };

  readonly inspectionRuns: InspectionRunRepository = {
    async save() {
      return;
    },
    async listRecent() {
      return [];
    },
  };

  async bootstrap(): Promise<StorageBootstrapResult> {
    return {
      ok: true,
      detail: "PostgreSQL-first storage adapter stub is ready for 0.3.0 service integration.",
    };
  }

  async health(): Promise<StorageHealth> {
    return {
      status: "warning",
      detail: "Storage adapter is present but not connected to a managed PostgreSQL runtime yet.",
    };
  }
}
