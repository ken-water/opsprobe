# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and the project follows semantic versioning with a product-oriented release policy documented in [docs/versioning.md](./docs/versioning.md).

## [0.7.4] - 2026-06-05

### Added

- Validation-cycle summary panel in the desktop app to show what was addressed, what was deferred, and the next-stage decision
- Explicit `0.7.x` decision document describing fixed friction, deferred scope, and why `0.8.0` is next instead of `1.0.0`

### Changed

- Repository docs now point to the completed `0.7.x` validation-cycle checkpoint
- Desktop release copy now reflects the feedback-driven closure of the external-validation cycle

### Known Limits

- The decision checkpoint is documented, but it does not yet synthesize live feedback metrics automatically
- Several broader platform requests remain intentionally deferred until local inspection depth improves further

## [0.7.3] - 2026-06-05

### Added

- Structured GitHub issue templates for inspection needs, report feedback, and workflow friction
- Dedicated feedback guide with direct links and prompts for higher-signal early-user input
- Desktop feedback entry panel with direct routes into the structured GitHub forms

### Changed

- Repository entry points now direct early users toward actionable feedback instead of generic feature requests
- Desktop release copy now reflects the `0.7.3` external-validation focus on feedback capture

### Known Limits

- Feedback still routes through GitHub issues rather than an in-product submission backend
- The current workflow captures structured input, but does not yet aggregate or prioritize repeated themes automatically

## [0.7.2] - 2026-06-05

### Added

- Shared operator and manager report audiences for HTML and PDF export
- Desktop report-variant selector with persisted audience preference and in-product comparison guidance

### Changed

- HTML report rendering now supports a detailed operator layout and a condensed manager summary layout from the same inspection data
- PDF export now supports a concise manager-facing priority-actions view in addition to the existing detailed operator view
- Local HTML export flow now preserves the selected report audience across desktop and local-service boundaries

### Known Limits

- Report variants are currently single-run views; cross-run or multi-run comparison reports remain out of scope
- Manager summaries are intentionally concise and do not yet include trend or SLA-oriented rollups

## [0.7.1] - 2026-06-05

### Added

- Desktop troubleshooting guidance panel that turns failing runtime checks into concrete repair steps
- SSH repair guidance in the UI for common authentication, reachability, DNS, and password-helper failures

### Changed

- SSH connection failures and SSH-backed inspection command failures now return clearer, categorized explanations
- Local service, managed PostgreSQL, schedule, asset, and history actions now surface readable failure messages instead of silent command rejection
- Desktop release copy now reflects the `0.7.1` runtime-diagnostics milestone

### Known Limits

- Troubleshooting guidance is still rule-based and currently focuses on common local environment failures rather than every host-specific edge case
- Deeper automated log-tail or self-healing flows remain out of scope for the open source desktop edition

## [0.7.0] - 2026-06-04

### Added

- Guided first-run demo mode in the desktop app with realistic bundled sample inspection runs
- Explicit desktop onboarding mode persistence so users can choose demo exploration or direct real setup
- Clear sample-data labelling in history and report replay views to avoid mixing demo content with real local-service history

### Changed

- Desktop history and repeated-problem analysis now work against the visible onboarding context instead of assuming persisted history only
- Release-facing desktop copy now reflects the `0.7.0` external-validation focus instead of the earlier `0.6.0` milestone text

### Known Limits

- Demo runs are static examples and do not yet adapt to the currently selected template or asset beyond the guided starter flow
- Feedback capture from early users still depends on external channels and remains planned for `0.7.1+`

## [0.6.0] - 2026-06-04

### Added

- Built-in inspection template registry with Linux baseline, capacity, state, nginx, MySQL, Redis, Docker, and Kubernetes node templates
- Desktop template selection with local persistence and schedule-aware template execution
- Nginx process and configuration validation checks
- MySQL or MariaDB process and TCP listener checks
- Redis process and TCP listener checks
- Docker daemon, runtime info, and container inventory checks
- Kubelet process, kubelet secure port, and Kubernetes node runtime checks

### Changed

- HTML reports, PDF exports, and desktop history now show template metadata for each inspection run
- Repeated-problem review now reflects which templates produced the same recurring finding
- `0.6.0` version gate and release planning are now defined explicitly in the repository workflow

### Known Limits

