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
        eyebrow="Target"
        title="Save this target"
        subtitle="Do this only after the first preview is already trustworthy."
        actions={
          <div className="service-actions">
            <button className="primary-button" onClick={onSaveCurrentAsset} type="button">
              Save Current Target
            </button>
            <button className="secondary-button" onClick={onRefreshSavedAssets} type="button">
              {isRefreshingAssets ? "Refreshing..." : "Refresh Saved Targets"}
            </button>
          </div>
        }
      />

      <div className="workflow-stack">
        <section className="runner-focus-grid">
          <div className="workflow-step-card runner-primary-card">
            <div className="workflow-step-header">
              <div>
                <span className="workflow-step-index">1</span>
                <strong>Save one working target</strong>
              </div>
              <span className="badge badge-unknown">{savedAssets.length} saved</span>
            </div>

            <section className="form-section">
              <div className="form-section-header">
                <strong>Saved target details</strong>
                <span>{asset.host}:{asset.port}</span>
              </div>
              <div className="ssh-grid">
                <label>
                  <span>Target Name</span>
                  <input
                    value={asset.name}
                    onChange={(event) => onPatchAsset({ name: event.target.value })}
                    placeholder="opsprobe-demo-host"
                  />
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

            <div className="inline-note">
              <strong>Current record</strong>
              <span>
                {asset.protocol.toUpperCase()} · updated {formatDateTime(asset.updatedAt)}
              </span>
            </div>

            <div className="helper-stack">
              <p className="helper-text">Only save after one SSH verification and one readable preview result already exist.</p>
            </div>
          </div>

          <div className="workflow-step-card runner-action-card">
            <div className="workflow-step-header">
              <div>
                <span className="workflow-step-index">2</span>
                <strong>Reuse a saved target</strong>
              </div>
              <span className="badge badge-unknown">{savedAssets.length} total</span>
            </div>

            <DesktopDataTable
              columns={[
                {
                  key: "name",
                  header: "Target",
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
                  header: "Host",
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
                        {savedAsset.credential.bindingStatus ? ` · ${formatStatusLabel(savedAsset.credential.bindingStatus)}` : ""}
                      </span>
                    </div>
                  ),
                },
              ]}
              rows={savedAssets}
              getRowKey={(savedAsset) => savedAsset.id}
              onRowClick={onLoadAsset}
              isRowActive={(savedAsset) => savedAsset.id === asset.id}
              isLoading={isRefreshingAssets}
              loadingTitle="Loading saved targets"
              loadingDetail="Fetching reusable targets from the local workspace."
              emptyTitle="No Saved Targets"
              emptyDetail="Save the current target after the first preview is proven."
            />
          </div>
        </section>

        <section className="workflow-step-card assets-transfer-card">
          <div className="workflow-step-header">
            <div>
              <span className="workflow-step-index">3</span>
              <strong>Move this setup later</strong>
            </div>
            <span className="badge badge-unknown">optional</span>
          </div>

          <section className="form-section">
            <div className="form-section-header">
              <strong>Transfer package</strong>
              <span>Secrets excluded</span>
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
                {isExportingConfig ? "Exporting..." : "Export Config"}
              </button>
              <button className="secondary-button" onClick={onImportConfig} type="button">
                {isImportingConfig ? "Importing..." : "Import Config"}
              </button>
            </div>
          </section>

          <div className="helper-stack">
            <p className="helper-text">Exported packages exclude secret values.</p>
            <p className="helper-text">After import, rebind credentials and rerun SSH verification before enabling schedules.</p>
          </div>
        </section>
      </div>
    </section>
  );
}
