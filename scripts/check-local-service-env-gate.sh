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

for (const [name, details] of Object.entries(report.toolchain)) {
  if (!details?.path) {
    failures.push(`missing required toolchain command: ${name}`);
  }
}

if (!report.postgres.discoveredBinDir || !report.postgres.pgCtlPresent || !report.postgres.initdbPresent) {
  failures.push("managed PostgreSQL binaries are not fully discoverable");
}

if (report.localServiceStatusProbe.exitCode !== 0) {
  failures.push(`clean-profile local-service status probe failed with exit code ${report.localServiceStatusProbe.exitCode}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[fail] ${failure}`);
  }
  process.exit(1);
}

console.log("[pass] local-service environment gate passed");
console.log(`[pass] PostgreSQL bindir: ${report.postgres.discoveredBinDir}`);
console.log("[pass] clean-profile local-service status probe is healthy enough to continue");
EOF
