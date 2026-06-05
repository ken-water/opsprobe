#!/usr/bin/env bash

set -euo pipefail

npm run desktop:typecheck
npm --workspace @opsprobe/desktop run build
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml --config 'source.crates-io.registry="sparse+https://index.crates.io/"'
npm run local-service:status >/dev/null
npm run test:unit
npm run test:integration
