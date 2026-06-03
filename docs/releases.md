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

### `0.3.0` Local Reporting

Goal:

- Turn inspection results into a useful local report experience

Includes:

- Build result view model
- Implement local HTML report export
- Add PDF export path

Related issues:

- Issue 9
- Issue 10
- Issue 11

Exit criteria:

- User can generate a readable report from inspection results
- HTML export works reliably
- PDF export is available or clearly documented as experimental

### `0.4.0` Local Usability

Goal:

- Make the desktop workflow usable for repeated daily work

Includes:

- Add local persistence
- Add inspection history view
- Add local scheduling

Related issues:

- Issue 12
- Issue 13
- Issue 14

Exit criteria:

- User data persists across restarts
- Inspection history is browsable
- Recurring local inspection can be configured

### `0.5.0` Open Source MVP

Goal:

- Consolidate the first complete open source MVP release

Includes:

- Documentation cleanup
- Bug fixing and stability improvements
- UX polish across the desktop flow
- Review of built-in checks and report quality

Exit criteria:

- Core MVP flow is stable
- Documentation is sufficient for first outside users
- The repository is ready for wider open-source testing

## Stable Milestone

### `1.0.0`

Candidate conditions:

- Open source MVP is proven by real users
- Core desktop workflow is stable
- Installation and onboarding are documented
- Primary inspection and report workflows are reliable
- Versioning and upgrade expectations are clear

`1.0.0` should not be used just because enough code exists. It should represent the first stable and externally credible open source release.
