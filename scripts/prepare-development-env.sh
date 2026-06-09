#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"

run_npm_install="true"
run_desktop_vendor="true"
run_env_doctor="true"

usage() {
  cat <<'EOF'
usage: ./scripts/prepare-development-env.sh [--skip-npm-install] [--skip-desktop-vendor] [--skip-doctor]

Bootstraps the local OpsProbe development environment by:

- checking core toolchain availability
- installing workspace node dependencies
- discovering local PostgreSQL binary directories
- preparing desktop Cargo vendor sources for more reliable Tauri packaging
- recording a structured development environment report
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-npm-install)
      run_npm_install="false"
      shift
      ;;
    --skip-desktop-vendor)
      run_desktop_vendor="false"
      shift
      ;;
    --skip-doctor)
      run_env_doctor="false"
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

pass() {
  echo "[pass] $1"
}

info() {
  echo "[info] $1"
}

fail() {
  echo "[fail] $1" >&2
  exit 1
}

require_command() {
  local command_name="$1"
  if command -v "${command_name}" >/dev/null 2>&1; then
    pass "${command_name} is available at $(command -v "${command_name}")"
  else
    fail "${command_name} is required but not installed"
  fi
}

optional_command() {
  local command_name="$1"
  if command -v "${command_name}" >/dev/null 2>&1; then
    pass "${command_name} is available at $(command -v "${command_name}")"
  else
    info "${command_name} is not installed in PATH"
  fi
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

  if [[ -n "${candidate}" ]]; then
    pass "PostgreSQL binaries discovered at ${candidate}"
    info "export PATH=${candidate}:\$PATH"
  else
    info "PostgreSQL binaries were not fully discovered; install PostgreSQL server tools before local-service bootstrap"
  fi
}

cd "${repo_root}"

require_command node
require_command npm
require_command python3
require_command cargo
require_command rustc

optional_command psql
optional_command xvfb-run
optional_command dpkg
optional_command rpm
optional_command gtk-launch

discover_postgres_bin_dir

if [[ "${run_npm_install}" == "true" ]]; then
  info "installing workspace dependencies with npm install"
  npm install
  pass "workspace npm dependencies are ready"
else
  info "skipping npm install by request"
fi

if [[ "${run_desktop_vendor}" == "true" ]]; then
  info "preparing desktop vendored Cargo sources"
  "${script_dir}/prepare-desktop-build-env.sh"
  pass "desktop Cargo vendor sources are ready"
else
  info "skipping desktop Cargo vendor preparation by request"
fi

if [[ "${run_env_doctor}" == "true" ]]; then
  info "capturing structured development environment report"
  "${script_dir}/check-development-env.sh"
  pass "development environment report is ready"
else
  info "skipping development environment report by request"
fi

pass "OpsProbe development environment preparation completed"
