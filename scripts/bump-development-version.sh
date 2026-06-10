#!/usr/bin/env bash

set -euo pipefail

NEXT_VERSION="${1:-}"

if [[ -z "${NEXT_VERSION}" ]]; then
  echo "usage: $0 <next-version>" >&2
  exit 2
fi

if [[ ! "${NEXT_VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "[fail] ${NEXT_VERSION} is not a valid semver version" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

CURRENT_VERSION="$(node --input-type=module -e 'import fs from "node:fs"; const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); process.stdout.write(pkg.version);')"

if [[ "${CURRENT_VERSION}" == "${NEXT_VERSION}" ]]; then
  echo "[fail] next version matches current version ${CURRENT_VERSION}" >&2
  exit 1
fi

node --input-type=module - "${CURRENT_VERSION}" "${NEXT_VERSION}" <<'EOF'
import fs from "node:fs";

const [, , currentVersion, nextVersion] = process.argv;

const updateJsonVersion = (path) => {
  const raw = JSON.parse(fs.readFileSync(path, "utf8"));
  raw.version = nextVersion;
  fs.writeFileSync(path, `${JSON.stringify(raw, null, 2)}\n`);
};

updateJsonVersion("package.json");
updateJsonVersion("apps/desktop/package.json");

const lockPath = "package-lock.json";
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
lock.version = nextVersion;
if (lock.packages?.[""]) {
  lock.packages[""].version = nextVersion;
}
if (lock.packages?.["apps/desktop"]) {
  lock.packages["apps/desktop"].version = nextVersion;
}
fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);

const tauriPath = "apps/desktop/src-tauri/tauri.conf.json";
const tauri = JSON.parse(fs.readFileSync(tauriPath, "utf8"));
tauri.version = nextVersion;
fs.writeFileSync(tauriPath, `${JSON.stringify(tauri, null, 2)}\n`);

const replaceAll = (path, replacer) => {
  const current = fs.readFileSync(path, "utf8");
  const next = replacer(current);
  if (next !== current) {
    fs.writeFileSync(path, next);
  }
};

replaceAll("apps/desktop/src-tauri/Cargo.toml", (content) =>
  content.replace(`version = "${currentVersion}"`, `version = "${nextVersion}"`),
);

replaceAll("apps/desktop/src-tauri/Cargo.lock", (content) =>
  content.replace(`version = "${currentVersion}"`, `version = "${nextVersion}"`),
);

replaceAll("apps/desktop/src/App.tsx", (content) =>
  content.replace(`v${currentVersion}`, `v${nextVersion}`),
);

replaceAll("README.md", (content) =>
  content.replace(`Current development is on \`${currentVersion}\``, `Current development is on \`${nextVersion}\``),
);

replaceAll("CHANGELOG.md", (content) => {
  const currentHeader = `## [${currentVersion}] - Unreleased`;
  const nextHeader = `## [${nextVersion}] - Unreleased`;
  if (content.includes(currentHeader)) {
    return content.replace(currentHeader, nextHeader);
  }

  return `${content}\n## [${nextVersion}] - Unreleased\n\n### Planned\n\n- continue the active development checkpoint line\n`;
});
EOF

echo "Bumped development version from ${CURRENT_VERSION} to ${NEXT_VERSION}"
