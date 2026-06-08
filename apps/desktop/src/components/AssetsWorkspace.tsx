import type { Asset } from "@opsprobe/core";
import type { SshConnectionTestInput } from "@opsprobe/runner";
import { DesktopDataTable, DesktopSectionHeader, formatDateTime, formatStatusLabel } from "./DesktopUI";

interface AssetsWorkspaceProps {
  asset: Asset;
  savedAssets: Asset[];
  migrationPath: string;
  isRefreshingAssets: boolean;
  isExportingConfig: boolean;
  isImportingConfig: boolean;
  onMigrationPathChange: (value: string) => void;
  onRefreshSavedAssets: () => void;
  onSaveCurrentAsset: () => void;
  onExportConfig: () => void;
  onImportConfig: () => void;
  onLoadAsset: (asset: Asset) => void;
  onPatchAsset: (patch: Partial<Asset>) => void;
  onPatchCredential: (patch: Partial<Asset["credential"]>) => void;
}

export function AssetsWorkspace({
  asset,
  savedAssets,
  migrationPath,
  isRefreshingAssets,
  isExportingConfig,
  isImportingConfig,
  onMigrationPathChange,
  onRefreshSavedAssets,
  onSaveCurrentAsset,
  onExportConfig,
  onImportConfig,
  onLoadAsset,
  onPatchAsset,
  onPatchCredential,
}: AssetsWorkspaceProps) {
  return (
    <section className="run-panel">
      <DesktopSectionHeader
        eyebrow="Assets & Strategy"
        title="Saved Targets And Transfer"
        subtitle="Capture reusable targets locally, then move non-secret inspection state between machines without exposing credentials."
        actions={
          <div className="service-actions">
            <button className="secondary-button" onClick={onRefreshSavedAssets} type="button">
              {isRefreshingAssets ? "Refreshing..." : "Refresh Saved Assets"}
            </button>
            <button className="primary-button" onClick={onSaveCurrentAsset} type="button">
              Save Current Asset
            </button>
          </div>
        }
      />

      <div className="assets-workspace">
        <div className="assets-list-panel">
          <div className="assets-panel-header">
            <strong>Saved Assets</strong>
            <span>{savedAssets.length} total</span>
          </div>
          <DesktopDataTable
            columns={[
              {
                key: "name",
                header: "Asset",
                width: "minmax(220px, 1.4fr)",
                render: (savedAsset) => (
                  <div className="data-table-primary">
                    <strong>{savedAsset.name}</strong>
                    <span>{savedAsset.id}</span>
                  </div>
                ),
              },
              {
                key: "target",
                header: "Target",
                width: "minmax(160px, 1fr)",
                render: (savedAsset) => `${savedAsset.host}:${savedAsset.port}`,
              },
              {
                key: "auth",
                header: "Credential",
                width: "minmax(220px, 1.3fr)",
                render: (savedAsset) => (
                  <div className="data-table-primary">
                    <strong>{formatStatusLabel(savedAsset.credential.method)}</strong>
                    <span>
                      {savedAsset.credential.username}
                      {savedAsset.credential.bindingStatus
                        ? ` · ${formatStatusLabel(savedAsset.credential.bindingStatus)}`
                        : ""}
                    </span>
                  </div>
                ),
              },
              {
                key: "updated",
                header: "Updated",
                width: "minmax(140px, 0.9fr)",
                render: (savedAsset) => formatDateTime(savedAsset.updatedAt),
              },
            ]}
            rows={savedAssets}
            getRowKey={(savedAsset) => savedAsset.id}
            onRowClick={onLoadAsset}
            isRowActive={(savedAsset) => savedAsset.id === asset.id}
            emptyTitle="No Saved Assets"
            emptyDetail="Save the current asset to reuse it, migrate it, or schedule recurring inspections."
          />
        </div>

        <div className="assets-detail-panel">
          <div className="history-detail-card">
            <DesktopSectionHeader
              eyebrow="Asset Editor"
              title={asset.name}
              subtitle="Edit the active host record, authentication binding, and migration package path from one place."
              meta={
                <div className="summary-strip">
                  <span>{asset.protocol.toUpperCase()}</span>
                  <span>{formatDateTime(asset.updatedAt)}</span>
                </div>
              }
            />

            <section className="form-section">
              <div className="form-section-header">
                <strong>Target Record</strong>
                <span>{asset.host}:{asset.port}</span>
              </div>
              <div className="ssh-grid">
                <label>
                  <span>Asset Name</span>
                  <input
                    value={asset.name}
                    onChange={(event) => onPatchAsset({ name: event.target.value })}
                    placeholder="opsprobe-demo-host"
                  />
                </label>
                <label>
                  <span>Host</span>
                  <input
                    value={asset.host}
                    onChange={(event) => onPatchAsset({ host: event.target.value })}
                    placeholder="10.0.0.12"
                  />
                </label>
                <label>
                  <span>Port</span>
                  <input
                    type="number"
                    value={asset.port}
                    onChange={(event) => onPatchAsset({ port: Number(event.target.value) || 22 })}
                    placeholder="22"
                  />
                </label>
                <label>
                  <span>Username</span>
                  <input
                    value={asset.credential.username}
                    onChange={(event) => onPatchCredential({ username: event.target.value })}
                    placeholder="root"
                  />
                </label>
                <label>
                  <span>Auth Method</span>
                  <select
                    value={asset.credential.method}
                    onChange={(event) =>
                      onPatchCredential({
                        method: event.target.value as SshConnectionTestInput["authMethod"],
                      })
                    }
                  >
                    <option value="private-key">private-key</option>
                    <option value="password">password</option>
                  </select>
                </label>
                <label>
                  <span>Tags</span>
                  <input
                    value={asset.tags.join(", ")}
                    onChange={(event) =>
                      onPatchAsset({
                        tags: event.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="demo, linux"
                  />
                </label>
              </div>
              <label className="field-block field-block-inline">
                <span>{asset.credential.method === "private-key" ? "Private Key Path" : "Password Secret"}</span>
                <input
                  type={asset.credential.method === "password" ? "password" : "text"}
                  value={asset.credential.secretRef}
                  onChange={(event) => onPatchCredential({ secretRef: event.target.value })}
                  placeholder={
                    asset.credential.method === "private-key"
                      ? "/home/user/.ssh/id_rsa"
                      : "Enter the SSH password used for this host."
                  }
                />
              </label>
            </section>

            <section className="form-section">
              <div className="form-section-header">
                <strong>Migration Package</strong>
                <span>Portable bundle</span>
              </div>
              <label className="field-block field-block-inline">
                <span>Migration File</span>
                <input
                  value={migrationPath}
                  onChange={(event) => onMigrationPathChange(event.target.value)}
                  placeholder="/tmp/opsprobe-config.json"
                />
              </label>
              <div className="service-actions">
                <button className="primary-button" onClick={onExportConfig} type="button">
                  {isExportingConfig ? "Exporting..." : "Export Local Config"}
                </button>
                <button className="secondary-button" onClick={onImportConfig} type="button">
                  {isImportingConfig ? "Importing..." : "Import Local Config"}
                </button>
              </div>
            </section>

            <div className="helper-stack">
              <p className="helper-text">
                Exported packages exclude secret values. Imported assets are marked for credential rebind
                before use on the new machine. After rebinding, run a successful SSH test before resuming schedules.
              </p>
              <p className="helper-text">
                The export package now records which machine created it, so import review can confirm source context before trusting the migrated runtime state.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
