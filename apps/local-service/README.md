# OpsProbe Local Service

This service will own long-running local runtime responsibilities for the desktop edition:

- managed PostgreSQL lifecycle
- task scheduling
- inspection execution orchestration
- persistence and migrations
- local health reporting for the desktop UI

The first `0.3.0` skeleton defines the service boundary and bootstrap contract.

## Current Skeleton

The current service entrypoint can emit a structured runtime snapshot:

```bash
npm run local-service:status
```

It can also execute a service-owned inspection run and read back recent persisted runs:

```bash
npm run local-service:postgres-bootstrap
npm run local-service:postgres-start
npm run local-service:postgres-stop
npm run local-service:inspect-run
npm run local-service:inspection-history
```

Current runtime progress:

- `status` now probes PostgreSQL binary availability, port availability, and whether the managed data directory has been initialized
- `postgres-bootstrap` runs `initdb` for the dedicated OpsProbe PostgreSQL data directory and writes OpsProbe-owned port/listen overrides
- `postgres-start` and `postgres-stop` now control the managed PostgreSQL lifecycle through `pg_ctl`
- inspection persistence now prefers PostgreSQL when the managed runtime is ready, and clearly falls back to the local file adapter when PostgreSQL is unavailable
- when PostgreSQL becomes available, existing file-backed inspection run history is migrated into PostgreSQL automatically via idempotent upserts
- the built-in Linux baseline template is persisted automatically so exports and migrations always include a usable default template
- schedules and desktop state now use the same active storage boundary as assets, templates, and runs
- legacy `~/.opsprobe/config/desktop-settings.json` and `~/.opsprobe/config/inspection-schedules.json` files are migrated into the active state store automatically when detected

Current known limits before `1.0.0`:

- malformed local file storage and malformed persisted status files now trigger automatic quarantine-and-rebuild behavior, but broader crash recovery is still best-effort rather than a full supervisor design
- status recovery now preserves a persisted `stopped` state, but broader crash-recovery semantics are still best-effort rather than a full supervisor design
- export and import flows now block recurring schedules until rebound credentials pass SSH validation, but broader credential-repair UX is still desktop-driven rather than fully workflow-guided

See also:

- [Storage Layout](../../docs/storage-layout.md)
