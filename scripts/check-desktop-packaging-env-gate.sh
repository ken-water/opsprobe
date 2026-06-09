#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"
report_path="${repo_root}/.opsprobe-validation/development-env-report.json"

cd "${repo_root}"

npm run env:check:strict >/dev/null

node --input-type=module - <<'EOF' "${report_path}"
import fs from "node:fs";

const reportPath = process.argv[2];
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

const failures = [];

for (const name of ["node", "npm", "python3", "cargo", "rustc"]) {
  if (!report.toolchain[name]?.path) {
    failures.push(`missing required packaging toolchain command: ${name}`);
  }
}

for (const [label, value] of Object.entries({
  "xvfb-run": report.optionalTools.xvfbRunPath,
  dpkg: report.optionalTools.dpkgPath,
  rpm: report.optionalTools.rpmPath,
  "gtk-launch": report.optionalTools.gtkLaunchPath,
  "xdg-open": report.optionalTools.xdgOpenPath,
})) {
  if (!value) {
    failures.push(`missing packaging helper: ${label}`);
  }
}

if (!report.desktopPackaging.vendorPrepared) {
  failures.push("desktop Cargo vendor directory is missing; run npm run env:prepare:fast");
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[fail] ${failure}`);
  }
  process.exit(1);
}

console.log("[pass] desktop packaging environment gate passed");
console.log(`[pass] vendor dir: ${report.desktopPackaging.vendorDir}`);
console.log("[pass] Linux packaging helpers and vendored Cargo sources are ready");
EOF
