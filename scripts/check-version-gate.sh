#!/usr/bin/env bash

set -euo pipefail

REPO="${GITHUB_REPO:-ken-water/opsprobe}"
TARGET_VERSION="${1:-}"

if [[ -z "${TARGET_VERSION}" ]]; then
  echo "usage: $0 <target-version>" >&2
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "[fail] gh is required" >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "[fail] jq is required" >&2
  exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"${SCRIPT_DIR}/check-worktree-gate.sh"

MILESTONES_JSON="$(gh api "repos/${REPO}/milestones?state=all&per_page=100")"

failures=0

get_milestone() {
  local title="$1"
  jq -c --arg title "${title}" '.[] | select(.title == $title)' <<<"${MILESTONES_JSON}"
}

SEMVER_REGEX='^[0-9]+\.[0-9]+\.[0-9]+$'

if [[ ! "${TARGET_VERSION}" =~ ${SEMVER_REGEX} ]]; then
  echo "[fail] target version ${TARGET_VERSION} is not a valid semver milestone title" >&2
  exit 1
fi

mapfile -t VERSION_ORDER < <(
  {
    jq -r '.[].title' <<<"${MILESTONES_JSON}"
    printf '%s\n' "${TARGET_VERSION}"
  } | grep -E "${SEMVER_REGEX}" | sort -uV
)

TARGET_INDEX=-1
for i in "${!VERSION_ORDER[@]}"; do
  if [[ "${VERSION_ORDER[$i]}" == "${TARGET_VERSION}" ]]; then
    TARGET_INDEX="$i"
    break
  fi
done

if [[ "${TARGET_INDEX}" -lt 0 ]]; then
  echo "[fail] target version ${TARGET_VERSION} could not be placed in semver order" >&2
  exit 1
fi

if [[ "${TARGET_INDEX}" -gt 0 ]]; then
  PREVIOUS_VERSION="${VERSION_ORDER[$((TARGET_INDEX - 1))]}"
  PREVIOUS_MILESTONE="$(get_milestone "${PREVIOUS_VERSION}")"

  if [[ -z "${PREVIOUS_MILESTONE}" ]]; then
    echo "[fail] previous milestone ${PREVIOUS_VERSION} does not exist"
    failures=$((failures + 1))
  else
    PREVIOUS_STATE="$(jq -r '.state' <<<"${PREVIOUS_MILESTONE}")"
    if [[ "${PREVIOUS_STATE}" == "closed" ]]; then
      echo "[pass] previous milestone ${PREVIOUS_VERSION} is closed"
    else
      echo "[fail] previous milestone ${PREVIOUS_VERSION} is still open"
      failures=$((failures + 1))
    fi
  fi

  if gh release view "v${PREVIOUS_VERSION}" >/dev/null 2>&1; then
    echo "[pass] previous version v${PREVIOUS_VERSION} has a GitHub release"
  else
    echo "[fail] previous version v${PREVIOUS_VERSION} is missing a GitHub release"
    failures=$((failures + 1))
  fi

  if git ls-remote --exit-code --tags origin "refs/tags/v${PREVIOUS_VERSION}" >/dev/null 2>&1; then
    echo "[pass] previous version v${PREVIOUS_VERSION} tag exists on origin"
  else
    echo "[fail] previous version v${PREVIOUS_VERSION} tag is missing on origin"
    failures=$((failures + 1))
  fi
fi

open_earlier=0
for i in "${!VERSION_ORDER[@]}"; do
  if [[ "${i}" -ge "${TARGET_INDEX}" ]]; then
    break
  fi

  milestone="$(get_milestone "${VERSION_ORDER[$i]}")"
  if [[ -n "${milestone}" ]]; then
    count="$(jq -r '.open_issues' <<<"${milestone}")"
    open_earlier=$((open_earlier + count))
  fi
done

if [[ "${open_earlier}" -eq 0 ]]; then
  echo "[pass] no open issues found in milestones before ${TARGET_VERSION}"
else
  echo "[fail] found ${open_earlier} open issue(s) in milestones before ${TARGET_VERSION}"
  failures=$((failures + 1))
fi

TARGET_MILESTONE="$(get_milestone "${TARGET_VERSION}")"
if [[ -z "${TARGET_MILESTONE}" ]]; then
  echo "[fail] target milestone ${TARGET_VERSION} does not exist"
  failures=$((failures + 1))
else
  echo "[pass] target milestone ${TARGET_VERSION} exists"

  target_open="$(jq -r '.open_issues' <<<"${TARGET_MILESTONE}")"
  if [[ "${target_open}" -gt 0 ]]; then
    echo "[pass] target milestone ${TARGET_VERSION} has open issues ready for development"
  else
    echo "[fail] target milestone ${TARGET_VERSION} has no open issues"
    failures=$((failures + 1))
  fi
fi

if [[ "${failures}" -gt 0 ]]; then
  echo "Gate failed for version ${TARGET_VERSION}"
  exit 1
fi

echo "Gate passed for version ${TARGET_VERSION}"
