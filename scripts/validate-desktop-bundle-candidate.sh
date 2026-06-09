#!/usr/bin/env bash

set -euo pipefail

npm run env:gate:desktop-packaging >/dev/null

validation_dir=".opsprobe-validation"
mkdir -p "${validation_dir}"

version="$(node --input-type=module -e 'import fs from "node:fs"; const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); process.stdout.write(pkg.version);')"
bundle_root="apps/desktop/src-tauri/target/release/bundle"
deb_path="${bundle_root}/deb/OpsProbe_${version}_amd64.deb"
deb_extract_dir="${bundle_root}/deb/OpsProbe_${version}_amd64"
rpm_path="${bundle_root}/rpm/OpsProbe-${version}-1.x86_64.rpm"
rpm_extract_dir="${bundle_root}/rpm/OpsProbe-${version}-1.x86_64"
appdir_path="${bundle_root}/appimage/OpsProbe.AppDir"
appimage_path="${bundle_root}/appimage/OpsProbe_${version}_amd64.AppImage"

test -f "${deb_path}"
test -d "${deb_extract_dir}"
test -f "${rpm_path}"
test -d "${rpm_extract_dir}"
test -d "${appdir_path}"
test -f "${appdir_path}/AppRun"
test -f "${appdir_path}/usr/share/applications/OpsProbe.desktop"
test -f "${deb_extract_dir}/data/usr/bin/opsprobe-desktop"
test -f "${deb_extract_dir}/data/usr/share/applications/OpsProbe.desktop"
test -f "${deb_extract_dir}/data/usr/lib/OpsProbe/resources/local-service/main.mjs"
test -f "${rpm_extract_dir}/usr/share/applications/OpsProbe.desktop"
test -f "${appdir_path}/usr/bin/opsprobe-desktop"
test -f "${appdir_path}/usr/lib/OpsProbe/resources/local-service/main.mjs"
rpm -qlp "${rpm_path}" | rg -F "/usr/lib/OpsProbe/resources/local-service/main.mjs" >/dev/null

node --input-type=module - <<'EOF' > "${validation_dir}/desktop-bundle-candidate.json"
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const rootPkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const tauriConf = JSON.parse(fs.readFileSync("apps/desktop/src-tauri/tauri.conf.json", "utf8"));
const bundleRoot = "apps/desktop/src-tauri/target/release/bundle";
const version = rootPkg.version;
const debPath = `${bundleRoot}/deb/OpsProbe_${version}_amd64.deb`;
const debExtractDir = `${bundleRoot}/deb/OpsProbe_${version}_amd64`;
const rpmPath = `${bundleRoot}/rpm/OpsProbe-${version}-1.x86_64.rpm`;
const rpmExtractDir = `${bundleRoot}/rpm/OpsProbe-${version}-1.x86_64`;
const appDirPath = `${bundleRoot}/appimage/OpsProbe.AppDir`;
const appImagePath = `${bundleRoot}/appimage/OpsProbe_${version}_amd64.AppImage`;

function exists(path) {
  return fs.existsSync(path);
}

function bytes(path) {
  return exists(path) ? fs.statSync(path).size : null;
}

function rpmList(path) {
  try {
    return execFileSync("rpm", ["-qlp", path], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const rpmEntries = rpmList(rpmPath);

const output = {
  validatedAt: new Date().toISOString(),
  script: "scripts/validate-desktop-bundle-candidate.sh",
  version,
  bundleRoot,
  tauriBundleTargets: tauriConf.bundle?.targets ?? [],
  tauriResources: tauriConf.bundle?.resources ?? [],
  artifacts: {
    deb: {
      path: debPath,
      present: exists(debPath),
      bytes: bytes(debPath),
      extractedPath: debExtractDir,
      binaryPresent: exists(`${debExtractDir}/data/usr/bin/opsprobe-desktop`),
      desktopEntryPresent: exists(`${debExtractDir}/data/usr/share/applications/OpsProbe.desktop`),
      icon128Present: exists(`${debExtractDir}/data/usr/share/icons/hicolor/128x128/apps/opsprobe-desktop.png`),
      localServiceRuntimePresent: exists(`${debExtractDir}/data/usr/lib/OpsProbe/resources/local-service/main.mjs`),
    },
    rpm: {
      path: rpmPath,
      present: exists(rpmPath),
      bytes: bytes(rpmPath),
      extractedPath: rpmExtractDir,
      desktopEntryPresent: exists(`${rpmExtractDir}/usr/share/applications/OpsProbe.desktop`),
      localServiceRuntimePresent: rpmEntries.includes("/usr/lib/OpsProbe/resources/local-service/main.mjs"),
    },
    appImage: {
      path: appImagePath,
      present: exists(appImagePath),
      bytes: bytes(appImagePath),
      optional: true,
    },
    appDir: {
      path: appDirPath,
      present: exists(appDirPath),
      appRunPresent: exists(`${appDirPath}/AppRun`),
      wrappedAppRunPresent: exists(`${appDirPath}/AppRun.wrapped`),
      binaryPresent: exists(`${appDirPath}/usr/bin/opsprobe-desktop`),
      desktopEntryPresent: exists(`${appDirPath}/usr/share/applications/OpsProbe.desktop`),
      icon128Present: exists(`${appDirPath}/usr/share/icons/hicolor/128x128/apps/opsprobe-desktop.png`),
      schemaBundlePresent: exists(`${appDirPath}/usr/share/glib-2.0/schemas/gschemas.compiled`),
      localServiceRuntimePresent: exists(`${appDirPath}/usr/lib/OpsProbe/resources/local-service/main.mjs`),
    },
  },
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
EOF
