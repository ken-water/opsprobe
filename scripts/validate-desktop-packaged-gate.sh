#!/usr/bin/env bash

set -euo pipefail

validation_dir=".opsprobe-validation"
mkdir -p "${validation_dir}"

version="$(node --input-type=module -e 'import fs from "node:fs"; const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); process.stdout.write(pkg.version);')"

linux_record="${validation_dir}/desktop-packaged-validation-record.json"
linux_bundle_record="${validation_dir}/desktop-bundle-candidate.json"
linux_preflight_record="${validation_dir}/desktop-packaged-acceptance-preflight.json"
linux_launch_record="${validation_dir}/desktop-packaged-launch-smoke.json"
windows_record="${validation_dir}/desktop-windows-validation-record.json"
windows_wine_record="${validation_dir}/desktop-windows-wine-validation-record.json"

./scripts/record-desktop-packaged-validation.sh >/dev/null

node --input-type=module - <<'EOF' > "${validation_dir}/desktop-packaged-gate.json"
import fs from "node:fs";

const validationDir = ".opsprobe-validation";
const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;

function readJson(path) {
  if (!fs.existsSync(path)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

const linuxRecord = readJson(`${validationDir}/desktop-packaged-validation-record.json`);
const bundleRecord = readJson(`${validationDir}/desktop-bundle-candidate.json`);
const preflightRecord = readJson(`${validationDir}/desktop-packaged-acceptance-preflight.json`);
const launchRecord = readJson(`${validationDir}/desktop-packaged-launch-smoke.json`);
const windowsRecord = readJson(`${validationDir}/desktop-windows-validation-record.json`);
const windowsWineRecord = readJson(`${validationDir}/desktop-windows-wine-validation-record.json`);

const blockers = [];
const warnings = [];

if (!linuxRecord) {
  blockers.push("Missing packaged validation record. Run ./scripts/record-desktop-packaged-validation.sh.");
} else {
  if (linuxRecord.currentVersion !== version) {
    blockers.push(`Packaged validation record is for ${linuxRecord.currentVersion ?? "unknown"}, expected ${version}.`);
  }
  if (!linuxRecord.packagedValidationReady?.ready) {
    blockers.push("Current-version Linux bundle artifacts are not all present.");
  }
}

if (!bundleRecord) {
  blockers.push("Missing Linux bundle candidate evidence. Run ./scripts/validate-desktop-bundle-candidate.sh.");
} else if (bundleRecord.version !== version) {
  blockers.push(`Linux bundle candidate evidence is for ${bundleRecord.version ?? "unknown"}, expected ${version}.`);
}

if (!preflightRecord) {
  blockers.push("Missing packaged acceptance preflight evidence. Run ./scripts/validate-desktop-packaged-acceptance-preflight.sh.");
} else if (preflightRecord.version !== version) {
  blockers.push(`Packaged acceptance preflight is for ${preflightRecord.version ?? "unknown"}, expected ${version}.`);
}

if (!launchRecord) {
  blockers.push("Missing packaged launch smoke evidence. Run ./scripts/validate-desktop-packaged-launch-smoke.sh.");
} else {
  if (launchRecord.version !== version) {
    blockers.push(`Packaged launch smoke is for ${launchRecord.version ?? "unknown"}, expected ${version}.`);
  }
  if (launchRecord.status !== "running") {
    blockers.push(`Packaged launch smoke status is ${launchRecord.status ?? "unknown"}, expected running.`);
  }
}

if (!windowsRecord) {
  blockers.push("Missing Windows artifact evidence. Run ./scripts/record-desktop-windows-validation.sh.");
} else if (windowsRecord.version !== version) {
  blockers.push(`Windows artifact evidence is for ${windowsRecord.version ?? "unknown"}, expected ${version}.`);
}

if (!windowsWineRecord) {
  blockers.push("Missing Windows Wine evidence. Run ./scripts/record-desktop-windows-wine-validation.sh.");
} else if (windowsWineRecord.version !== version) {
  blockers.push(`Windows Wine evidence is for ${windowsWineRecord.version ?? "unknown"}, expected ${version}.`);
}

if (windowsRecord && windowsRecord.version === version && !windowsRecord.windowsValidationReady?.ready) {
  warnings.push("Windows installer artifacts are still not ready for release promotion on the current machine.");
}

if (windowsWineRecord && windowsWineRecord.version === version && !windowsWineRecord.wineValidationReady?.ready) {
  warnings.push("Wine launch evidence is incomplete; prefer real Windows installer validation before advertising broad Windows support.");
}

const output = {
  validatedAt: new Date().toISOString(),
  script: "scripts/validate-desktop-packaged-gate.sh",
  version,
  gate: {
    passed: blockers.length === 0,
    blockers,
    warnings,
    nextAction:
      blockers.length === 0
        ? "Desktop packaged evidence is aligned for this release line. Review warnings before release messaging."
        : "Capture or refresh the missing packaged evidence records before release tagging.",
  },
  evidence: {
    linuxPackagedValidationVersion: linuxRecord?.currentVersion ?? null,
    linuxBundleCandidateVersion: bundleRecord?.version ?? null,
    linuxAcceptancePreflightVersion: preflightRecord?.version ?? null,
    linuxLaunchSmokeVersion: launchRecord?.version ?? null,
    windowsArtifactVersion: windowsRecord?.version ?? null,
    windowsWineVersion: windowsWineRecord?.version ?? null,
    windowsArtifactReady: windowsRecord?.windowsValidationReady?.ready ?? null,
    windowsWineReady: windowsWineRecord?.wineValidationReady?.ready ?? null,
  },
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
EOF

node --input-type=module - <<'EOF' > "${validation_dir}/desktop-packaged-gate.md"
import fs from "node:fs";

const record = JSON.parse(fs.readFileSync(".opsprobe-validation/desktop-packaged-gate.json", "utf8"));

const lines = [
  "# Desktop Packaged Gate",
  "",
  `Captured at: ${record.validatedAt}`,
  "",
  `Version: ${record.version}`,
  `Passed: ${record.gate.passed ? "yes" : "no"}`,
  "",
  "## Evidence Versions",
  "",
  `- Linux packaged validation: ${record.evidence.linuxPackagedValidationVersion ?? "missing"}`,
  `- Linux bundle candidate: ${record.evidence.linuxBundleCandidateVersion ?? "missing"}`,
  `- Linux acceptance preflight: ${record.evidence.linuxAcceptancePreflightVersion ?? "missing"}`,
  `- Linux launch smoke: ${record.evidence.linuxLaunchSmokeVersion ?? "missing"}`,
  `- Windows artifact record: ${record.evidence.windowsArtifactVersion ?? "missing"}`,
  `- Windows Wine record: ${record.evidence.windowsWineVersion ?? "missing"}`,
  "",
  "## Windows Readiness Snapshot",
  "",
  `- installer artifacts ready: ${record.evidence.windowsArtifactReady === null ? "unknown" : record.evidence.windowsArtifactReady ? "yes" : "no"}`,
  `- Wine launch ready: ${record.evidence.windowsWineReady === null ? "unknown" : record.evidence.windowsWineReady ? "yes" : "no"}`,
];

if (record.gate.blockers.length > 0) {
  lines.push("", "## Blockers", "");
  for (const blocker of record.gate.blockers) {
    lines.push(`- ${blocker}`);
  }
}

if (record.gate.warnings.length > 0) {
  lines.push("", "## Warnings", "");
  for (const warning of record.gate.warnings) {
    lines.push(`- ${warning}`);
  }
}

lines.push("", "## Next Action", "", `- ${record.gate.nextAction}`, "");

process.stdout.write(lines.join("\n"));
EOF

node --input-type=module -e '
import fs from "node:fs";
const record = JSON.parse(fs.readFileSync(".opsprobe-validation/desktop-packaged-gate.json", "utf8"));
if (!record.gate.passed) {
  for (const blocker of record.gate.blockers) {
    console.error(`[fail] ${blocker}`);
  }
  process.exit(1);
}
for (const warning of record.gate.warnings) {
  console.log(`[warn] ${warning}`);
}
console.log(`Desktop packaged gate passed for ${record.version}`);
'
