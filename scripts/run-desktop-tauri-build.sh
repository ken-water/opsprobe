#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"
vendor_dir="${OPSPROBE_VENDOR_DIR:-${repo_root}/.opsprobe-vendor}"

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
