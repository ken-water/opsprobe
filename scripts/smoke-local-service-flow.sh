#!/usr/bin/env bash

set -euo pipefail

tmp_home="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_home"
}
trap cleanup EXIT

asset_payload='{
  "asset": {
    "id": "asset-smoke-001",
    "name": "smoke-preview-host",
    "kind": "linux-host",
    "protocol": "ssh",
    "host": "192.0.2.20",
    "port": 22,
    "tags": ["smoke", "preview"],
    "credential": {
      "method": "private-key",
      "username": "opsprobe",
      "secretRef": "/tmp/opsprobe-smoke-id_rsa"
    },
    "createdAt": "2026-06-05T00:00:00.000Z",
    "updatedAt": "2026-06-05T00:00:00.000Z"
  }
}'

HOME="$tmp_home" node --experimental-strip-types ./apps/local-service/src/main.ts assets-upsert <<<"$asset_payload" >/dev/null

assets_json="$(HOME="$tmp_home" node --experimental-strip-types ./apps/local-service/src/main.ts assets-list)"
printf '%s' "$assets_json" | node --input-type=module -e '
  let raw = "";
  process.stdin.on("data", (chunk) => {
    raw += chunk;
  });
  process.stdin.on("end", () => {
    const response = JSON.parse(raw);
    if (!response.ok || !response.assets.some((asset) => asset.id === "asset-smoke-001")) {
      process.exit(1);
    }
  });
'

preview_json="$(HOME="$tmp_home" node --experimental-strip-types ./apps/local-service/src/main.ts inspect-preview <<'EOF'
{
  "asset": {
    "id": "asset-smoke-001",
    "name": "smoke-preview-host",
    "kind": "linux-host",
    "protocol": "ssh",
    "host": "192.0.2.20",
    "port": 22,
    "tags": ["smoke", "preview"],
    "credential": {
      "method": "private-key",
      "username": "opsprobe",
      "secretRef": "/tmp/opsprobe-smoke-id_rsa"
    },
    "createdAt": "2026-06-05T00:00:00.000Z",
    "updatedAt": "2026-06-05T00:00:00.000Z"
  },
  "templateId": "template.linux.nginx.edge"
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
    if (!response.ok || !response.run || !Array.isArray(response.run.results)) {
      process.exit(1);
    }

    const checkIds = response.run.results.map((result) => result.checkId);
    const required = [
      "linux.nginx.upstream.hints",
      "linux.nginx.log.risk",
      "linux.nginx.tls.posture",
      "linux.nginx.config.drift.hints"
    ];

    if (!required.every((checkId) => checkIds.includes(checkId))) {
      process.exit(1);
    }
  });
'

report_path="$tmp_home/preview-operator-report.html"
printf '%s' "$preview_json" | REPORT_PATH="$report_path" SMOKE_HOME="$tmp_home" node --input-type=module -e '
  import { readFileSync } from "node:fs";
  import { spawnSync } from "node:child_process";

  let raw = "";
  process.stdin.on("data", (chunk) => {
    raw += chunk;
  });
  process.stdin.on("end", () => {
    const response = JSON.parse(raw);
    if (!response.ok || !response.run || response.run.results.length === 0) {
      process.exit(1);
    }

    const payload = JSON.stringify({
      path: process.env.REPORT_PATH,
      run: response.run,
      asset: {
        id: "asset-smoke-001",
        name: "smoke-preview-host",
        kind: "linux-host",
        protocol: "ssh",
        host: "192.0.2.20",
        port: 22,
        tags: ["smoke", "preview"],
        credential: {
          method: "private-key",
          username: "opsprobe",
          secretRef: "/tmp/opsprobe-smoke-id_rsa"
        },
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z"
      },
      audience: "operator"
    });

    const command = spawnSync(
      "node",
      ["--experimental-strip-types", "./apps/local-service/src/main.ts", "report-export-html"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          HOME: process.env.SMOKE_HOME,
        },
        input: payload,
        encoding: "utf8",
      },
    );

    if (command.status !== 0) {
      process.exit(command.status ?? 1);
    }

    const exportResponse = JSON.parse(command.stdout);
    const html = readFileSync(process.env.REPORT_PATH, "utf8");
    if (!exportResponse.ok || !html.includes("Action Queue") || !html.includes("smoke-preview-host")) {
      process.exit(1);
    }
  });
'

