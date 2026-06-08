#!/usr/bin/env bash

set -euo pipefail

validation_dir=".opsprobe-validation"
mkdir -p "${validation_dir}"

bundle_root="apps/desktop/src-tauri/target/release/bundle"
deb_path="${bundle_root}/deb/OpsProbe_0.10.3_amd64.deb"
rpm_path="${bundle_root}/rpm/OpsProbe-0.10.3-1.x86_64.rpm"
appdir_path="${bundle_root}/appimage/OpsProbe.AppDir"
appimage_path="${bundle_root}/appimage/OpsProbe_0.10.3_amd64.AppImage"

test -f "${deb_path}"
test -f "${rpm_path}"
test -d "${appdir_path}"
test -f "${appdir_path}/AppRun"
test -f "${appdir_path}/usr/share/applications/OpsProbe.desktop"

node --input-type=module - <<'EOF' > "${validation_dir}/desktop-bundle-candidate.json"
import fs from "node:fs";

const bundleRoot = "apps/desktop/src-tauri/target/release/bundle";
const debPath = `${bundleRoot}/deb/OpsProbe_0.10.3_amd64.deb`;
const rpmPath = `${bundleRoot}/rpm/OpsProbe-0.10.3-1.x86_64.rpm`;
const appDirPath = `${bundleRoot}/appimage/OpsProbe.AppDir`;
const appImagePath = `${bundleRoot}/appimage/OpsProbe_0.10.3_amd64.AppImage`;

const output = {
  validatedAt: new Date().toISOString(),
  script: "scripts/validate-desktop-bundle-candidate.sh",
  bundleRoot,
  artifacts: {
    deb: {
      path: debPath,
      present: fs.existsSync(debPath),
      bytes: fs.existsSync(debPath) ? fs.statSync(debPath).size : null,
    },
    rpm: {
      path: rpmPath,
      present: fs.existsSync(rpmPath),
      bytes: fs.existsSync(rpmPath) ? fs.statSync(rpmPath).size : null,
    },
    appImage: {
      path: appImagePath,
      present: fs.existsSync(appImagePath),
      bytes: fs.existsSync(appImagePath) ? fs.statSync(appImagePath).size : null,
    },
    appDir: {
      path: appDirPath,
      present: fs.existsSync(appDirPath),
      appRunPresent: fs.existsSync(`${appDirPath}/AppRun`),
      desktopEntryPresent: fs.existsSync(`${appDirPath}/usr/share/applications/OpsProbe.desktop`),
    },
  },
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
EOF
