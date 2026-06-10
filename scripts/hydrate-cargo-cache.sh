#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"

lockfile="${1:-${repo_root}/apps/desktop/src-tauri/Cargo.lock}"
mirror_api_bases="${CARGO_CRATE_DOWNLOAD_BASES:-}"
if [[ -z "${mirror_api_bases}" ]]; then
  if [[ -n "${CARGO_CRATE_DOWNLOAD_BASE:-}" ]]; then
    mirror_api_bases="${CARGO_CRATE_DOWNLOAD_BASE}"
  else
    mirror_api_bases="https://rsproxy.cn/api/v1/crates https://crates.io/api/v1/crates"
  fi
fi
cargo_home="${CARGO_HOME:-$HOME/.cargo}"
cache_dir="${cargo_home}/registry/cache/rsproxy.cn-e3de039b2554c837"
preloaded_crate_dirs="${OPSPROBE_PRELOADED_CRATE_DIRS:-}"

if [[ ! -f "${lockfile}" ]]; then
  echo "lockfile not found: ${lockfile}" >&2
  exit 1
fi

mkdir -p "${cache_dir}"

python3 - "${lockfile}" "${mirror_api_bases}" "${cache_dir}" "${preloaded_crate_dirs}" <<'PY'
import os
import pathlib
import shutil
import sys
import tomllib
import urllib.error
import urllib.parse
import urllib.request

lockfile = pathlib.Path(sys.argv[1])
mirror_api_bases = [base.rstrip("/") for base in sys.argv[2].split() if base.strip()]
cache_dir = pathlib.Path(sys.argv[3])
preloaded_crate_dirs = [
    pathlib.Path(path).expanduser()
    for path in os.environ.get("OPSPROBE_PRELOADED_CRATE_DIRS", "").split(os.pathsep)
    if path.strip()
]

packages = tomllib.loads(lockfile.read_text()).get("package", [])
downloaded = 0
preloaded = 0
skipped = 0
failed = []

for package in packages:
    source = package.get("source", "")
    if not source.startswith("registry+"):
        continue

    name = package["name"]
    version = package["version"]
    crate_name = f"{name}-{version}.crate"
    crate_path = cache_dir / crate_name
    if crate_path.exists():
        skipped += 1
        continue

    copied = False
    for preloaded_dir in preloaded_crate_dirs:
        candidate = preloaded_dir / crate_name
        if candidate.exists():
            crate_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(candidate, crate_path)
            preloaded += 1
            copied = True
            print(f"[preloaded] {crate_name} via {candidate}")
            break
    if copied:
        continue

    errors = []
    for mirror_api_base in mirror_api_bases:
        url = f"{mirror_api_base}/{urllib.parse.quote(name)}/{urllib.parse.quote(version)}/download"
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                crate_path.write_bytes(response.read())
            downloaded += 1
            print(f"[downloaded] {crate_name} via {mirror_api_base}")
            break
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            errors.append(f"{mirror_api_base}: {error}")
    else:
        failed.append((crate_name, "; ".join(errors)))
        print(f"[failed] {crate_name}: {'; '.join(errors)}", file=sys.stderr)

print(
    f"[summary] downloaded={downloaded} preloaded={preloaded} skipped={skipped} failed={len(failed)}"
)
if failed:
    sys.exit(1)
PY
