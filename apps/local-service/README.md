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
npm run local-service:inspect-run
npm run local-service:inspection-history
```

This is still a stepping stone toward a real managed local process that the desktop UI can probe and control.
For now, the service persists runs through a transitional local file adapter until the managed PostgreSQL runtime in `#21` is wired in.
