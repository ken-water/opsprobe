#!/usr/bin/env bash

set -euo pipefail

validation_dir=".opsprobe-validation"
mkdir -p "${validation_dir}"

app_file="apps/desktop/src/App.tsx"
tauri_file="apps/desktop/src-tauri/src/lib.rs"

ui_actions=(
  "Refresh Service Status"
  "Start Service"
  "Stop Service"
  "Restart Service"
  "Bootstrap PostgreSQL"
  "Start PostgreSQL"
  "Stop PostgreSQL"
  "Save Current Asset"
  "Refresh Service Preview"
  "Run Through Local Service"
  "Export Local Config"
  "Import Local Config"
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
)

for action in "${ui_actions[@]}"; do
  rg -F "${action}" "${app_file}" >/dev/null
done

for command in "${tauri_commands[@]}"; do
  rg -F "fn ${command}" "${tauri_file}" >/dev/null
done

node --input-type=module - <<'EOF' > "${validation_dir}/desktop-operator-walkthrough.json"
import fs from "node:fs";

const appFile = "apps/desktop/src/App.tsx";
const tauriFile = "apps/desktop/src-tauri/src/lib.rs";

const uiActions = [
  "Refresh Service Status",
  "Start Service",
  "Stop Service",
  "Restart Service",
  "Bootstrap PostgreSQL",
  "Start PostgreSQL",
  "Stop PostgreSQL",
  "Save Current Asset",
  "Refresh Service Preview",
  "Run Through Local Service",
  "Export Local Config",
  "Import Local Config",
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
];

const appSource = fs.readFileSync(appFile, "utf8");
const tauriSource = fs.readFileSync(tauriFile, "utf8");

const output = {
  validatedAt: new Date().toISOString(),
  script: "scripts/validate-desktop-operator-walkthrough.sh",
  appFile,
  tauriFile,
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
