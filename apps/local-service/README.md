# OpsProbe Local Service

This service will own long-running local runtime responsibilities for the desktop edition:

- managed PostgreSQL lifecycle
- task scheduling
- inspection execution orchestration
- persistence and migrations
- local health reporting for the desktop UI

The first `0.3.0` skeleton defines the service boundary and bootstrap contract.
