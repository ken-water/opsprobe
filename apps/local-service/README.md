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
- desktop state such as the active asset, history filters, schedule interval, and export paths is stored in `~/.opsprobe/config/desktop-settings.json`
- schedules remain file-backed in `~/.opsprobe/config/inspection-schedules.json`, while assets/templates/runs prefer PostgreSQL and fall back to the local JSON storage adapter when PostgreSQL is not ready
