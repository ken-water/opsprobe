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

if [[ "${failures}" -gt 0 ]]; then
  echo "Checkpoint gate failed"
  exit 1
fi

echo "Checkpoint gate passed"
