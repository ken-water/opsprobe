#!/usr/bin/env bash

set -euo pipefail

validation_dir=".opsprobe-validation"
mkdir -p "${validation_dir}"

version="$(node --input-type=module -e 'import fs from "node:fs"; const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); process.stdout.write(pkg.version);')"
app_src_dir="apps/desktop/src"
tauri_file="apps/desktop/src-tauri/src/lib.rs"
bundle_root="apps/desktop/src-tauri/target/release/bundle"
deb_path="${bundle_root}/deb/OpsProbe_${version}_amd64.deb"
rpm_path="${bundle_root}/rpm/OpsProbe-${version}-1.x86_64.rpm"
appimage_path="${bundle_root}/appimage/OpsProbe_${version}_amd64.AppImage"
appdir_path="${bundle_root}/appimage/OpsProbe.AppDir"

ui_actions=(
  "Readiness Summary"
  "Actionable Repair Packs"
  "First-Run Wizard"
  "Open Assets & Strategy"
  "Refresh Environment"
  "Refresh Service Status"
  "Start Service"
  "Stop Service"
  "Restart Service"
  "Bootstrap PostgreSQL"
  "Start PostgreSQL"
  "Stop PostgreSQL"
  "Save Current Asset"
  "Preview Inspection Results"
  "Run Through Local Service"
  "Export Local Config"
  "Import Local Config"
  "Open HTML File"
  "Show HTML In Folder"
  "Open PDF File"
  "Show PDF In Folder"
)

tauri_commands=(
  "get_local_service_status"
  "start_local_service"
  "stop_local_service"
  "restart_local_service"
  "bootstrap_local_service_postgres"
  "start_local_service_postgres"
  "stop_local_service_postgres"
  "upsert_local_service_asset"
  "get_local_service_inspection_preview"
  "run_local_service_inspection"
  "export_local_service_config"
  "import_local_service_config"
  "export_local_service_html_report"
  "save_export_file"
  "open_export_path"
  "reveal_export_path"
)

for action in "${ui_actions[@]}"; do
  rg -F "${action}" "${app_src_dir}" >/dev/null
done

for command in "${tauri_commands[@]}"; do
  rg -F "fn ${command}" "${tauri_file}" >/dev/null
done

test -f "${deb_path}"
test -f "${rpm_path}"
test -f "${appimage_path}"
test -d "${appdir_path}"

node --input-type=module - <<'EOF' > "${validation_dir}/desktop-operator-walkthrough.json"
import fs from "node:fs";

const rootPkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const appSrcDir = "apps/desktop/src";
const tauriFile = "apps/desktop/src-tauri/src/lib.rs";
const bundleRoot = "apps/desktop/src-tauri/target/release/bundle";
const version = rootPkg.version;

const uiActions = [
  "Readiness Summary",
  "Actionable Repair Packs",
  "First-Run Wizard",
  "Open Assets & Strategy",
  "Refresh Environment",
  "Refresh Service Status",
  "Start Service",
  "Stop Service",
  "Restart Service",
  "Bootstrap PostgreSQL",
  "Start PostgreSQL",
  "Stop PostgreSQL",
  "Save Current Asset",
  "Preview Inspection Results",
  "Run Through Local Service",
  "Export Local Config",
  "Import Local Config",
  "Open HTML File",
  "Show HTML In Folder",
  "Open PDF File",
  "Show PDF In Folder",
];

const tauriCommands = [
  "get_local_service_status",
  "start_local_service",
  "stop_local_service",
  "restart_local_service",
  "bootstrap_local_service_postgres",
  "start_local_service_postgres",
  "stop_local_service_postgres",
  "upsert_local_service_asset",
  "get_local_service_inspection_preview",
  "run_local_service_inspection",
  "export_local_service_config",
  "import_local_service_config",
  "export_local_service_html_report",
  "save_export_file",
  "open_export_path",
  "reveal_export_path",
];

const appSourceFiles = fs
  .readdirSync(appSrcDir, { recursive: true })
  .filter((entry) => typeof entry === "string" && entry.endsWith(".tsx"))
  .map((entry) => `${appSrcDir}/${entry}`);
const appSource = appSourceFiles
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
const tauriSource = fs.readFileSync(tauriFile, "utf8");

const output = {
  validatedAt: new Date().toISOString(),
  script: "scripts/validate-desktop-operator-walkthrough.sh",
  version,
  appSourceFiles,
  tauriFile,
  bundleArtifacts: {
    deb: {
      path: `${bundleRoot}/deb/OpsProbe_${version}_amd64.deb`,
      present: fs.existsSync(`${bundleRoot}/deb/OpsProbe_${version}_amd64.deb`),
    },
    rpm: {
      path: `${bundleRoot}/rpm/OpsProbe-${version}-1.x86_64.rpm`,
      present: fs.existsSync(`${bundleRoot}/rpm/OpsProbe-${version}-1.x86_64.rpm`),
    },
    appImage: {
      path: `${bundleRoot}/appimage/OpsProbe_${version}_amd64.AppImage`,
      present: fs.existsSync(`${bundleRoot}/appimage/OpsProbe_${version}_amd64.AppImage`),
    },
    appDir: {
      path: `${bundleRoot}/appimage/OpsProbe.AppDir`,
      present: fs.existsSync(`${bundleRoot}/appimage/OpsProbe.AppDir`),
    },
  },
  uiActions: uiActions.map((label) => ({
    label,
    present: appSource.includes(label),
  })),
  tauriCommands: tauriCommands.map((name) => ({
    name,
    present: tauriSource.includes(`fn ${name}`),
  })),
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
EOF
