# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and the project follows semantic versioning with a product-oriented release policy documented in [docs/versioning.md](./docs/versioning.md).

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
