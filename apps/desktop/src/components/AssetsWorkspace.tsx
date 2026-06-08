import type { Asset } from "@opsprobe/core";

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
}: AssetsWorkspaceProps) {
  return (
    <section className="run-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">0.10.3 Current Release</p>
          <h2>Machine Migration</h2>
        </div>
        <div className="service-actions">
          <button className="secondary-button" onClick={onRefreshSavedAssets} type="button">
            {isRefreshingAssets ? "Refreshing..." : "Refresh Saved Assets"}
          </button>
          <button className="secondary-button" onClick={onSaveCurrentAsset} type="button">
            Save Current Asset
          </button>
        </div>
      </div>

      <div className="ssh-grid">
        <label>
          <span>Migration File</span>
          <input
            value={migrationPath}
            onChange={(event) => onMigrationPathChange(event.target.value)}
            placeholder="/tmp/opsprobe-config.json"
          />
        </label>
      </div>

      <div className="service-actions">
        <button className="primary-button" onClick={onExportConfig} type="button">
          {isExportingConfig ? "Exporting..." : "Export Local Config"}
        </button>
        <button className="secondary-button" onClick={onImportConfig} type="button">
          {isImportingConfig ? "Importing..." : "Import Local Config"}
        </button>
      </div>

      <p className="helper-text">
        Exported packages exclude secret values. Imported assets are marked for credential rebind
        before use on the new machine. After rebinding, run a successful SSH test before resuming schedules.
      </p>
      <p className="helper-text">
        The export package now records which machine created it, so import review can confirm source context before trusting the migrated runtime state.
      </p>

      {savedAssets.length > 0 ? (
        <div className="service-checks">
          {savedAssets.map((savedAsset) => (
            <article className="service-card" key={`asset-${savedAsset.id}`}>
              <div className="service-card-header">
                <strong>{savedAsset.name}</strong>
                <span className={`badge badge-${savedAsset.id === asset.id ? "pass" : "unknown"}`}>
                  {savedAsset.id === asset.id ? "active" : "saved"}
                </span>
              </div>
              <p>
                {savedAsset.id} · {savedAsset.host}:{savedAsset.port}
              </p>
              <p>
                Credential: {savedAsset.credential.method} / {savedAsset.credential.username}
                {savedAsset.credential.bindingStatus ? ` / ${savedAsset.credential.bindingStatus}` : ""}
              </p>
              <div className="service-actions">
                <button
                  className="secondary-button"
                  onClick={() => onLoadAsset(savedAsset)}
                  type="button"
                >
                  Load Asset
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="helper-text">No saved assets yet. Save the current asset before exporting.</p>
      )}
    </section>
  );
}
