# Clean User Profile Validation

This guide captures the minimum operator-facing evidence required by `0.11.0` / Issue `54`.

It is intentionally narrower than a full installer QA plan. The goal is to prove that OpsProbe can be bootstrapped, inspected, exported, stopped, restarted, and backed up from a fresh local profile without relying on undocumented tribal knowledge.

## Goal

Confirm that a new local user profile can:

1. start from an empty `~/.opsprobe`
2. understand what local prerequisites are missing
3. bootstrap the managed local runtime
4. complete at least one save / preview / export path
5. stop and restart the local service with explicit recovery guidance
6. collect the right backup and migration artifacts before machine replacement

## Preconditions

- the repo builds successfully
- `node`, `npm`, Rust, and Tauri dependencies are available
- if managed PostgreSQL validation is expected to pass, `postgres`, `pg_ctl`, and `initdb` are installed somewhere the local service can discover them
- `./scripts/validate-clean-user-profile.sh` assigns a temporary `OPSPROBE_POSTGRES_PORT` so repeated validation runs on one machine do not collide on port `15432`
- use a temporary `HOME` so the run simulates a clean local profile

Recommended build checks:

```bash
npm run env:check:strict
npm run desktop:typecheck
npm --workspace @opsprobe/desktop run build
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml --config 'source.crates-io.registry="sparse+https://index.crates.io/"'
```

Before the clean-profile flow begins, review `.opsprobe-validation/development-env-report.md` to confirm:

- the current machine can discover PostgreSQL binaries when managed runtime validation is expected
- the local-service status probe is understandable from an empty profile
- any missing optional tools are known before packaged or desktop-specific validation starts

## Validation Steps

### 1. Start from an empty local profile

Run:

```bash
export OPSPROBE_VALIDATION_HOME="$(mktemp -d)"
HOME="${OPSPROBE_VALIDATION_HOME}" npm run local-service:status
```

Expect:

- `~/.opsprobe` is created under the temporary home
- status output explains whether PostgreSQL binaries are visible, even when they are not on the default shell `PATH`
- status output includes `recoveryActions`
- if PostgreSQL binaries are missing, the operator can still tell what to install next

### 2. Bootstrap the managed runtime

Run:

```bash
HOME="${OPSPROBE_VALIDATION_HOME}" npm run local-service:postgres-bootstrap
HOME="${OPSPROBE_VALIDATION_HOME}" npm run local-service:postgres-start
HOME="${OPSPROBE_VALIDATION_HOME}" npm run local-service:status
```

Expect:

- bootstrap either succeeds or fails with an explicit prerequisite message
- if PostgreSQL binaries are available, status moves to a ready local runtime and shows the managed PostgreSQL process as healthy
- if PostgreSQL binaries are not available, the fallback and repair path is explicit instead of silent

### 3. Save an asset and preview an inspection

Run:

```bash
HOME="${OPSPROBE_VALIDATION_HOME}" node --experimental-strip-types ./apps/local-service/src/main.ts assets-upsert <<'EOF'
{"asset":{"id":"asset-clean-profile-001","name":"clean-profile-host","kind":"linux-host","protocol":"ssh","host":"192.0.2.90","port":22,"tags":["clean-profile"],"credential":{"method":"private-key","username":"opsprobe","secretRef":"/tmp/opsprobe-clean-profile-id_rsa"},"createdAt":"2026-06-08T00:00:00.000Z","updatedAt":"2026-06-08T00:00:00.000Z"}}
EOF

HOME="${OPSPROBE_VALIDATION_HOME}" node --experimental-strip-types ./apps/local-service/src/main.ts inspect-preview <<'EOF'
{"asset":{"id":"asset-clean-profile-001","name":"clean-profile-host","kind":"linux-host","protocol":"ssh","host":"192.0.2.90","port":22,"tags":["clean-profile"],"credential":{"method":"private-key","username":"opsprobe","secretRef":"/tmp/opsprobe-clean-profile-id_rsa"},"createdAt":"2026-06-08T00:00:00.000Z","updatedAt":"2026-06-08T00:00:00.000Z"}}
EOF
```

Expect:

- the asset is saved under the clean profile
- inspection preview returns structured results
- the local profile now contains usable runtime state without requiring manual database knowledge

### 4. Export a migration package and note backup scope

Run:

```bash
HOME="${OPSPROBE_VALIDATION_HOME}" node --experimental-strip-types ./apps/local-service/src/main.ts config-export <<EOF
{"path":"${OPSPROBE_VALIDATION_HOME}/opsprobe-config-export.json"}
EOF
```

Expect:

- the export package is created successfully
- the package records source-machine provenance
- operators can identify the three important backup scopes:
  - `~/.opsprobe/data`
  - `~/.opsprobe/runtime`
  - exported config package

### 5. Stop and restart with explicit recovery guidance

Run:

```bash
HOME="${OPSPROBE_VALIDATION_HOME}" npm run local-service:stop
HOME="${OPSPROBE_VALIDATION_HOME}" node --experimental-strip-types ./apps/local-service/src/main.ts restart
HOME="${OPSPROBE_VALIDATION_HOME}" npm run local-service:status
```

Expect:

- stop removes the active service PID marker when present
- restart returns explicit guidance instead of pretending the background process is already running
- status still exposes `recoveryActions` for the next operator step

### 6. Clean up the temporary profile

Run:

```bash
rm -rf "${OPSPROBE_VALIDATION_HOME}"
unset OPSPROBE_VALIDATION_HOME
```

## Evidence Record

For Issue `54`, capture at least:

- the exact commands used
- whether PostgreSQL binaries were present during the validation
- whether fallback behavior was understandable when prerequisites were missing
- where the operator had to infer steps that were not documented clearly enough
- whether backup and migration scope was obvious from docs and runtime messages

## Related References

- [Managed PostgreSQL Validation](./postgres-runtime-validation.md)
- [Storage Layout](./storage-layout.md)
- [Stable Release Readiness](./stable-readiness.md)
