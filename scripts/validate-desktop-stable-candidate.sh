#!/usr/bin/env bash

set -euo pipefail

validation_dir=".opsprobe-validation"
mkdir -p "${validation_dir}"

npm run desktop:typecheck
npm --workspace @opsprobe/desktop run build
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml --config 'source.crates-io.registry="sparse+https://index.crates.io/"'

test -f apps/desktop/dist/index.html
test -f apps/desktop/src-tauri/tauri.conf.json
test -f apps/desktop/src-tauri/Cargo.toml

node --input-type=module - <<'EOF' > "${validation_dir}/desktop-stable-candidate.json"
import fs from "node:fs";

const rootPkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const desktopPkg = JSON.parse(fs.readFileSync("apps/desktop/package.json", "utf8"));
const tauriConf = JSON.parse(fs.readFileSync("apps/desktop/src-tauri/tauri.conf.json", "utf8"));
const distIndex = fs.statSync("apps/desktop/dist/index.html");
const cargoToml = fs.readFileSync("apps/desktop/src-tauri/Cargo.toml", "utf8");
const cargoVersion = cargoToml.match(/^version = "([^"]+)"/m)?.[1] ?? null;

process.stdout.write(
  JSON.stringify(
    {
      validatedAt: new Date().toISOString(),
      script: "scripts/validate-desktop-stable-candidate.sh",
      versions: {
        root: rootPkg.version,
        desktop: desktopPkg.version,
        tauri: tauriConf.version,
        cargo: cargoVersion,
      },
      frontend: {
        distIndexPath: "apps/desktop/dist/index.html",
        distIndexBytes: distIndex.size,
      },
      tauri: {
        productName: tauriConf.productName,
        identifier: tauriConf.identifier,
        frontendDist: tauriConf.build?.frontendDist ?? null,
        bundleActive: tauriConf.bundle?.active ?? null,
        bundleTargets: tauriConf.bundle?.targets ?? null,
      },
    },
    null,
    2,
  ),
);
EOF
