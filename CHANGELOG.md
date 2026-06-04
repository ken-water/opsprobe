# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and the project follows semantic versioning with a product-oriented release policy documented in [docs/versioning.md](./docs/versioning.md).

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
