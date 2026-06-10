#!/usr/bin/env bash

set -euo pipefail

TARGET_VERSION="${1:-}"

if [[ -z "${TARGET_VERSION}" ]]; then
  echo "usage: $0 <target-version>" >&2
  exit 2
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[fail] node is required" >&2
  exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

"${SCRIPT_DIR}/check-worktree-gate.sh"
"${SCRIPT_DIR}/check-version-gate.sh" "${TARGET_VERSION}"

failures=0

check_file_contains() {
  local file="$1"
  local pattern="$2"
  local pass_message="$3"
  local fail_message="$4"

  if grep -Fq "${pattern}" "${file}"; then
    echo "[pass] ${pass_message}"
  else
    echo "[fail] ${fail_message}"
    failures=$((failures + 1))
  fi
}

read_package_version() {
  node --input-type=module -e "import fs from 'node:fs'; const file = process.argv[1]; const json = JSON.parse(fs.readFileSync(file, 'utf8')); process.stdout.write(json.version);" "$1"
}

root_version="$(read_package_version package.json)"
desktop_version="$(read_package_version apps/desktop/package.json)"
tauri_version="$(node --input-type=module -e "import fs from 'node:fs'; const raw = fs.readFileSync('apps/desktop/src-tauri/tauri.conf.json', 'utf8'); process.stdout.write(JSON.parse(raw).version);")"
cargo_toml_version="$(node --input-type=module -e "import fs from 'node:fs'; const raw = fs.readFileSync('apps/desktop/src-tauri/Cargo.toml', 'utf8'); const match = raw.match(/^version = \"([^\"]+)\"/m); process.stdout.write(match ? match[1] : '');")"
package_lock_version="$(node --input-type=module -e "import fs from 'node:fs'; const raw = JSON.parse(fs.readFileSync('package-lock.json', 'utf8')); process.stdout.write(raw.version);")"
cargo_lock_version="$(node --input-type=module -e "import fs from 'node:fs'; const raw = fs.readFileSync('apps/desktop/src-tauri/Cargo.lock', 'utf8'); const match = raw.match(/name = \"opsprobe-desktop\"\\nversion = \"([^\"]+)\"/m); process.stdout.write(match ? match[1] : '');")"

for pair in \
  "package.json:${root_version}" \
  "apps/desktop/package.json:${desktop_version}" \
  "apps/desktop/src-tauri/tauri.conf.json:${tauri_version}" \
  "apps/desktop/src-tauri/Cargo.toml:${cargo_toml_version}" \
  "package-lock.json:${package_lock_version}" \
  "apps/desktop/src-tauri/Cargo.lock:${cargo_lock_version}"
do
  file="${pair%%:*}"
  version="${pair##*:}"
  if [[ "${version}" == "${TARGET_VERSION}" ]]; then
    echo "[pass] ${file} is aligned to ${TARGET_VERSION}"
  else
    echo "[fail] ${file} is ${version:-missing}, expected ${TARGET_VERSION}"
    failures=$((failures + 1))
  fi
done

release_notes_file="release-notes/v${TARGET_VERSION}.md"
if [[ -f "${release_notes_file}" ]]; then
  echo "[pass] ${release_notes_file} exists"
else
  echo "[fail] ${release_notes_file} is missing"
  failures=$((failures + 1))
fi

check_file_contains "CHANGELOG.md" "## [${TARGET_VERSION}] -" "CHANGELOG.md contains ${TARGET_VERSION}" "CHANGELOG.md is missing ${TARGET_VERSION}"
check_file_contains "README.md" "${TARGET_VERSION}" "README.md references ${TARGET_VERSION}" "README.md does not reference ${TARGET_VERSION}"
check_file_contains "apps/desktop/src/App.tsx" "${TARGET_VERSION} Current Release" "desktop app release copy references ${TARGET_VERSION}" "desktop app release copy is missing ${TARGET_VERSION}"

smoke_record=".opsprobe-validation/last-smoke.json"
if [[ -f "${smoke_record}" ]]; then
  smoke_version="$(node --input-type=module -e "import fs from 'node:fs'; const json = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); process.stdout.write(json.version ?? '');" "${smoke_record}")"
  if [[ "${smoke_version}" == "${TARGET_VERSION}" ]]; then
    echo "[pass] smoke validation record exists for ${TARGET_VERSION}"
  else
    echo "[fail] smoke validation record is for ${smoke_version:-unknown}, expected ${TARGET_VERSION}"
    failures=$((failures + 1))
  fi
else
  echo "[fail] smoke validation record is missing; run ./scripts/smoke-release-candidate.sh"
  failures=$((failures + 1))
fi

packaged_gate_record=".opsprobe-validation/desktop-packaged-gate.json"
if ./scripts/validate-desktop-packaged-gate.sh >/dev/null; then
  echo "[pass] desktop packaged gate passed for ${TARGET_VERSION}"
else
  echo "[fail] desktop packaged gate failed; inspect ${packaged_gate_record}"
  failures=$((failures + 1))
fi

if [[ "${failures}" -gt 0 ]]; then
  echo "Release readiness failed for version ${TARGET_VERSION}"
  exit 1
fi

echo "Release readiness passed for version ${TARGET_VERSION}"
