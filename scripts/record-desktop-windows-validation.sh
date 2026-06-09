#!/usr/bin/env bash

set -euo pipefail

validation_dir=".opsprobe-validation"
mkdir -p "${validation_dir}"

version="$(node --input-type=module -e 'import fs from "node:fs"; const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); process.stdout.write(pkg.version);')"
target_triple="${1:-x86_64-pc-windows-gnu}"
target_root="apps/desktop/src-tauri/target/${target_triple}/release"
bundle_root="${target_root}/bundle/nsis"
installer_path="${bundle_root}/OpsProbe_${version}_x64-setup.exe"
binary_path="${target_root}/opsprobe-desktop.exe"

TARGET_TRIPLE="${target_triple}" node --input-type=module - <<'EOF' > "${validation_dir}/desktop-windows-validation-record.json"
import fs from "node:fs";
import { execSync } from "node:child_process";

const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
const targetTriple = process.env.TARGET_TRIPLE;
const targetRoot = `apps/desktop/src-tauri/target/${targetTriple}/release`;
const bundleRoot = `${targetRoot}/bundle/nsis`;
const installerPath = `${bundleRoot}/OpsProbe_${version}_x64-setup.exe`;
const binaryPath = `${targetRoot}/opsprobe-desktop.exe`;
const validationDir = ".opsprobe-validation";

function exists(path) {
  return fs.existsSync(path);
}

function bytes(path) {
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

const priorRecord = readJson(`${validationDir}/desktop-windows-validation-record.json`);
const blockers = [];

if (!exists(binaryPath)) {
  blockers.push(`Missing Windows desktop binary for ${targetTriple}: ${binaryPath}`);
}
if (!exists(installerPath)) {
  blockers.push(`Missing NSIS installer for ${targetTriple}: ${installerPath}`);
}

const output = {
  validatedAt: new Date().toISOString(),
  script: "scripts/record-desktop-windows-validation.sh",
  version,
  targetTriple,
  environment: {
    rustupPath: commandPath("rustup"),
    makensisPath: commandPath("makensis"),
    mingwPath: commandPath("x86_64-w64-mingw32-gcc"),
    winePath: commandPath("wine"),
  },
  artifacts: {
    windowsBinary: {
      path: binaryPath,
      present: exists(binaryPath),
      bytes: bytes(binaryPath),
    },
    nsisInstaller: {
      path: installerPath,
      present: exists(installerPath),
      bytes: bytes(installerPath),
    },
    nsisScript: {
      path: `${targetRoot}/nsis/x64/installer.nsi`,
      present: exists(`${targetRoot}/nsis/x64/installer.nsi`),
    },
  },
  priorEvidence: {
    previousRecordedVersion: priorRecord?.version ?? null,
    previousRecordedTargetTriple: priorRecord?.targetTriple ?? null,
  },
  windowsValidationReady: {
    ready: blockers.length === 0,
    blockers,
    nextAction:
      blockers.length === 0
        ? "Record installer launch or install validation on a Windows-capable environment before advertising broader Windows support."
        : "Build the Windows NSIS installer for the current version before claiming Windows packaged validation.",
  },
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
EOF

TARGET_TRIPLE="${target_triple}" node --input-type=module - <<'EOF' > "${validation_dir}/desktop-windows-validation-record.md"
import fs from "node:fs";

const record = JSON.parse(fs.readFileSync(".opsprobe-validation/desktop-windows-validation-record.json", "utf8"));

const lines = [
  "# Desktop Windows Validation Record",
  "",
  `Captured at: ${record.validatedAt}`,
  "",
  `Version: ${record.version}`,
  `Target: ${record.targetTriple}`,
  "",
  "## Artifact Status",
  "",
  `- Windows binary: ${record.artifacts.windowsBinary.present ? "present" : "missing"} (${record.artifacts.windowsBinary.path})`,
  `- NSIS installer: ${record.artifacts.nsisInstaller.present ? "present" : "missing"} (${record.artifacts.nsisInstaller.path})`,
  `- NSIS script: ${record.artifacts.nsisScript.present ? "present" : "missing"} (${record.artifacts.nsisScript.path})`,
  "",
  "## Readiness",
  "",
  `- ready: ${record.windowsValidationReady.ready ? "yes" : "no"}`,
];

if (record.windowsValidationReady.blockers.length > 0) {
  lines.push("", "## Blockers", "");
  for (const blocker of record.windowsValidationReady.blockers) {
    lines.push(`- ${blocker}`);
  }
}

lines.push("", "## Next Action", "", `- ${record.windowsValidationReady.nextAction}`, "");

process.stdout.write(lines.join("\n"));
EOF
