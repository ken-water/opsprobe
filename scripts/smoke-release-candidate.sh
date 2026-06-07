#!/usr/bin/env bash

set -euo pipefail

version="$(node --input-type=module -e 'import fs from "node:fs"; const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); process.stdout.write(pkg.version);')"
validation_dir=".opsprobe-validation"
mkdir -p "${validation_dir}"

./scripts/smoke-local-service-flow.sh
npm run desktop:typecheck
npm --workspace @opsprobe/desktop run build
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml --config 'source.crates-io.registry="sparse+https://index.crates.io/"'
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
