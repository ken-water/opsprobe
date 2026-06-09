#!/usr/bin/env bash

set -euo pipefail

if ! command -v git >/dev/null 2>&1; then
  echo "[fail] git is required" >&2
  exit 2
fi

failures=0

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[fail] current directory is not inside a git repository"
  exit 2
fi

branch="$(git rev-parse --abbrev-ref HEAD)"
current_version="$(node --input-type=module -e "import fs from 'node:fs'; const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); process.stdout.write(pkg.version);")"
latest_tag="$(git describe --tags --abbrev=0 2>/dev/null || true)"

if [[ -n "$(git status --short)" ]]; then
  echo "[fail] working tree is not clean"
  failures=$((failures + 1))
else
  echo "[pass] working tree is clean"
fi

if git rev-parse --abbrev-ref "${branch}@{upstream}" >/dev/null 2>&1; then
  upstream="$(git rev-parse --abbrev-ref "${branch}@{upstream}")"
  echo "[pass] branch ${branch} tracks ${upstream}"

  counts="$(git rev-list --left-right --count "${branch}@{upstream}...HEAD")"
  behind="$(awk '{print $1}' <<<"${counts}")"
  ahead="$(awk '{print $2}' <<<"${counts}")"

  if [[ "${ahead}" -eq 0 ]]; then
    echo "[pass] no unpushed commits"
  else
    echo "[fail] found ${ahead} unpushed commit(s)"
    failures=$((failures + 1))
  fi

  if [[ "${behind}" -eq 0 ]]; then
    echo "[pass] local branch is not behind upstream"
  else
    echo "[fail] local branch is behind upstream by ${behind} commit(s)"
    failures=$((failures + 1))
  fi
else
  echo "[fail] branch ${branch} has no upstream tracking branch"
  failures=$((failures + 1))
fi

if [[ -n "${latest_tag}" ]]; then
  latest_tag_version="${latest_tag#v}"
  latest_tag_commit="$(git rev-list -n 1 "${latest_tag}")"
  head_commit="$(git rev-parse HEAD)"

  if [[ "${current_version}" == "${latest_tag_version}" && "${head_commit}" != "${latest_tag_commit}" ]]; then
    echo "[fail] current version ${current_version} still matches latest tag ${latest_tag} while new commits exist; bump the development version before continuing"
    failures=$((failures + 1))
  elif [[ "${current_version}" == "${latest_tag_version}" ]]; then
    echo "[pass] current version ${current_version} matches latest published tag at the same commit"
  else
    echo "[pass] current development version ${current_version} is distinct from latest published tag ${latest_tag_version}"
  fi
else
  echo "[pass] no published git tag found yet"
fi

if [[ "${failures}" -gt 0 ]]; then
  echo "Checkpoint gate failed"
  exit 1
fi

echo "Checkpoint gate passed"
