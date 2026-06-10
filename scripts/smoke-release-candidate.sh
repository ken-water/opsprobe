#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"
vendor_dir="${OPSPROBE_VENDOR_DIR:-${repo_root}/.opsprobe-vendor}"

version="$(node --input-type=module -e 'import fs from "node:fs"; const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); process.stdout.write(pkg.version);')"
validation_dir=".opsprobe-validation"
mkdir -p "${validation_dir}"

cargo_check_args=(
  check
  --manifest-path
  apps/desktop/src-tauri/Cargo.toml
)

if [[ -n "${OPSPROBE_CARGO_REGISTRY_OVERRIDE:-}" ]]; then
  cargo_check_args+=(
    --config
    "source.crates-io.registry=\"${OPSPROBE_CARGO_REGISTRY_OVERRIDE}\""
  )
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
fi

./scripts/smoke-local-service-flow.sh
npm run desktop:typecheck
npm --workspace @opsprobe/desktop run build
cargo "${cargo_check_args[@]}"
npm run local-service:status >/dev/null
npm run test:unit
npm run test:integration

cat > "${validation_dir}/last-smoke.json" <<EOF
{
  "version": "${version}",
  "validatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "script": "scripts/smoke-release-candidate.sh"
}
EOF
