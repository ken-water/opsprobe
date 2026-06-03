# OpsProbe Architecture

## Design Principles

- Local-first: core inspection workflows must run without a cloud dependency
- Reusable core: inspection logic should not be tightly coupled to the desktop UI
- Simple deployment: the open source edition should be easy to run and demo
- Structured outputs: every inspection result should be machine-readable and report-friendly

## Product Split

### Desktop

The desktop application is the primary open source delivery form.

Responsibilities:

- Local asset management
- Local scheduling and execution
- Result viewing
- Report generation and export
- Local settings and logs

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
  desktop/   -> Tauri application shell and UI

packages/
  core/      -> domain models, rules, result schema
  runner/    -> task scheduling and execution orchestration
  checks/    -> built-in inspection checks
  report/    -> report rendering and export
  shared/    -> shared types, constants, utilities
```

## Module Responsibilities

### `apps/desktop`

- Tauri shell
- Frontend views
- Local data persistence wiring
- Invokes reusable core services

The desktop layer should avoid embedding business logic directly in UI commands wherever possible.

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

### `packages/shared`

- Utility helpers
- Shared constants
- Lightweight common abstractions

## Execution Flow

1. User selects one or more assets in the desktop app
2. Desktop invokes the runner with a chosen template
3. Runner executes the relevant checks over SSH
4. Checks return normalized results
5. Core evaluates status and severity
6. Report module transforms results into exportable output
7. Desktop stores results locally and displays them to the user

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

For the first open source release, persistence should remain simple and local.

Suggested options:

- SQLite for structured local data
- Local filesystem for exported reports
- Local config files for lightweight settings

## Extension Strategy

Future commercial or hosted capabilities should build on the same core packages instead of forking inspection logic.

Natural extension points:

- Report publishing service
- Notification service
- Collaboration workflows
- Multi-tenant management
- Additional protocol runners
