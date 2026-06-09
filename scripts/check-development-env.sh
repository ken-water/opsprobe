#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"
validation_dir="${repo_root}/.opsprobe-validation"
json_report="${validation_dir}/development-env-report.json"
markdown_report="${validation_dir}/development-env-report.md"
strict_mode="false"

usage() {
  cat <<'EOF'
usage: ./scripts/check-development-env.sh [--strict]

Checks the local OpsProbe development environment and writes structured reports.

Use `--strict` when missing prerequisites should fail the current workflow.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --strict)
      strict_mode="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

mkdir -p "${validation_dir}"

failures=0

pass() {
  echo "[pass] $1"
}

warn() {
  echo "[warn] $1"
  if [[ "${strict_mode}" == "true" ]]; then
    failures=$((failures + 1))
  fi
}

info() {
  echo "[info] $1"
}

discover_postgres_bin_dir() {
  local candidate=""
  local -a candidates=()

  if command -v pg_config >/dev/null 2>&1; then
    candidates+=("$(pg_config --bindir)")
  fi

  if command -v pg_ctl >/dev/null 2>&1; then
    candidates+=("$(cd "$(dirname "$(command -v pg_ctl)")" && pwd)")
  fi

  shopt -s nullglob
  local dirs=(/usr/lib/postgresql/*/bin)
  shopt -u nullglob
  if [[ ${#dirs[@]} -gt 0 ]]; then
    candidates+=("${dirs[@]}")
  fi

  if command -v psql >/dev/null 2>&1; then
    candidates+=("$(cd "$(dirname "$(command -v psql)")" && pwd)")
  fi

  for possible_dir in "${candidates[@]}"; do
    if [[ -x "${possible_dir}/pg_ctl" && -x "${possible_dir}/initdb" ]]; then
      candidate="${possible_dir}"
      break
    fi
  done

  printf '%s' "${candidate}"
}

run_clean_status_probe() {
  local temp_home
  temp_home="$(mktemp -d)"
  trap 'rm -rf "${temp_home}"' RETURN

  (
    cd "${repo_root}"
    HOME="${temp_home}" npm run local-service:status
  )
}

cd "${repo_root}"

node_path="$(command -v node || true)"
npm_path="$(command -v npm || true)"
python3_path="$(command -v python3 || true)"
cargo_path="$(command -v cargo || true)"
rustc_path="$(command -v rustc || true)"
psql_path="$(command -v psql || true)"
xvfb_path="$(command -v xvfb-run || true)"
dpkg_path="$(command -v dpkg || true)"
rpm_path="$(command -v rpm || true)"
gtk_launch_path="$(command -v gtk-launch || true)"
postgres_bin_dir="$(discover_postgres_bin_dir)"

if [[ -n "${node_path}" ]]; then
  pass "node is available at ${node_path}"
else
  warn "node is missing"
fi

if [[ -n "${npm_path}" ]]; then
  pass "npm is available at ${npm_path}"
else
  warn "npm is missing"
fi

if [[ -n "${python3_path}" ]]; then
  pass "python3 is available at ${python3_path}"
else
  warn "python3 is missing"
fi

if [[ -n "${cargo_path}" ]]; then
  pass "cargo is available at ${cargo_path}"
else
  warn "cargo is missing"
fi

if [[ -n "${rustc_path}" ]]; then
  pass "rustc is available at ${rustc_path}"
else
  warn "rustc is missing"
fi

if [[ -n "${postgres_bin_dir}" ]]; then
  pass "PostgreSQL binaries discovered at ${postgres_bin_dir}"
else
  warn "PostgreSQL server binaries were not discovered"
fi

status_stdout_file="$(mktemp)"
status_stderr_file="$(mktemp)"
status_exit_code=0
if run_clean_status_probe >"${status_stdout_file}" 2>"${status_stderr_file}"; then
  pass "clean-profile local-service status probe completed"
else
  status_exit_code=$?
  warn "clean-profile local-service status probe failed with exit code ${status_exit_code}"
fi

node --input-type=module - <<'EOF' "${json_report}" "${status_stdout_file}" "${status_stderr_file}" "${status_exit_code}" "${postgres_bin_dir}" "${node_path}" "${npm_path}" "${python3_path}" "${cargo_path}" "${rustc_path}" "${psql_path}" "${xvfb_path}" "${dpkg_path}" "${rpm_path}" "${gtk_launch_path}"
import fs from "node:fs";
import { execSync } from "node:child_process";

const [
  jsonReport,
  statusStdoutFile,
  statusStderrFile,
  statusExitCode,
  postgresBinDir,
  nodePath,
  npmPath,
  python3Path,
  cargoPath,
  rustcPath,
  psqlPath,
  xvfbPath,
  dpkgPath,
  rpmPath,
  gtkLaunchPath,
] = process.argv.slice(2);

function readIfPresent(path) {
  return fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
}

function commandVersion(command, args = "--version") {
  if (!command) {
    return null;
  }

  try {
    return execSync(`${command} ${args}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

const report = {
  capturedAt: new Date().toISOString(),
  script: "scripts/check-development-env.sh",
  toolchain: {
    node: { path: nodePath || null, version: commandVersion(nodePath) },
    npm: { path: npmPath || null, version: commandVersion(npmPath) },
    python3: { path: python3Path || null, version: commandVersion(python3Path) },
    cargo: { path: cargoPath || null, version: commandVersion(cargoPath) },
    rustc: { path: rustcPath || null, version: commandVersion(rustcPath) },
  },
  optionalTools: {
    psqlPath: psqlPath || null,
    xvfbRunPath: xvfbPath || null,
    dpkgPath: dpkgPath || null,
    rpmPath: rpmPath || null,
    gtkLaunchPath: gtkLaunchPath || null,
  },
  postgres: {
    discoveredBinDir: postgresBinDir || null,
    pgCtlPresent: postgresBinDir ? fs.existsSync(`${postgresBinDir}/pg_ctl`) : false,
    initdbPresent: postgresBinDir ? fs.existsSync(`${postgresBinDir}/initdb`) : false,
  },
  localServiceStatusProbe: {
    exitCode: Number(statusExitCode),
    stdout: readIfPresent(statusStdoutFile),
    stderr: readIfPresent(statusStderrFile),
  },
};

fs.writeFileSync(jsonReport, `${JSON.stringify(report, null, 2)}\n`);
EOF

node --input-type=module - <<'EOF' "${json_report}" "${markdown_report}"
import fs from "node:fs";

const [jsonReport, markdownReport] = process.argv.slice(2);
const report = JSON.parse(fs.readFileSync(jsonReport, "utf8"));

const lines = [
  "# Development Environment Report",
  "",
  `Captured at: ${report.capturedAt}`,
  "",
  "## Toolchain",
  "",
  `- node: ${report.toolchain.node.path ?? "missing"}${report.toolchain.node.version ? ` (${report.toolchain.node.version})` : ""}`,
  `- npm: ${report.toolchain.npm.path ?? "missing"}${report.toolchain.npm.version ? ` (${report.toolchain.npm.version})` : ""}`,
  `- python3: ${report.toolchain.python3.path ?? "missing"}${report.toolchain.python3.version ? ` (${report.toolchain.python3.version})` : ""}`,
  `- cargo: ${report.toolchain.cargo.path ?? "missing"}${report.toolchain.cargo.version ? ` (${report.toolchain.cargo.version})` : ""}`,
  `- rustc: ${report.toolchain.rustc.path ?? "missing"}${report.toolchain.rustc.version ? ` (${report.toolchain.rustc.version})` : ""}`,
  "",
  "## PostgreSQL",
  "",
  `- discovered bindir: ${report.postgres.discoveredBinDir ?? "missing"}`,
  `- pg_ctl present: ${report.postgres.pgCtlPresent ? "yes" : "no"}`,
  `- initdb present: ${report.postgres.initdbPresent ? "yes" : "no"}`,
  "",
  "## Optional Tools",
  "",
  `- xvfb-run: ${report.optionalTools.xvfbRunPath ?? "missing"}`,
  `- dpkg: ${report.optionalTools.dpkgPath ?? "missing"}`,
  `- rpm: ${report.optionalTools.rpmPath ?? "missing"}`,
  `- gtk-launch: ${report.optionalTools.gtkLaunchPath ?? "missing"}`,
  "",
  "## Clean-Profile Local Service Status Probe",
  "",
  `- exit code: ${report.localServiceStatusProbe.exitCode}`,
  "",
  "```text",
  report.localServiceStatusProbe.stdout.trim() || "(no stdout)",
  "```",
];

if (report.localServiceStatusProbe.stderr.trim()) {
  lines.push("", "## Probe stderr", "", "```text", report.localServiceStatusProbe.stderr.trim(), "```");
}

fs.writeFileSync(markdownReport, `${lines.join("\n")}\n`);
EOF

rm -f "${status_stdout_file}" "${status_stderr_file}"

info "wrote ${json_report}"
info "wrote ${markdown_report}"

if [[ "${strict_mode}" == "true" && "${failures}" -gt 0 ]]; then
  echo "[fail] development environment check failed in strict mode" >&2
  exit 1
fi
