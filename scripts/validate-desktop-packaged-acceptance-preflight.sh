#!/usr/bin/env bash

set -euo pipefail

validation_dir=".opsprobe-validation"
mkdir -p "${validation_dir}"

version="$(node --input-type=module -e 'import fs from "node:fs"; const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); process.stdout.write(pkg.version);')"
bundle_root="apps/desktop/src-tauri/target/release/bundle"

deb_path="${bundle_root}/deb/OpsProbe_${version}_amd64.deb"
rpm_path="${bundle_root}/rpm/OpsProbe-${version}-1.x86_64.rpm"
appimage_path="${bundle_root}/appimage/OpsProbe_${version}_amd64.AppImage"
appdir_path="${bundle_root}/appimage/OpsProbe.AppDir"

has_display="false"
if [[ -n "${DISPLAY:-}" ]]; then
  has_display="true"
fi

has_xvfb="false"
if command -v xvfb-run >/dev/null 2>&1; then
  has_xvfb="true"
fi

can_attempt_gui_launch="false"
if [[ "${has_display}" == "true" || "${has_xvfb}" == "true" ]]; then
  can_attempt_gui_launch="true"
fi

test -f "${deb_path}"
test -f "${rpm_path}"
test -f "${appimage_path}"
test -d "${appdir_path}"
test -f "${appdir_path}/usr/share/applications/OpsProbe.desktop"
test -f "${appdir_path}/usr/bin/opsprobe-desktop"

node --input-type=module - <<'EOF' > "${validation_dir}/desktop-packaged-acceptance-preflight.json"
import fs from "node:fs";
import { execSync } from "node:child_process";

const rootPkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = rootPkg.version;
const bundleRoot = "apps/desktop/src-tauri/target/release/bundle";

function commandPath(command) {
  try {
    return execSync(`command -v ${command}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

function exists(path) {
  return fs.existsSync(path);
}

const display = process.env.DISPLAY ?? "";
const xvfbPath = commandPath("xvfb-run");

const output = {
  validatedAt: new Date().toISOString(),
  script: "scripts/validate-desktop-packaged-acceptance-preflight.sh",
  version,
  environment: {
    display,
    hasDisplay: display.length > 0,
    xvfbRunPath: xvfbPath,
    canAttemptGuiLaunch: display.length > 0 || xvfbPath !== null,
    dpkgPath: commandPath("dpkg"),
    rpmPath: commandPath("rpm"),
    gtkLaunchPath: commandPath("gtk-launch"),
    xdgOpenPath: commandPath("xdg-open"),
  },
  bundleArtifacts: {
    deb: {
      path: `${bundleRoot}/deb/OpsProbe_${version}_amd64.deb`,
      present: exists(`${bundleRoot}/deb/OpsProbe_${version}_amd64.deb`),
    },
    rpm: {
      path: `${bundleRoot}/rpm/OpsProbe-${version}-1.x86_64.rpm`,
      present: exists(`${bundleRoot}/rpm/OpsProbe-${version}-1.x86_64.rpm`),
    },
    appImage: {
      path: `${bundleRoot}/appimage/OpsProbe_${version}_amd64.AppImage`,
      present: exists(`${bundleRoot}/appimage/OpsProbe_${version}_amd64.AppImage`),
    },
    appDir: {
      path: `${bundleRoot}/appimage/OpsProbe.AppDir`,
      present: exists(`${bundleRoot}/appimage/OpsProbe.AppDir`),
      desktopEntryPresent: exists(`${bundleRoot}/appimage/OpsProbe.AppDir/usr/share/applications/OpsProbe.desktop`),
      binaryPresent: exists(`${bundleRoot}/appimage/OpsProbe.AppDir/usr/bin/opsprobe-desktop`),
    },
  },
  manualAcceptanceReady: {
    ready: (display.length > 0 || xvfbPath !== null) && exists(`${bundleRoot}/appimage/OpsProbe_${version}_amd64.AppImage`),
    blockingReasons: [
      ...(display.length > 0 || xvfbPath !== null ? [] : ["No DISPLAY or xvfb-run available for GUI launch in the current environment."]),
      ...(exists(`${bundleRoot}/appimage/OpsProbe_${version}_amd64.AppImage`) ? [] : ["Current version AppImage is missing."]),
    ],
    nextAction:
      display.length > 0 || xvfbPath !== null
        ? "Use the packaged acceptance template to run a real launch and first-run inspection review."
        : "Run the packaged acceptance template on a desktop session or install xvfb-run for headless GUI launch validation.",
  },
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
EOF
