#!/usr/bin/env bash

set -euo pipefail

validation_dir=".opsprobe-validation"
mkdir -p "${validation_dir}"

version="$(node --input-type=module -e 'import fs from "node:fs"; const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); process.stdout.write(pkg.version);')"
appimage_path="apps/desktop/src-tauri/target/release/bundle/appimage/OpsProbe_${version}_amd64.AppImage"

if ! command -v xvfb-run >/dev/null 2>&1; then
  echo "xvfb-run is required for packaged launch smoke validation" >&2
  exit 1
fi

test -f "${appimage_path}"
chmod +x "${appimage_path}"

log_file="$(mktemp)"
status="unknown"
pid=""

cleanup() {
  if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
    kill "${pid}" 2>/dev/null || true
    wait "${pid}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

xvfb-run -a "${appimage_path}" >"${log_file}" 2>&1 &
pid="$!"

sleep 10

if kill -0 "${pid}" 2>/dev/null; then
  status="running"
else
  status="exited"
fi

cleanup
trap - EXIT

STATUS="${status}" VERSION="${version}" APPIMAGE_PATH="${appimage_path}" LOG_FILE="${log_file}" node --input-type=module - <<'EOF' > "${validation_dir}/desktop-packaged-launch-smoke.json"
import fs from "node:fs";

const logFile = process.env.LOG_FILE;
const log = fs.readFileSync(logFile, "utf8");
const status = process.env.STATUS;

const output = {
  validatedAt: new Date().toISOString(),
  script: "scripts/validate-desktop-packaged-launch-smoke.sh",
  version: process.env.VERSION,
  appImagePath: process.env.APPIMAGE_PATH,
  status,
  launchHeldForTenSeconds: status === "running",
  warnings: log
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean),
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
EOF

rm -f "${log_file}"

if [[ "${status}" != "running" ]]; then
  echo "packaged launch smoke failed: app did not stay alive for 10 seconds" >&2
  exit 1
fi
