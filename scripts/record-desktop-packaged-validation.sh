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

node --input-type=module - <<'EOF' > "${validation_dir}/desktop-packaged-validation-record.json"
import fs from "node:fs";
import { execSync } from "node:child_process";

const validationDir = ".opsprobe-validation";
const rootPkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const currentVersion = rootPkg.version;
const bundleRoot = "apps/desktop/src-tauri/target/release/bundle";

function exists(path) {
  return fs.existsSync(path);
}

function statBytes(path) {
  return exists(path) ? fs.statSync(path).size : null;
}

function commandPath(command) {
  try {
    return execSync(`command -v ${command}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function readJson(path) {
  if (!exists(path)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function artifactRecord(kind, path) {
  return {
    kind,
    path,
    present: exists(path),
    bytes: statBytes(path),
  };
}

const debPath = `${bundleRoot}/deb/OpsProbe_${currentVersion}_amd64.deb`;
const rpmPath = `${bundleRoot}/rpm/OpsProbe-${currentVersion}-1.x86_64.rpm`;
const appImagePath = `${bundleRoot}/appimage/OpsProbe_${currentVersion}_amd64.AppImage`;
const appDirPath = `${bundleRoot}/appimage/OpsProbe.AppDir`;

const priorBundle = readJson(`${validationDir}/desktop-bundle-candidate.json`);
const priorPreflight = readJson(`${validationDir}/desktop-packaged-acceptance-preflight.json`);
const priorLaunchSmoke = readJson(`${validationDir}/desktop-packaged-launch-smoke.json`);
const priorWalkthrough = readJson(`${validationDir}/desktop-operator-walkthrough.json`);

const artifacts = {
  deb: artifactRecord("deb", debPath),
  rpm: artifactRecord("rpm", rpmPath),
  appImage: artifactRecord("appImage", appImagePath),
  appDir: {
    kind: "appDir",
    path: appDirPath,
    present: exists(appDirPath),
    desktopEntryPresent: exists(`${appDirPath}/usr/share/applications/OpsProbe.desktop`),
    binaryPresent: exists(`${appDirPath}/usr/bin/opsprobe-desktop`),
  },
};

const currentVersionBundlesPresent =
  artifacts.deb.present && artifacts.rpm.present && artifacts.appImage.present && artifacts.appDir.present;

const evidenceVersionMismatch = [
  priorBundle?.version,
  priorPreflight?.version,
  priorLaunchSmoke?.version,
  priorWalkthrough?.version,
].filter((value) => value && value !== currentVersion);

const blockers = [];

if (!artifacts.deb.present) {
  blockers.push(`Missing current-version deb artifact: ${debPath}`);
}
if (!artifacts.rpm.present) {
  blockers.push(`Missing current-version rpm artifact: ${rpmPath}`);
}
if (!artifacts.appImage.present) {
  blockers.push(`Missing current-version AppImage artifact: ${appImagePath}`);
}
if (!artifacts.appDir.present) {
  blockers.push(`Missing current-version AppDir artifact: ${appDirPath}`);
}
if (evidenceVersionMismatch.length > 0) {
  blockers.push(`Existing packaged evidence files still reference older versions: ${Array.from(new Set(evidenceVersionMismatch)).join(", ")}`);
}

const output = {
  validatedAt: new Date().toISOString(),
  script: "scripts/record-desktop-packaged-validation.sh",
  currentVersion,
  environment: {
    display: process.env.DISPLAY ?? "",
    hasDisplay: (process.env.DISPLAY ?? "").length > 0,
    xvfbRunPath: commandPath("xvfb-run"),
    hasXvfb: commandPath("xvfb-run") !== null,
    canAttemptGuiLaunch: (process.env.DISPLAY ?? "").length > 0 || commandPath("xvfb-run") !== null,
  },
  artifacts,
  currentVersionBundlesPresent,
  priorEvidence: {
    bundleCandidateVersion: priorBundle?.version ?? null,
    packagedAcceptancePreflightVersion: priorPreflight?.version ?? null,
    packagedLaunchSmokeVersion: priorLaunchSmoke?.version ?? null,
    operatorWalkthroughVersion: priorWalkthrough?.version ?? null,
  },
  packagedValidationReady: {
    ready: currentVersionBundlesPresent,
    blockers,
    nextAction: currentVersionBundlesPresent
      ? "Run the packaged preflight, launch smoke, and operator walkthrough against the current version artifacts."
      : "Build current-version desktop bundle artifacts before claiming packaged validation for this release line.",
  },
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
EOF

node --input-type=module - <<'EOF' > "${validation_dir}/desktop-packaged-validation-record.md"
import fs from "node:fs";

const record = JSON.parse(fs.readFileSync(".opsprobe-validation/desktop-packaged-validation-record.json", "utf8"));

const lines = [
  "# Desktop Packaged Validation Record",
  "",
  `Captured at: ${record.validatedAt}`,
  "",
  `Current version: ${record.currentVersion}`,
  "",
  "## Artifact Status",
  "",
  `- deb: ${record.artifacts.deb.present ? "present" : "missing"} (${record.artifacts.deb.path})`,
  `- rpm: ${record.artifacts.rpm.present ? "present" : "missing"} (${record.artifacts.rpm.path})`,
  `- AppImage: ${record.artifacts.appImage.present ? "present" : "missing"} (${record.artifacts.appImage.path})`,
  `- AppDir: ${record.artifacts.appDir.present ? "present" : "missing"} (${record.artifacts.appDir.path})`,
  "",
  "## Prior Evidence Versions",
  "",
  `- bundle candidate: ${record.priorEvidence.bundleCandidateVersion ?? "none"}`,
  `- packaged acceptance preflight: ${record.priorEvidence.packagedAcceptancePreflightVersion ?? "none"}`,
  `- packaged launch smoke: ${record.priorEvidence.packagedLaunchSmokeVersion ?? "none"}`,
  `- operator walkthrough: ${record.priorEvidence.operatorWalkthroughVersion ?? "none"}`,
  "",
  "## Readiness",
  "",
  `- ready: ${record.packagedValidationReady.ready ? "yes" : "no"}`,
];

if (record.packagedValidationReady.blockers.length > 0) {
  lines.push("", "## Blockers", "");
  for (const blocker of record.packagedValidationReady.blockers) {
    lines.push(`- ${blocker}`);
  }
}

lines.push("", "## Next Action", "", `- ${record.packagedValidationReady.nextAction}`, "");

process.stdout.write(lines.join("\n"));
EOF
