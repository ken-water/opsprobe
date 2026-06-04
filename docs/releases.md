# Release Plan

This document maps the initial open source roadmap to concrete release milestones.

## Release Themes

### `0.1.0` Foundation

Goal:

- Establish the repository, desktop shell, and reusable package structure

Includes:

- Initialize repository structure
- Bootstrap Tauri desktop app
- Define core domain models
- Add setup documentation baseline

Related issues:

- Issue 1
- Issue 2
- Issue 3
- Issue 15

Exit criteria:

- Project structure is stable enough for parallel development
- Desktop app launches locally
- Core models are defined

### `0.2.0` First Inspection Flow

Goal:

- Deliver the first end-to-end Linux SSH inspection run

Includes:

- Implement SSH connection test
- Build inspection runner skeleton
- Define check interface
- Implement host resource checks
- Implement host state checks

Related issues:

- Issue 4
- Issue 5
- Issue 6
- Issue 7
- Issue 8

Exit criteria:

- User can add a Linux host
- User can validate connectivity
- User can run a built-in host inspection template
- Results are normalized and readable

### `0.3.0` Local Service Foundation

Goal:

- Establish the dedicated local runtime boundary behind the desktop UI

Includes:

- Add local background service process for the desktop edition
- Move long-running scheduling and durable state ownership into that service
- Expose a stable local command boundary for the desktop UI

Related issues:

- Issue 20

Exit criteria:

- Desktop architecture assumes a dedicated local service
- Long-running tasks and persistence are owned by that service
- UI can query service status and interact through a defined boundary

### `0.4.0` Local Usability

Goal:

- Make the desktop workflow usable for repeated daily work

Includes:

- Add inspection history view
- Add local scheduling
- Support configuration export and import for machine migration
- Add first-run setup and environment validation

Related issues:

- Issue 13
- Issue 14
- Issue 18
- Issue 19

Exit criteria:

- Inspection history is browsable
- Recurring local inspection can be configured
- Local migration package can be imported safely on another machine
- Missing environment prerequisites are surfaced clearly during first run

### `0.5.0` Open Source MVP

Goal:

- Consolidate the first complete open source MVP release

Includes:

- Build result view model
- Implement local HTML report export
- Add PDF export path
- Finish broader local persistence polish
- Documentation cleanup
- Bug fixing and stability improvements
- UX polish across the desktop flow
- Review of built-in checks and report quality

Exit criteria:

- Core MVP flow is stable
- Documentation is sufficient for first outside users
- The repository is ready for wider open-source testing

### `0.6.0` Service-Aware Templates

Goal:

- Expand the Linux inspection MVP from a single baseline into multiple reusable built-in templates

Includes:

- Add built-in inspection template registry and desktop template selection
- Add Nginx, MySQL, and Redis baseline checks
- Add Docker and Kubernetes node baseline checks
- Show template metadata in history and reports

Exit criteria:

- Users can choose different built-in inspection templates for the same Linux host
- Template choice is persisted through desktop restart and scheduling
- Middleware and runtime templates have meaningful built-in checks
- History and report outputs make template choice visible

## Stable Milestone

### `1.0.0`

Candidate conditions:

- Open source MVP is proven by real users
- Core desktop workflow is stable
- Installation and onboarding are documented
- Primary inspection and report workflows are reliable
- Versioning and upgrade expectations are clear

`1.0.0` should not be used just because enough code exists. It should represent the first stable and externally credible open source release.
