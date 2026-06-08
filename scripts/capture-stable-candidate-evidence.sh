#!/usr/bin/env bash

set -euo pipefail

allow_dirty=""
target_version=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --allow-dirty)
      allow_dirty="--allow-dirty"
      shift
      ;;
    --target-version)
      target_version="${2:-}"
      shift 2
      ;;
    *)
      echo "usage: $0 [--allow-dirty] [--target-version <version>]" >&2
      exit 2
      ;;
  esac
done

version="${target_version:-$(node --input-type=module -e 'import fs from "node:fs"; const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); process.stdout.write(pkg.version);')}"
captured_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
validation_dir=".opsprobe-validation"
mkdir -p "${validation_dir}"

notes_file="${validation_dir}/stable-candidate-notes.md"
checkpoint_file="${validation_dir}/stable-candidate-checkpoint.txt"

if [[ "${allow_dirty}" == "--allow-dirty" ]]; then
  git status --short > "${validation_dir}/stable-worktree-gate.txt"
  {
    echo "[warn] check-worktree-gate skipped because --allow-dirty was requested"
    echo "[warn] current working tree state:"
    cat "${validation_dir}/stable-worktree-gate.txt"
  } > "${validation_dir}/stable-worktree-gate-summary.txt"
else
  ./scripts/check-worktree-gate.sh > "${validation_dir}/stable-worktree-gate.txt"
  cp "${validation_dir}/stable-worktree-gate.txt" "${validation_dir}/stable-worktree-gate-summary.txt"
fi

if [[ "${allow_dirty}" == "--allow-dirty" ]]; then
  if ./scripts/check-version-gate.sh "${version}" > "${validation_dir}/stable-version-gate.txt" 2>&1; then
    :
  else
    {
      echo "[warn] check-version-gate did not fully pass during --allow-dirty capture"
      cat "${validation_dir}/stable-version-gate.txt"
    } > "${validation_dir}/stable-version-gate-summary.txt"
  fi
  if [[ ! -f "${validation_dir}/stable-version-gate-summary.txt" ]]; then
    cp "${validation_dir}/stable-version-gate.txt" "${validation_dir}/stable-version-gate-summary.txt"
  fi
else
  ./scripts/check-version-gate.sh "${version}" > "${validation_dir}/stable-version-gate.txt"
  cp "${validation_dir}/stable-version-gate.txt" "${validation_dir}/stable-version-gate-summary.txt"
fi

./scripts/validate-clean-user-profile.sh

{
  echo "OpsProbe Stable-Candidate Evidence"
  echo "version=${version}"
  echo "captured_at=${captured_at}"
  echo "node=$(node --version)"
  echo "npm=$(npm --version)"
  if command -v cargo >/dev/null 2>&1; then
    echo "cargo=$(cargo --version)"
  else
    echo "cargo=missing"
  fi
  if command -v postgres >/dev/null 2>&1; then
    echo "postgres=$(postgres --version)"
  else
    echo "postgres=missing"
  fi
  if command -v pg_ctl >/dev/null 2>&1; then
    echo "pg_ctl=$(pg_ctl --version)"
  else
    echo "pg_ctl=missing"
  fi
  if command -v initdb >/dev/null 2>&1; then
    echo "initdb=$(initdb --version)"
  else
    echo "initdb=missing"
  fi
} > "${checkpoint_file}"

cat > "${notes_file}" <<EOF
# Stable Candidate Evidence Snapshot

Captured at: ${captured_at}

Version: ${version}

## Environment Summary

\`\`\`text
$(cat "${checkpoint_file}")
\`\`\`

## Gate Outputs

### Checkpoint Gate

\`\`\`text
$(cat "${validation_dir}/stable-worktree-gate-summary.txt")
\`\`\`

### Version Gate

\`\`\`text
$(cat "${validation_dir}/stable-version-gate-summary.txt")
\`\`\`

## Clean User Profile Validation

- Command: \`./scripts/validate-clean-user-profile.sh\`
- Result: passed

## Next Step

Fill in [docs/stable-candidate-operator-notes.md](../docs/stable-candidate-operator-notes.md) with operator observations from the same validation run.
EOF
