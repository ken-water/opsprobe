#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"
vendor_dir="${OPSPROBE_VENDOR_DIR:-${repo_root}/.opsprobe-vendor}"
tauri_cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/tauri"

# Tauri's Linux bundling helpers are distributed as AppImages. On systems
# without libfuse2 they still run correctly when extracted to a temp dir.
if [[ -f "${tauri_cache_dir}/linuxdeploy-x86_64.AppImage" ]]; then
  export APPIMAGE_EXTRACT_AND_RUN="${APPIMAGE_EXTRACT_AND_RUN:-1}"
fi

if [[ -d "${vendor_dir}" ]]; then
  temp_cargo_home="$(mktemp -d)"
  cleanup() {
    rm -rf "${temp_cargo_home}"
  }
  trap cleanup EXIT

  mkdir -p "${temp_cargo_home}"
  cat > "${temp_cargo_home}/config.toml" <<EOF
[source.crates-io]
replace-with = "vendored-sources"

[source.vendored-sources]
directory = "${vendor_dir}"
EOF

  export CARGO_HOME="${temp_cargo_home}"
elif [[ -n "${OPSPROBE_CARGO_REGISTRY_OVERRIDE:-}" ]]; then
  temp_cargo_home="$(mktemp -d)"
  cleanup() {
    rm -rf "${temp_cargo_home}"
  }
  trap cleanup EXIT

  mkdir -p "${temp_cargo_home}"
  cat > "${temp_cargo_home}/config.toml" <<EOF
[source.crates-io]
replace-with = "opsprobe-mirror"

[source.opsprobe-mirror]
registry = "${OPSPROBE_CARGO_REGISTRY_OVERRIDE}"
EOF

  if [[ -n "${CARGO_HOME:-}" && -d "${CARGO_HOME}" ]]; then
    for entry in credentials credentials.toml; do
      if [[ -f "${CARGO_HOME}/${entry}" ]]; then
        cp "${CARGO_HOME}/${entry}" "${temp_cargo_home}/${entry}"
      fi
    done
  fi

  export CARGO_HOME="${temp_cargo_home}"
fi

cd "${repo_root}"
npm --workspace @opsprobe/desktop run tauri -- build "$@"