manager_report_path="$tmp_home/preview-manager-report.html"
printf '%s' "$preview_json" | REPORT_PATH="$manager_report_path" SMOKE_HOME="$tmp_home" node --input-type=module -e '
  import { readFileSync } from "node:fs";
  import { spawnSync } from "node:child_process";

  let raw = "";
  process.stdin.on("data", (chunk) => {
    raw += chunk;
  });
  process.stdin.on("end", () => {
    const response = JSON.parse(raw);
    if (!response.ok || !response.run || response.run.results.length === 0) {
      process.exit(1);
    }

    const payload = JSON.stringify({
      path: process.env.REPORT_PATH,
      run: response.run,
      asset: {
        id: "asset-smoke-001",
        name: "smoke-preview-host",
        kind: "linux-host",
        protocol: "ssh",
        host: "192.0.2.20",
        port: 22,
        tags: ["smoke", "preview"],
        credential: {
          method: "private-key",
          username: "opsprobe",
          secretRef: "/tmp/opsprobe-smoke-id_rsa"
        },
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z"
      },
      audience: "manager"
    });

    const command = spawnSync(
      "node",
      ["--experimental-strip-types", "./apps/local-service/src/main.ts", "report-export-html"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          HOME: process.env.SMOKE_HOME,
        },
        input: payload,
        encoding: "utf8",
      },
    );

    if (command.status !== 0) {
      process.exit(command.status ?? 1);
    }

    const exportResponse = JSON.parse(command.stdout);
    const html = readFileSync(process.env.REPORT_PATH, "utf8");
    if (!exportResponse.ok || !html.includes("Priority Actions") || !html.includes("Lead Queue Item")) {
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
  if (!Array.isArray(exportedPackage.assets) || exportedPackage.assets.length === 0) {
    process.exit(1);
  }

  const firstAsset = exportedPackage.assets[0];
  if (firstAsset.credential.bindingStatus !== "rebind-required") {
    process.exit(1);
  }

  if ("secretRef" in firstAsset.credential) {
    process.exit(1);
  }
'

import_home="$(mktemp -d)"
trap 'rm -rf "$tmp_home" "$import_home"' EXIT
cp "$export_path" "$import_home/import.json"

import_response="$(HOME="$import_home" node --experimental-strip-types ./apps/local-service/src/main.ts config-import <<EOF
{
  "path": "$import_home/import.json"
}
EOF
)"

printf '%s' "$import_response" | node --input-type=module -e '
  let raw = "";
  process.stdin.on("data", (chunk) => {
    raw += chunk;
  });
  process.stdin.on("end", () => {
    const response = JSON.parse(raw);
    if (!response.ok || response.importedAssets < 1 || response.importedTemplates < 1) {
      process.exit(1);
    }
  });
'

imported_assets_json="$(HOME="$import_home" node --experimental-strip-types ./apps/local-service/src/main.ts assets-list)"
printf '%s' "$imported_assets_json" | node --input-type=module -e '
  let raw = "";
  process.stdin.on("data", (chunk) => {
    raw += chunk;
  });
  process.stdin.on("end", () => {
    const response = JSON.parse(raw);
    const importedAsset = response.assets.find((asset) => asset.id === "asset-smoke-001");
    if (!response.ok || !importedAsset) {
      process.exit(1);
    }

    if (importedAsset.credential.bindingStatus !== "rebind-required" || importedAsset.credential.secretRef !== "") {
      process.exit(1);
    }
  });
'

mysql_preview_json="$(HOME="$tmp_home" node --experimental-strip-types ./apps/local-service/src/main.ts inspect-preview <<'EOF'
{
  "asset": {
    "id": "asset-smoke-001",
    "name": "smoke-preview-host",
    "kind": "linux-host",
    "protocol": "ssh",
    "host": "192.0.2.20",
    "port": 22,
    "tags": ["smoke", "preview"],
    "credential": {
      "method": "private-key",
      "username": "opsprobe",
      "secretRef": "/tmp/opsprobe-smoke-id_rsa"
    },
    "createdAt": "2026-06-05T00:00:00.000Z",
    "updatedAt": "2026-06-05T00:00:00.000Z"
  },
  "templateId": "template.linux.mysql"
}
EOF
)"

printf '%s' "$mysql_preview_json" | node --input-type=module -e '
  let raw = "";
  process.stdin.on("data", (chunk) => {
    raw += chunk;
  });
  process.stdin.on("end", () => {
    const response = JSON.parse(raw);
    if (!response.ok || !response.run || !Array.isArray(response.run.results)) {
      process.exit(1);
    }

    const checkIds = response.run.results.map((result) => result.checkId);
    const required = [
      "linux.mysql.connection.pressure",
      "linux.mysql.replication.hints",
      "linux.mysql.slow-query.risk",
      "linux.mysql.temp-disk-table.risk"
    ];

    if (!required.every((checkId) => checkIds.includes(checkId))) {
      process.exit(1);
    }
  });
'

redis_preview_json="$(HOME="$tmp_home" node --experimental-strip-types ./apps/local-service/src/main.ts inspect-preview <<'EOF'
{
  "asset": {
    "id": "asset-smoke-001",
    "name": "smoke-preview-host",
    "kind": "linux-host",
    "protocol": "ssh",
    "host": "192.0.2.20",
    "port": 22,
    "tags": ["smoke", "preview"],
    "credential": {
      "method": "private-key",
      "username": "opsprobe",
      "secretRef": "/tmp/opsprobe-smoke-id_rsa"
    },
    "createdAt": "2026-06-05T00:00:00.000Z",
    "updatedAt": "2026-06-05T00:00:00.000Z"
  },
  "templateId": "template.linux.redis"
}
EOF
)"

printf '%s' "$redis_preview_json" | node --input-type=module -e '
  let raw = "";
  process.stdin.on("data", (chunk) => {
    raw += chunk;
  });
  process.stdin.on("end", () => {
    const response = JSON.parse(raw);
    if (!response.ok || !response.run || !Array.isArray(response.run.results)) {
      process.exit(1);
    }

    const checkIds = response.run.results.map((result) => result.checkId);
    const required = [
      "linux.redis.memory.pressure",
      "linux.redis.persistence.risk",
      "linux.redis.blocking.risk",
      "linux.redis.eviction.risk"
    ];

    if (!required.every((checkId) => checkIds.includes(checkId))) {
      process.exit(1);
    }
  });
'