- Service checks currently focus on process, listener, and basic runtime validation rather than deep application semantics
- Kubernetes inspection currently targets node-side signals only and does not query the control plane or cluster API
- Docker and Kubernetes checks assume compatible CLI tooling is available on the inspected host when runtime details are requested

## [0.5.0] - 2026-06-04

### Added

- Structured report result view model for reusable history and export rendering
- Local HTML report export through the local service
- Built-in PDF export for desktop report sharing without external browser dependencies
- Desktop local-state persistence for active asset, history filters, schedule interval, and export paths

### Changed

- Desktop startup no longer auto-runs inspection preview or service execution as a side effect
- Built-in Linux baseline template is now persisted into local storage for migration and export consistency
- Local settings persistence now restores the previous desktop editing context after restart

### Known Limits

- Service-aware inspection templates were not included yet and remained planned for `0.6.0`
- Middleware and container runtime checks were still out of scope at this point
- Release automation gates had not yet enforced previous minor-version release completion, which is now fixed after this backfill

## [0.4.0] - 2026-06-04

### Added

- Dedicated local service runtime boundary for the desktop edition
- Managed local PostgreSQL bootstrap, start, stop, and health inspection flow
- Service-owned inspection preview and execution flow
- Inspection history filtering, report replay, and repeated-problem summary
- Local recurring inspection schedules owned by the background service
- Portable local configuration export and import for machine migration
- First-run setup guidance with environment validation for `ssh`, `sshpass`, and report directory writability

### Changed

- Desktop workflow now routes long-running runtime concerns through the local service boundary
- Inspection persistence now prefers managed PostgreSQL and falls back to local file storage when needed
- Imported assets are now marked with `bindingStatus: rebind-required` instead of carrying local secret bindings across machines
- Development and release process now require a clean, pushed checkpoint gate before starting the next issue

### Known Limits

- Local HTML and PDF report export are not included yet and remain planned for `0.5.0`
- Asset persistence is available, but broader persistence polish remains open under `#12`

## [0.3.0] - 2026-06-04

### Added

- Dedicated local service package and desktop-visible runtime status flow
- Service-owned inspection preview and execution path
- Managed local PostgreSQL health inspection, bootstrap, start, and stop flow
- PostgreSQL-backed inspection run persistence with file-backed fallback
- File-to-PostgreSQL migration for previously persisted inspection runs

### Changed

- Desktop architecture now assumes a dedicated local service boundary for long-running runtime responsibilities
- Inspection execution can now be routed through the local service instead of living only inside the UI process
- Managed PostgreSQL runtime validation is now part of the local service operational workflow

### Known Limits

- Inspection history, scheduling, migration import/export, and first-run setup guidance were not included yet in `0.3.0`
- Local HTML and PDF report export remained out of scope for this release and were deferred further
- Asset persistence polish was still incomplete at this point and remained tracked separately

## [0.2.1] - 2026-06-03

### Added

- Password-based SSH connection testing through `sshpass`
- Password-based SSH execution support for Linux baseline checks

### Changed

- Desktop SSH credential input now switches to a password field when password authentication is selected
- SSH validation now reports missing `sshpass` explicitly when password mode is requested

## [0.2.0] - 2026-06-03

### Added

- Shared inspection domain models in `@opsprobe/core`
- Reusable Linux check contracts in `@opsprobe/checks`
- Runner adapter flow for normalized inspection execution
- Editable Linux host asset input in the desktop UI
- SSH connection testing through a Tauri backend command
- SSH-backed Linux baseline checks for CPU, memory, disk, load, time sync, sshd, port 22, reboot age, and log usage
- Development gate checks to enforce issue and milestone hygiene before new version work begins

### Changed

- Desktop preview now uses a unified asset model for both connection testing and inspection execution
- Architecture direction has been updated toward a managed PostgreSQL runtime for future local service work

## [0.1.1] - 2026-06-03

### Added

- Apache License 2.0 for the open source community edition
- GitHub funding metadata for project sponsorship
- Support links in the README and desktop foundation screen

## [0.1.0] - 2026-06-03

### Added

- Initial repository documentation for MVP, architecture, roadmap, releases, and versioning
- Root workspace setup for the desktop app and shared packages
- Tauri desktop application bootstrap for the open source edition
- Initial placeholder package layout for `core`, `runner`, `checks`, `report`, and `shared`
- Initial release planning and issue mapping for versions `0.1.0` through `0.5.0`
