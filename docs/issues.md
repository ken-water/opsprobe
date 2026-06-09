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
  `0.10.4`: patch release for desktop readiness UX and regression-gate hardening
- `0.11.x`: pre-stable evidence line after the `0.10.x` hardening cycle
  Current issue line:
  `0.11.0`: Issue 54
- `1.0.0`: stable-release decision line
  Current issue line:
  `1.0.0`: Issue 47
- `1.1.0`: multilingual foundation line
  Current issue line:
  `1.1.0`: Issue 48
- `1.2.0`: multilingual website and customer-test line
  Current issue line:
  `1.2.0`: Issue 49

Recommended next issue additions:

- `0.11.1`: Windows installer acceptance evidence
- `0.11.2`: stable-decision blocker review and final defer-or-release recommendation
- `1.1.1`: desktop/report i18n string extraction and translation boundary
- `1.2.1`: multilingual download site and release-artifact listing

Recommended priority order:

1. `0.11.0`: clean-machine and stable-candidate evidence consolidation
2. `0.11.1`: Windows installer acceptance evidence on a Windows-capable environment
3. `0.11.2`: explicit `1.0.0` blocker review and written decision support
4. `1.1.0` / `1.1.1`: multilingual desktop and report foundation
5. `1.2.0` / `1.2.1`: multilingual website and download distribution

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

## Post-`0.10.8` Issue Drafts

These drafts are intended to be copied into GitHub issues before the next release line starts.

### `0.11.0` Stable-Candidate Evidence Consolidation

Suggested title:

- `0.11.0: consolidate stable-candidate install, bootstrap, and recovery evidence`

Problem:

- packaged artifacts and Linux validation evidence now exist, but the `1.0.0` decision is still too dependent on fragmented notes
- clean-machine or clean-profile operator evidence is not yet consolidated into one reviewable checkpoint
- install, inspect, export, stop, restart, backup, and recovery expectations need one operator-facing evidence line before reopening the stable decision

Scope:

- consolidate the current clean-profile and packaged validation evidence into a single `0.11.0` checkpoint
- tighten operator notes for bootstrap, first inspection, report export, shutdown, restart, backup, and recovery
- update the stable review record so Issue 47 can be resumed from explicit evidence instead of ad hoc memory
- identify which remaining limits are credible for acceptance and which still need another pre-stable fix

Non-goals:

- no new product surface area
- no multilingual work
- no major UI redesign unless it directly blocks stable-candidate validation

Definition of done:

- a single reviewable evidence line exists for clean install or clean-profile bootstrap through first useful report
- operator notes describe stop, restart, backup, and recovery behavior honestly enough for external review
- the stable review record lists explicit blockers, acceptable limits, and follow-up actions
- release docs and roadmap wording no longer imply that `1.0.0` is automatic after `0.10.x`

Required evidence:

- updated stable-candidate validation record
- updated operator notes for `0.11.0`
- updated stable review record tied to Issue 47
- release-gate and version-gate output for the active candidate

### `0.11.1` Windows Installer Acceptance Evidence

Suggested title:

- `0.11.1: capture real Windows installer acceptance evidence`

Problem:

- Windows cross-build artifacts exist, but artifact existence is not the same as installer acceptance
- stable-release credibility is weaker if Windows support is claimed without install and launch evidence from a Windows-capable environment

Scope:

- validate the current NSIS installer on a real Windows machine or a trustworthy Windows-capable validation environment
- record install, first launch, runtime readiness, demo-data load, first inspection trigger, and uninstall behavior
- document any platform-specific blockers or acceptance limits

Non-goals:

- no promise of full Windows parity beyond what is actually validated
- no new Windows-only features

Definition of done:

- the repo contains a structured validation record showing installer acceptance steps and outcome
- the release docs separate Windows artifact generation from Windows install-and-launch evidence
- any remaining Windows blockers are explicit and linked to follow-up issues if needed

Required evidence:

- Windows validation record with environment details and exact installer version
- launch evidence after install
- uninstall or upgrade-path note if it materially affects trust

### `0.11.2` Stable Decision Blocker Review

Suggested title:

- `0.11.2: review remaining 1.0.0 blockers and decide release or defer`

Problem:

- after `0.11.0` and `0.11.1`, the repo still needs one explicit decision point instead of drifting into `1.0.0`
- remaining credibility gaps must be either accepted deliberately or turned into another bounded `0.x` line

Scope:

- review all known `1.0.0` blockers against the accumulated evidence
- classify each blocker as fixed, accepted with documentation, or requiring defer
- prepare the written recommendation for either opening a `1.0.0` release candidate or creating another hardening issue

Non-goals:

- no hidden feature work inside the decision issue
- no broad roadmap expansion beyond the stable decision itself

Definition of done:

- Issue 47 can be updated from a written blocker table rather than scattered notes
- the repo states clearly whether `1.0.0` should proceed or be deferred
- if deferred, the next pre-stable issues are defined before more coding begins

Required evidence:

- updated stable-readiness checklist
- blocker classification table
- release-or-defer recommendation with rationale

### `1.0.0` Stable Release Decision

Suggested title:

- `1.0.0: stable release decision and release-candidate sign-off`

Problem:

- `1.0.0` must be a defensible stable milestone, not just the next available version number
- OpsProbe needs an explicit sign-off point that ties product claims, validation evidence, release notes, and known limits together

Scope:

- review the stable-readiness checklist with real evidence
- verify that release notes, docs, packaging status, and known limits match the actual shipped behavior
- decide whether to publish `1.0.0` or defer to another `0.x` hardening line
- if approved, prepare the release-candidate tag, release notes, and milestone closure path

Non-goals:

- no new feature development inside the sign-off issue
- no roadmap promises for `1.1.0` or later treated as already shipped

Definition of done:

- the stable-readiness checklist is completed with links to real evidence
- the final blocker decision is explicit: fixed, accepted, or deferred
- release notes for `v1.0.0` match the actual stable scope
- either a `1.0.0` release candidate is approved, or the next defer issue line is created before work continues

Required evidence:

- completed `docs/stable-readiness.md` review
- updated stable review record
- release readiness and version gate output for `1.0.0`
- final release notes draft for `v1.0.0`
