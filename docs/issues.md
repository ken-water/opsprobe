# Initial Issues

This document breaks the open source MVP into a first batch of implementation tasks that can be turned into GitHub issues.

Release mapping:

- `0.1.0`: Issues 1, 2, 3, 15
- `0.2.0`: Issues 4, 5, 6, 7, 8
- `0.3.0`: Issue 20
- `0.4.0`: Issues 13, 14, 18, 19
- `0.5.0`: Issues 9, 10, 11, 12 plus stabilization and MVP release prep
- `0.6.0`: Issues 22, 23, 24, 25
- `0.7.0`: guided first-run and demo experience
- `0.7.1`: runtime diagnostics and troubleshooting
- `0.7.2`: report variants for different audiences
- `0.7.3`: structured external feedback capture
- `0.7.4`: feedback-driven stabilization and next-stage decision
- `0.8.x`: deeper inspection workflows after the `0.7.x` validation cycle
  Current issue line:
  `0.8.0`: Issues 31, 32, 33, 34, 35
  `0.8.1`: Issues 37, 39, 40
  `0.8.2`: Issues 36, 41
  `0.8.3`: Issue 38
- `0.9.x`: service-depth and operator-trust line after `0.8.x`
  Current issue line:
  `0.9.0`: Issue 43
  `0.9.1`: Issue 42
  `0.9.2`: Issue 44
  `0.9.3`: Issue 46
  `0.9.4`: Issue 45
- `0.10.x`: pre-stable hardening line after the `0.9.x` service-depth cycle
  Current issue line:
  `0.10.0`: Issue 50
  `0.10.1`: Issue 51
  `0.10.2`: Issue 52
  `0.10.3`: Issue 53
- `1.0.0`: stable-release decision line
  Current issue line:
  `1.0.0`: Issue 47
- `1.1.0`: multilingual foundation line
  Current issue line:
  `1.1.0`: Issue 48
- `1.2.0`: multilingual website and customer-test line
  Current issue line:
  `1.2.0`: Issue 49

## Foundation

### 1. Initialize repository structure

Goal:

- Create `apps/desktop`
- Create `packages/core`
- Create `packages/runner`
- Create `packages/checks`
- Create `packages/report`
- Create `packages/shared`

Definition of done:

- Directory structure exists
- Each package has a clear placeholder README or manifest

### 2. Bootstrap Tauri desktop app

Goal:

- Initialize the desktop application shell
- Confirm local development startup works
- Establish the base layout for asset list, inspection view, and reports

Definition of done:

- Tauri app launches locally
- Basic navigation structure is visible

### 3. Define core domain models

Goal:

- Define the initial models for assets, templates, tasks, runs, results, and reports
- Keep the schema small and stable

Definition of done:

- Model definitions exist in `packages/core`
- Types are reusable across desktop and future services

## Inspection Execution

### 4. Implement SSH connection test

Goal:

- Allow a Linux host to be added and validated through SSH

Definition of done:

- User can input host, port, username, and auth details
- App can confirm success or provide a useful error

### 5. Build inspection runner skeleton

Goal:

- Create the execution pipeline for manual inspection runs

Definition of done:

- Runner accepts an asset and template
- Runner invokes checks in sequence
- Runner returns normalized results

### 6. Define check interface

Goal:

- Create a stable contract for built-in and future checks

Definition of done:

- Each check returns status, summary, evidence, severity, and remediation suggestion
- New checks can be added without changing runner flow

## Built-in Checks

### 7. Implement host resource checks

Goal:

- Add CPU, memory, disk, and load checks

Definition of done:

- Each check runs over SSH
- Results are normalized
- Abnormal thresholds are clearly defined

### 8. Implement host state checks

Goal:

- Add time sync, key process, key port, reboot age, and log usage checks

Definition of done:

- Each check produces evidence and remediation suggestions

## Reporting

### 9. Build result view model

Goal:

- Convert raw check outputs into a report-friendly structure

Definition of done:

- Results can be grouped by host and severity
- Summary counts are available

### 10. Implement local HTML report export

Goal:

- Generate a readable local report after each inspection run

Definition of done:

- Report includes overview, abnormal items, evidence, and suggestions
- User can export the report to a local path

### 11. Add PDF export path

Goal:

- Support PDF output for sharing and archiving

Definition of done:

- PDF export works from the same structured report data

## Local Experience

### 12. Add local persistence

Goal:

- Persist assets, templates, runs, and settings locally

Definition of done:

- App restarts without losing configured hosts and previous results

### 13. Add inspection history view

Goal:

- Allow users to browse previous runs

Definition of done:

- History is filterable by host and time
- User can reopen previous reports

### 14. Add local scheduling

Goal:

- Allow recurring inspections on the client side

Definition of done:

- User can create a basic schedule
- Scheduled runs are stored and executed locally

## Documentation

### 15. Add setup documentation

Goal:

- Document local development setup
- Document how the first inspection flow works

Definition of done:

- A new contributor can bootstrap the project from the README and docs
