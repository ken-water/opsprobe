import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { Pool } from "pg";
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

export interface PostgresStorageConfig {
  database: string;
  host: string;
  port: number;
  user: string;
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

function serializeRun(run: InspectionRun) {
  return JSON.stringify(run);
}

function deserializeRun(raw: string) {
  return JSON.parse(raw) as InspectionRun;
}

export class PostgresStorageAdapter implements StorageAdapter {
  private readonly pool: Pool;
  private readonly config: PostgresStorageConfig;

  constructor(config: PostgresStorageConfig) {
    this.config = config;
    this.pool = new Pool({
      database: config.database,
      host: config.host,
      port: config.port,
      user: config.user,
    });
  }

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
    save: async (run) => {
      await this.pool.query(
        `
          insert into opsprobe_inspection_runs (
            id,
            task_id,
            asset_id,
            template_id,
            status,
            created_at,
            updated_at,
            payload
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
          on conflict (id) do update set
            task_id = excluded.task_id,
            asset_id = excluded.asset_id,
            template_id = excluded.template_id,
            status = excluded.status,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            payload = excluded.payload
        `,
        [
          run.id,
          run.taskId,
          run.assetId,
          run.templateId,
          run.status,
          run.createdAt,
          run.updatedAt,
          serializeRun(run),
        ],
      );
    },
    listRecent: async (limit) => {
      const result = await this.pool.query<{ payload: InspectionRun }>(
        `
          select payload
          from opsprobe_inspection_runs
          order by created_at desc
          limit $1
        `,
        [limit],
      );

      return result.rows.map((row) =>
        typeof row.payload === "string" ? deserializeRun(row.payload) : (row.payload as InspectionRun),
      );
    },
  };

  async bootstrap(): Promise<StorageBootstrapResult> {
    await this.pool.query(`
      create table if not exists opsprobe_inspection_runs (
        id text primary key,
        task_id text not null,
        asset_id text not null,
        template_id text not null,
        status text not null,
        created_at timestamptz not null,
        updated_at timestamptz not null,
        payload jsonb not null
      )
    `);

    await this.pool.query(`
      create index if not exists idx_opsprobe_inspection_runs_created_at
      on opsprobe_inspection_runs (created_at desc)
    `);

    return {
      ok: true,
      detail: `PostgreSQL storage adapter is ready on ${this.config.host}:${this.config.port}/${this.config.database}.`,
    };
  }

  async health(): Promise<StorageHealth> {
    try {
      await this.pool.query("select 1");
      return {
        status: "pass",
        detail: `PostgreSQL storage is reachable on ${this.config.host}:${this.config.port}/${this.config.database}.`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown PostgreSQL storage failure.";
      return {
        status: "critical",
        detail: message,
      };
    }
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
