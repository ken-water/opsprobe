# OpsProbe

OpsProbe is a lightweight infrastructure inspection platform for SMBs and MSPs, focused on automated checks, risk reports, and remediation guidance.

The open source edition starts with a local-first desktop application built with Tauri. It helps teams replace manual inspection workflows with standardized checks, structured reports, and actionable remediation advice.

## Why OpsProbe

Many small and mid-sized teams still rely on spreadsheets, screenshots, and ad hoc scripts for routine inspections. Existing ITOM and observability platforms are often too complex or too expensive for this use case.

OpsProbe is built to solve a narrower problem well:

- Standardize routine infrastructure inspections
- Generate clear reports for operators and managers
- Provide remediation suggestions for common issues
- Keep deployment simple and local-first

## Feedback

OpsProbe is still in the validation stage, so concrete user feedback matters more than generic feature voting.

If you try the product, please use one of the structured feedback paths:

- [Inspection Need](https://github.com/ken-water/opsprobe/issues/new?template=inspection-need.yml)
- [Report Feedback](https://github.com/ken-water/opsprobe/issues/new?template=report-feedback.yml)
- [Workflow Friction](https://github.com/ken-water/opsprobe/issues/new?template=workflow-friction.yml)

Guide:

- [Feedback Guide](./docs/feedback.md)

## Open Source Edition Scope

The initial open source edition focuses on a Tauri desktop client with local execution:

- Linux host asset management
- SSH-based inspection execution
- Built-in host inspection templates
- Risk detection with evidence and remediation suggestions
- Local inspection history
- Local recurring scheduling
- Local machine migration export/import
- First-run environment guidance

Web publishing, notifications, multi-user collaboration, and tenant management are planned for future commercial editions.

## Support The Project

If OpsProbe is useful to you and you want to buy me a coffee, you can support the project through GitHub Sponsors:

- https://github.com/sponsors/ken-water

## MVP

The first milestone includes:

- Asset management for Linux hosts
- SSH connection testing
- Manual and scheduled inspections
- Host health checks for CPU, memory, disk, load, time sync, process, ports, reboot, and log usage
- Local inspection history and migration support
- Inspection history and comparison

See:

- [MVP](./docs/mvp.md)
- [Architecture](./docs/architecture.md)
- [Roadmap](./docs/roadmap.md)
- [Feedback Guide](./docs/feedback.md)
- [Testing Strategy](./docs/testing-strategy.md)
- [Versioning Strategy](./docs/versioning.md)
- [Release Plan](./docs/releases.md)
- [Validation Cycle 0.7](./docs/validation-cycle-0.7.md)
- [Initial Issues](./docs/issues.md)
- [Releasing Guide](./docs/releasing.md)
- [Development Gate](./docs/development-gate.md)
- [Clean User Profile Validation](./docs/clean-user-profile-validation.md)
- [Stable Candidate Operator Notes](./docs/stable-candidate-operator-notes.md)
- [Stable Candidate Operator Notes 0.11.0 Draft](./docs/stable-candidate-operator-notes-0.11.0.md)
- [Stable Review Record](./docs/stable-review-record.md)

## Quick Start

The codebase is still being bootstrapped. The initial development direction is:

1. Set up the Tauri desktop application in `apps/desktop`
2. Establish reusable packages in `packages/core`, `packages/runner`, `packages/checks`, and `packages/report`
3. Implement the first Linux SSH inspection flow
4. Generate a local HTML report from structured results

Planned local development prerequisites:

- Node.js LTS
- Rust stable
- Tauri system dependencies
- PostgreSQL binaries available locally

The current clean-user-profile validation guide lives in [docs/clean-user-profile-validation.md](./docs/clean-user-profile-validation.md).

## Repository Structure

```text
opsprobe/
  apps/
    desktop/
    local-service/
  packages/
    core/
    runner/
    checks/
    report/
    storage/
    shared/
  docs/
```

## Status

OpsProbe is in the early build stage. The current focus is defining the product boundary, core architecture, and the first usable desktop workflow.

The `0.7.x` external-validation cycle is complete, and the `0.9.x` service-depth line is also complete through `0.9.4`. The latest published release candidate is `0.10.7`, focused on install-first desktop guidance, a straighter first inspection flow, and current-version packaged desktop validation evidence.

## Roadmap Principles

- Local-first before cloud
- Inspection quality before platform breadth
- Reports and remediation before collaboration workflows
- Reusable core modules before UI expansion

## Release Process

OpsProbe uses semantic versioning with release milestones documented in:

- [Versioning Strategy](./docs/versioning.md)
- [Release Plan](./docs/releases.md)
- [Releasing Guide](./docs/releasing.md)
- [Development Gate](./docs/development-gate.md)

## License

Apache-2.0. See [LICENSE](./LICENSE).
