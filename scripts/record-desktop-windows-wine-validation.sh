#!/usr/bin/env bash

set -euo pipefail

validation_dir=".opsprobe-validation"
mkdir -p "${validation_dir}"

version="$(node --input-type=module -e 'import fs from "node:fs"; const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); process.stdout.write(pkg.version);')"
target_triple="${1:-x86_64-pc-windows-gnu}"
target_root="apps/desktop/src-tauri/target/${target_triple}/release"
installer_path="${target_root}/bundle/nsis/OpsProbe_${version}_x64-setup.exe"

wine_path=""
if command -v wine >/dev/null 2>&1; then
  wine_path="$(command -v wine)"
fi

wine_launch_status="not-attempted"
wine_launch_detail="Wine is not installed on this machine."

if [[ -n "${wine_path}" ]]; then
  if [[ -f "${installer_path}" ]]; then
    wine_output="$(mktemp)"
    set +e
    timeout 15s "${wine_path}" "${installer_path}" >/tmp/opsprobe-wine-stdout.log 2>"${wine_output}"
    wine_exit="$?"
    set -e

    if [[ "${wine_exit}" == "124" ]]; then
      wine_launch_status="started"
      wine_launch_detail="Installer stayed alive long enough under Wine to count as a launch attempt."
    elif [[ "${wine_exit}" == "0" ]]; then
      wine_launch_status="exited"
      wine_launch_detail="Installer exited cleanly under Wine."
    else
      wine_launch_status="failed"
      wine_launch_detail="$(tr '\n' ' ' < "${wine_output}" | sed 's/  */ /g' | cut -c1-400)"
      if [[ -z "${wine_launch_detail}" ]]; then
        wine_launch_detail="Wine launch failed without captured stderr detail."
      fi
    fi

    rm -f "${wine_output}" /tmp/opsprobe-wine-stdout.log
  else
    wine_launch_status="blocked"
    wine_launch_detail="Current-version NSIS installer is missing, so Wine launch could not be attempted."
  fi
fi

TARGET_TRIPLE="${target_triple}" \
INSTALLER_PATH="${installer_path}" \
WINE_PATH="${wine_path}" \
WINE_LAUNCH_STATUS="${wine_launch_status}" \
WINE_LAUNCH_DETAIL="${wine_launch_detail}" \
node --input-type=module - <<'EOF' > "${validation_dir}/desktop-windows-wine-validation-record.json"
import fs from "node:fs";

const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
const targetTriple = process.env.TARGET_TRIPLE;
const installerPath = process.env.INSTALLER_PATH;

function exists(path) {
  return fs.existsSync(path);
}

const blockers = [];

if (!exists(installerPath)) {
  blockers.push(`Missing NSIS installer for Wine launch validation: ${installerPath}`);
}

if (!process.env.WINE_PATH) {
  blockers.push("Wine is not installed on this machine.");
}

const output = {
  validatedAt: new Date().toISOString(),
  script: "scripts/record-desktop-windows-wine-validation.sh",
  version,
  targetTriple,
  environment: {
    winePath: process.env.WINE_PATH || null,
  },
  artifacts: {
    nsisInstaller: {
      path: installerPath,
      present: exists(installerPath),
    },
  },
  wineLaunch: {
    status: process.env.WINE_LAUNCH_STATUS,
    detail: process.env.WINE_LAUNCH_DETAIL,
  },
  wineValidationReady: {
    ready: process.env.WINE_LAUNCH_STATUS === "started" || process.env.WINE_LAUNCH_STATUS === "exited",
    blockers,
    nextAction:
      process.env.WINE_LAUNCH_STATUS === "started" || process.env.WINE_LAUNCH_STATUS === "exited"
        ? "Review the Wine launch result and then prefer a real Windows install validation for stronger evidence."
        : "Install Wine or move the installer to a Windows-capable environment for actual launch validation.",
  },
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
EOF

node --input-type=module - <<'EOF' > "${validation_dir}/desktop-windows-wine-validation-record.md"
import fs from "node:fs";

const record = JSON.parse(fs.readFileSync(".opsprobe-validation/desktop-windows-wine-validation-record.json", "utf8"));

const lines = [
  "# Desktop Windows Wine Validation Record",
  "",
  `Captured at: ${record.validatedAt}`,
  "",
  `Version: ${record.version}`,
  `Target: ${record.targetTriple}`,
  "",
  "## Installer",
  "",
  `- NSIS installer: ${record.artifacts.nsisInstaller.present ? "present" : "missing"} (${record.artifacts.nsisInstaller.path})`,
  "",
  "## Wine Launch",
  "",
  `- status: ${record.wineLaunch.status}`,
  `- detail: ${record.wineLaunch.detail}`,
  "",
  "## Readiness",
  "",
  `- ready: ${record.wineValidationReady.ready ? "yes" : "no"}`,
];

if (record.wineValidationReady.blockers.length > 0) {
  lines.push("", "## Blockers", "");
  for (const blocker of record.wineValidationReady.blockers) {
    lines.push(`- ${blocker}`);
  }
}

lines.push("", "## Next Action", "", `- ${record.wineValidationReady.nextAction}`, "");

process.stdout.write(lines.join("\n"));
EOF
