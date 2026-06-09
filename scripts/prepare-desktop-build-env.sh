#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"

vendor_dir="${OPSPROBE_VENDOR_DIR:-${repo_root}/.opsprobe-vendor}"
lockfile="${repo_root}/apps/desktop/src-tauri/Cargo.lock"
mirror_registry="${OPSPROBE_CARGO_REGISTRY_OVERRIDE:-sparse+https://rsproxy.cn/index/}"

cd "${repo_root}"

"${script_dir}/hydrate-cargo-cache.sh" "${lockfile}"

temp_config_dir="$(mktemp -d)"
cleanup() {
  rm -rf "${temp_config_dir}"
}
trap cleanup EXIT

cat > "${temp_config_dir}/config.toml" <<EOF
[source.crates-io]
replace-with = "opsprobe-mirror"

[source.opsprobe-mirror]
registry = "${mirror_registry}"
EOF

rm -rf "${vendor_dir}"
mkdir -p "${vendor_dir}"

(
  cd apps/desktop/src-tauri
  CARGO_HOME="${HOME}/.cargo" cargo vendor \
    --locked \
    --offline \
    --respect-source-config \
    --config "${temp_config_dir}/config.toml" \
    "${vendor_dir}"
)

echo "[prepared] vendor dir: ${vendor_dir}"
