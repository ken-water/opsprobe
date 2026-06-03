# OpsProbe Architecture

## Design Principles

- Local-first: core inspection workflows must run without a cloud dependency
- Reusable core: inspection logic should not be tightly coupled to the desktop UI
- Simple deployment: the open source edition should be easy to run and demo
- Structured outputs: every inspection result should be machine-readable and report-friendly
- PostgreSQL-first storage: the product should standardize on a dedicated PostgreSQL runtime instead of splitting storage behavior across SQLite and PostgreSQL

## Product Split

### Desktop

The desktop application is the primary open source delivery form.

Responsibilities:

- Local asset management
- Result viewing
- Report generation and export
- First-run setup and local service status
- Delegating inspection and storage operations to the local service

### Local Service

The desktop edition should run with an OpsProbe-managed local service.

Responsibilities:

- Manage the dedicated local PostgreSQL instance
- Own task scheduling and inspection execution
- Provide a stable local API for the desktop UI
- Handle schema initialization and migrations
- Own persistence, caching, and backup hooks

### Web

The web product is not part of the first open source MVP, but the architecture should leave room for it.

Future responsibilities:

- Published report viewing
- Historical trend browsing
- Customer login and access control
- Team collaboration

## Logical Modules

```text
apps/
  desktop/        -> Tauri application shell and UI
  local-service/  -> local background service and PostgreSQL lifecycle management

packages/
  core/      -> domain models, rules, result schema
  runner/    -> task scheduling and execution orchestration
  checks/    -> built-in inspection checks
  report/    -> report rendering and export
  storage/   -> storage contracts and PostgreSQL adapters
  shared/    -> shared types, constants, utilities
```

## Module Responsibilities

### `apps/desktop`

- Tauri shell
- Frontend views
- First-run guidance
- Local service health display
- Invokes reusable core services over a local boundary

The desktop layer should avoid embedding business logic and direct persistence concerns wherever possible.

### `apps/local-service`

- Lifecycle management for the local PostgreSQL runtime
- Inspection scheduling and execution
- Data access orchestration
- Migration and bootstrap workflow
- Backup/export hooks

This service should be the single owner of durable local state.

### `packages/core`

- Asset model
- Inspection template model
- Check result schema
- Severity and status model
- Remediation suggestion model

This package defines the shared business language across the application.

### `packages/runner`

- Manual execution flow
- Scheduled execution flow
- Concurrency and timeout handling
- Execution lifecycle events

This package coordinates how checks are run, but does not own UI concerns.

### `packages/checks`

- Built-in Linux host checks
- Standardized output adapters
- Evidence collection logic

Checks should be implemented with a stable interface so new protocols and device types can be added later.

### `packages/report`

- Report view model generation
- HTML rendering
- PDF export pipeline

Report generation should consume structured results instead of raw command output.

### `packages/storage`

- Storage contracts
- PostgreSQL repository implementations
- Migration definitions
- Backup/export helpers

The storage layer should assume PostgreSQL as the primary durable store from the start.

### `packages/shared`

- Utility helpers
- Shared constants
- Lightweight common abstractions

## Execution Flow

1. User configures assets in the desktop app
2. Desktop sends requests to the local service
3. Local service persists and loads state through PostgreSQL-backed storage
4. Local service invokes the runner with a chosen template
5. Runner executes the relevant checks over SSH
6. Checks return normalized results
7. Core evaluates status and severity
8. Report module transforms results into exportable output
9. Desktop reads the resulting state and displays it to the user

## Data Model Outline

Core entities:

- `Asset`
- `CredentialRef`
- `InspectionTemplate`
- `CheckDefinition`
- `InspectionTask`
- `InspectionRun`
- `CheckResult`
- `InspectionReport`

## Persistence

OpsProbe should use a dedicated PostgreSQL instance managed specifically for OpsProbe.

Default mode:

- `Managed PostgreSQL`
- Installed and controlled by OpsProbe
- Separate data directory, port, logs, and lifecycle from any system PostgreSQL

Optional future mode:

- `External PostgreSQL`
- Advanced configuration only
- Intended for enterprise or controlled environments

Persistence should still be split by migration behavior:

- `config`: assets, templates, schedules, and settings that should be exportable
- `runtime`: temporary state and caches that can be rebuilt
- `secrets`: local credential bindings that should be re-linked rather than exported in plain form

Managed PostgreSQL isolation requirements:

- Dedicated OpsProbe data directory
- Dedicated local port, not assumed to be `5432`
- Dedicated logs and service lifecycle
- No default reuse of a user-managed PostgreSQL instance

User experience requirements:

- One installer
- First-run automatic bootstrap
- Automatic schema initialization
- Automatic health checks and recovery guidance
- No need for the user to manually manage the database

## Extension Strategy

Future commercial or hosted capabilities should build on the same core packages instead of forking inspection logic.

Natural extension points:

- Report publishing service
- Notification service
- Collaboration workflows
- Multi-tenant management
- Additional protocol runners
