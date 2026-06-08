#!/usr/bin/env bash

set -euo pipefail

tmp_home="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_home"
}
trap cleanup EXIT

asset_payload='{
  "asset": {
    "id": "asset-clean-profile-001",
    "name": "clean-profile-host",
    "kind": "linux-host",
    "protocol": "ssh",
    "host": "192.0.2.90",
    "port": 22,
    "tags": ["clean-profile"],
    "credential": {
      "method": "private-key",
      "username": "opsprobe",
      "secretRef": "/tmp/opsprobe-clean-profile-id_rsa"
    },
    "createdAt": "2026-06-08T00:00:00.000Z",
    "updatedAt": "2026-06-08T00:00:00.000Z"
  }
}'

status_json="$(HOME="$tmp_home" node --experimental-strip-types ./apps/local-service/src/main.ts status)"
printf '%s' "$status_json" | node --input-type=module -e '
  let raw = "";
  process.stdin.on("data", (chunk) => {
    raw += chunk;
  });
  process.stdin.on("end", () => {
    const response = JSON.parse(raw);
    const recoveryActions = response.snapshot?.recoveryActions ?? [];
    if (!response.ok || !Array.isArray(recoveryActions) || recoveryActions.length === 0) {
      process.exit(1);
    }
  });
'

HOME="$tmp_home" node --experimental-strip-types ./apps/local-service/src/main.ts assets-upsert <<<"$asset_payload" >/dev/null

preview_json="$(HOME="$tmp_home" node --experimental-strip-types ./apps/local-service/src/main.ts inspect-preview <<'EOF'
{
  "asset": {
    "id": "asset-clean-profile-001",
    "name": "clean-profile-host",
    "kind": "linux-host",
    "protocol": "ssh",
    "host": "192.0.2.90",
    "port": 22,
    "tags": ["clean-profile"],
    "credential": {
      "method": "private-key",
      "username": "opsprobe",
      "secretRef": "/tmp/opsprobe-clean-profile-id_rsa"
    },
    "createdAt": "2026-06-08T00:00:00.000Z",
    "updatedAt": "2026-06-08T00:00:00.000Z"
  }
}
EOF
)"

printf '%s' "$preview_json" | node --input-type=module -e '
  let raw = "";
  process.stdin.on("data", (chunk) => {
    raw += chunk;
  });
  process.stdin.on("end", () => {
    const response = JSON.parse(raw);
    if (!response.ok || !response.run || !Array.isArray(response.run.results) || response.run.results.length === 0) {
      process.exit(1);
    }
  });
'

export_path="$tmp_home/opsprobe-config-export.json"
HOME="$tmp_home" node --experimental-strip-types ./apps/local-service/src/main.ts config-export <<EOF >/dev/null
{
  "path": "$export_path"
}
EOF

EXPORT_PATH="$export_path" node --input-type=module -e '
  import { readFileSync } from "node:fs";

  const exportedPackage = JSON.parse(readFileSync(process.env.EXPORT_PATH, "utf8"));
  if (!exportedPackage.origin?.machineName || !exportedPackage.origin?.exportedFromRoot) {
    process.exit(1);
  }
'

stop_json="$(HOME="$tmp_home" node --experimental-strip-types ./apps/local-service/src/main.ts stop)"
printf '%s' "$stop_json" | node --input-type=module -e '
  let raw = "";
  process.stdin.on("data", (chunk) => {
    raw += chunk;
  });
  process.stdin.on("end", () => {
    const response = JSON.parse(raw);
    if (!response.ok || typeof response.message !== "string" || response.message.length === 0) {
      process.exit(1);
    }
  });
'

restart_json="$(HOME="$tmp_home" node --experimental-strip-types ./apps/local-service/src/main.ts restart)"
printf '%s' "$restart_json" | node --input-type=module -e '
  let raw = "";
  process.stdin.on("data", (chunk) => {
    raw += chunk;
  });
  process.stdin.on("end", () => {
    const response = JSON.parse(raw);
    if (!response.ok || !String(response.message).includes("Start Service again")) {
      process.exit(1);
    }
  });
'

final_status_json="$(HOME="$tmp_home" node --experimental-strip-types ./apps/local-service/src/main.ts status)"
printf '%s' "$final_status_json" | node --input-type=module -e '
  let raw = "";
  process.stdin.on("data", (chunk) => {
    raw += chunk;
  });
  process.stdin.on("end", () => {
    const response = JSON.parse(raw);
    const recoveryActions = response.snapshot?.recoveryActions ?? [];
    if (!response.ok || !Array.isArray(recoveryActions) || recoveryActions.length === 0) {
      process.exit(1);
    }
  });
'
