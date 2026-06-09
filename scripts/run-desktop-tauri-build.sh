#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"

if [[ -n "${OPSPROBE_CARGO_REGISTRY_OVERRIDE:-}" ]]; then
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
