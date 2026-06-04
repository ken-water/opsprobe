# Managed PostgreSQL Validation

This checklist is the acceptance path for issue `#21`.

Use it on a machine where PostgreSQL command line binaries are available to the OpsProbe local service process:

- `postgres`
- `pg_ctl`
- `initdb`

## Goal

Confirm that OpsProbe can:

1. bootstrap its dedicated PostgreSQL data directory
2. start and stop the managed PostgreSQL runtime
3. prefer PostgreSQL-backed inspection run storage
4. migrate existing file-backed inspection history into PostgreSQL

## Preconditions

- The local machine has PostgreSQL binaries available in `PATH`
- No unrelated process is already bound to port `15432`
- The test user can write under `~/.opsprobe`
- The repo builds successfully before runtime validation starts

Recommended pre-checks:

```bash
npm run desktop:typecheck
npm --workspace @opsprobe/desktop run build
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml --config 'source.crates-io.registry="sparse+https://index.crates.io/"'
```

## Validation Steps

### 1. Confirm prerequisite visibility

Run:

```bash
npm run local-service:status
```

Expect:

- `postgres.binary.postgres` is `pass`
- `postgres.binary.pg_ctl` is `pass`
- `postgres.binary.initdb` is `pass`
- `postgres.port` is `pass`

### 2. Bootstrap the managed data directory

Run:

```bash
npm run local-service:postgres-bootstrap
```

Expect:

- command returns `ok: true`
- `~/.opsprobe/data/postgres/PG_VERSION` exists
- `postgresql.auto.conf` contains the OpsProbe-managed port and local listen settings
- `pg_hba.conf` contains the local trust rule written by OpsProbe

### 3. Start managed PostgreSQL directly

Run:

```bash
npm run local-service:postgres-start
npm run local-service:status
```

Expect:

- `postgres.process` becomes `pass`
- `health.status` becomes `ready`
- `storage.backend` becomes `pass`
- `storage.backend` mentions PostgreSQL rather than local file fallback

### 4. Verify inspection run persistence goes to PostgreSQL

Run:

```bash
npm run local-service:inspect-run <<'EOF'
{"asset":{"id":"asset-pg-validation-001","name":"pg-validation-host","kind":"linux-host","protocol":"ssh","host":"203.0.113.30","port":22,"tags":["pg","validation"],"credential":{"method":"private-key","username":"root","secretRef":"/home/user/.ssh/id_rsa"},"createdAt":"2026-06-04T00:00:00.000Z","updatedAt":"2026-06-04T00:00:00.000Z"}}
EOF

npm run local-service:inspection-history
```

Expect:

- the inspection run is visible in history
- history remains readable after a second status check
- the active storage backend in `status` still reports PostgreSQL

Optional direct database check:

```bash
psql -h /home/$USER/.opsprobe/runtime -p 15432 -U opsprobe -d postgres -c "select id, created_at from opsprobe_inspection_runs order by created_at desc limit 5;"
```

Expect:

- the latest inspection run appears in `opsprobe_inspection_runs`

### 5. Verify automatic migration from file storage

Prepare:

- ensure `~/.opsprobe/data/opsprobe-storage.json` contains at least one historical inspection run that is not yet in PostgreSQL

Run:

```bash
npm run local-service:status
```

Expect:

- `storage.backend` reports PostgreSQL
- `storage.backend` mentions migrated file-backed inspection runs if migration occurred
- migrated runs appear in `npm run local-service:inspection-history`
- migrated runs are queryable from `opsprobe_inspection_runs`

### 6. Verify local-service managed lifecycle

Run:

```bash
npm run local-service:serve
```

In another terminal:

```bash
npm run local-service:status
npm run local-service:stop
npm run local-service:status
```

Expect:

- `serve` attempts to start PostgreSQL automatically
- while running, `service.process` is `pass`
- after `stop`, the local-service pid file is removed
- after `stop`, PostgreSQL is no longer running

## Issue Close Criteria

Issue `#21` is ready to close when all of the following are true on a real validation machine:

- bootstrap succeeds
- start succeeds
- stop succeeds
- PostgreSQL-backed inspection run persistence succeeds
- file-backed history migration succeeds
- local-service status accurately reflects PostgreSQL and storage backend state
- no manual PostgreSQL setup steps are required beyond shipping the binaries in the target distribution

## Known Non-Blocking Limits

These do not block closing `#21` by themselves:

- assets and templates are still stubbed in PostgreSQL if inspection run persistence is working
- the validation target uses a local test host that returns failed inspection runs, as long as the persistence path itself is proven
- the desktop still retains legacy comparison views unrelated to PostgreSQL storage
