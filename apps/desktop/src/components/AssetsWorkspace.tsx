import type { Asset } from "@opsprobe/core";
import type { SshConnectionTestInput } from "@opsprobe/runner";

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
      <div className="panel-header">
        <div>
          <p className="eyebrow">0.10.3 Current Release</p>
          <h2>Assets And Migration</h2>
        </div>
        <div className="service-actions">
          <button className="secondary-button" onClick={onRefreshSavedAssets} type="button">
            {isRefreshingAssets ? "Refreshing..." : "Refresh Saved Assets"}
          </button>
          <button className="primary-button" onClick={onSaveCurrentAsset} type="button">
            Save Current Asset
          </button>
        </div>
      </div>

      <div className="assets-workspace">
        <div className="assets-list-panel">
          <div className="assets-panel-header">
            <strong>Saved Assets</strong>
            <span>{savedAssets.length} total</span>
          </div>
          {savedAssets.length > 0 ? (
            <div className="assets-list">
              {savedAssets.map((savedAsset) => (
                <button
                  className={`assets-list-item ${savedAsset.id === asset.id ? "assets-list-item-active" : ""}`}
                  key={`asset-${savedAsset.id}`}
                  onClick={() => onLoadAsset(savedAsset)}
                  type="button"
                >
                  <div className="history-list-top">
                    <strong>{savedAsset.name}</strong>
                    <span className={`badge badge-${savedAsset.id === asset.id ? "pass" : "unknown"}`}>
                      {savedAsset.id === asset.id ? "active" : "saved"}
                    </span>
                  </div>
                  <p>{savedAsset.id}</p>
                  <p>{savedAsset.host}:{savedAsset.port}</p>
                  <p>
                    {savedAsset.credential.method} / {savedAsset.credential.username}
                    {savedAsset.credential.bindingStatus ? ` / ${savedAsset.credential.bindingStatus}` : ""}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="history-empty-state">
              <strong>No Saved Assets</strong>
              <p>Save the current asset to reuse it, migrate it, or schedule recurring inspections.</p>
            </div>
          )}
        </div>

        <div className="assets-detail-panel">
          <div className="history-detail-card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Active Asset</p>
                <h2>{asset.name}</h2>
              </div>
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

            <label className="field-block">
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

            <div className="service-checks">
              <article className="service-card">
                <div className="service-card-header">
                  <strong>Migration Package</strong>
                  <span className="badge badge-pass">portable</span>
                </div>
                <label className="field-block">
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
              </article>
            </div>

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
    </section>
  );
}
