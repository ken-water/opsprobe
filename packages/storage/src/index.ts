import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
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

interface FileStorageSnapshot {
  assets: Asset[];
  templates: InspectionTemplate[];
  inspectionRuns: InspectionRun[];
}

const EMPTY_FILE_STORAGE_SNAPSHOT: FileStorageSnapshot = {
  assets: [],
  templates: [],
  inspectionRuns: [],
};

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

export class LocalFileStorageAdapter implements StorageAdapter {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  readonly assets: AssetRepository = {
    list: async () => (await this.readSnapshot()).assets,
    upsert: async (asset) => {
      const snapshot = await this.readSnapshot();
      const nextAssets = snapshot.assets.filter((item) => item.id !== asset.id);
      nextAssets.push(asset);
      await this.writeSnapshot({
        ...snapshot,
        assets: nextAssets,
      });
    },
  };

  readonly templates: TemplateRepository = {
    list: async () => (await this.readSnapshot()).templates,
  };

  readonly inspectionRuns: InspectionRunRepository = {
    save: async (run) => {
      const snapshot = await this.readSnapshot();
      const nextRuns = snapshot.inspectionRuns.filter((item) => item.id !== run.id);
      nextRuns.unshift(run);
      await this.writeSnapshot({
        ...snapshot,
        inspectionRuns: nextRuns,
      });
    },
    listRecent: async (limit) => (await this.readSnapshot()).inspectionRuns.slice(0, limit),
  };

  async bootstrap(): Promise<StorageBootstrapResult> {
    await this.ensureFile();
    return {
      ok: true,
      detail: `Local file storage adapter is ready at ${this.filePath}.`,
    };
  }

  async health(): Promise<StorageHealth> {
    await this.ensureFile();
    return {
      status: "warning",
      detail:
        "Local service is using a transitional file-backed storage adapter until managed PostgreSQL is wired in.",
    };
  }

  private async ensureFile() {
    await mkdir(dirname(this.filePath), { recursive: true });

    try {
      await readFile(this.filePath, "utf8");
    } catch {
      await this.writeSnapshot(EMPTY_FILE_STORAGE_SNAPSHOT);
    }
  }

  private async readSnapshot(): Promise<FileStorageSnapshot> {
    await this.ensureFile();
    const raw = await readFile(this.filePath, "utf8");
    return JSON.parse(raw) as FileStorageSnapshot;
  }

  private async writeSnapshot(snapshot: FileStorageSnapshot) {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  }
}
