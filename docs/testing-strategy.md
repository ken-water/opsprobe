# Testing Strategy

OpsProbe currently has basic validation gates, and `0.8.3` adds the first repeatable local-service CLI functional slice, but automated coverage is still not high yet.

Current state:

- Type safety checks exist for the desktop TypeScript code
- Production builds are validated for the desktop app
- Rust `cargo check` is part of the release flow
- Version, milestone, and release gates exist
- Automated unit, integration, smoke, and end-to-end functional coverage is still limited
- The release smoke flow now verifies a real local-service path: asset save, inspection preview, and HTML report export

## Coverage Assessment

Current practical assessment:

- Unit test coverage: low
- Integration test coverage: low to moderate for report and local-service paths
- Smoke test coverage: low to moderate for release-candidate validation
- Functional end-to-end coverage: low, with one automated local-service CLI journey now present

This means the repository can catch more release-breaking regressions than before, but it still relies heavily on manual verification for broader desktop behavior.

## Target Test Layers

OpsProbe should build test coverage in four layers:

### 1. Unit Tests

Scope:

- core domain helpers
- report view-model transforms
- template and check metadata logic
- local settings normalization
- storage adapter pure logic where mocking is practical

Goal:

- cover the highest-change-rate logic that can be tested without runtime dependencies

### 2. Integration Tests

Scope:

- local-service command flows
- storage adapter behavior
- inspection history filtering
- report export request handling
- settings persistence and migration behavior

Goal:

- verify module boundaries and real data flow, especially around the local service

### 3. Smoke Tests

Scope:

- desktop build
- local-service status command
- managed PostgreSQL bootstrap and start flow in a controlled local environment
- one preview run and one export path

Goal:

- quickly detect whether a release candidate is fundamentally runnable

### 4. Functional End-to-End Tests

Scope:

- first-run demo flow
- asset save and reload flow
- schedule creation flow
- report export flow for both operator and manager audiences
- feedback entry flow

Goal:

- prove key user journeys rather than only isolated components

## Recommended Priority

The next practical order should be:

1. add unit tests for report, core, and settings logic
2. add integration coverage for local-service storage and export paths
3. add repeatable smoke scripts for the release candidate workflow
4. add a small number of end-to-end functional tests for the most important desktop journeys

## Release Gate Direction

Future release gates should gradually require:

- unit tests for changed pure logic
- at least one integration path for local-service changes
- smoke validation for every minor release candidate
- functional regression coverage for the highest-value desktop workflows

Practical gate targets for the next release line:

- `0.11.0`: every evidence or runtime script change must pass the matching environment gate before validation runs
- `0.11.1`: every packaging or installer change must refresh Linux packaged validation artifacts and the Windows validation record
- `0.11.2`: stable-decision docs must be backed by a fresh smoke run plus the current blocker table
- `1.0.0`: require unit, integration, smoke, and at least one desktop functional regression pass before the release candidate is approved
- `1.1.0`: require bilingual regression coverage for the main desktop workflow and static report-copy rendering
- `1.2.0`: require website language-switch coverage and release-artifact link verification

## 0.8.x Planning Fit

The `0.8.x` stage should include test-foundation work because deeper inspection workflows will raise behavior complexity and regression risk.

Suggested first checkpoint:

- add a test runner
- define package-level test scripts
- cover report transforms, settings normalization, and one local-service integration path
- add a smoke checklist script for release candidates

Completed by `0.8.3`:

- report transforms have focused unit coverage
- local-service settings and report export paths have integration coverage
- a CLI-level functional slice now validates asset persistence, preview execution, and HTML report export
- the smoke script now includes that functional slice before running broader build and test gates
- migration export/import behavior and stopped-state recovery now have automated regression coverage

Additional recovery evidence added during `0.10.2`:

- malformed file-backed storage snapshots are now quarantined and rebuilt automatically instead of leaving local-service startup blocked on JSON parse failure
- CLI functional coverage now proves that local-service can recover from a malformed file-backed snapshot and still accept fresh asset saves afterward
- malformed persisted local-service status files are now quarantined automatically instead of silently staying in place
- stale local-service PID files no longer force `status` to report `ready` when the referenced process is already gone

Additional machine-move trust evidence added during `0.10.3`:

- export packages now carry source-machine metadata so import review can verify provenance instead of trusting an unlabeled JSON package
- import responses now report credential-rebind count, disabled-schedule count, and explicit next steps for safe machine replacement

Additional stable-candidate evidence added during `0.11.0`:

- a repeatable clean-user-profile validation script now proves the operator can start from an empty `~/.opsprobe`, save an asset, preview an inspection, export a migration package, stop, restart, and still see explicit recovery guidance
- a repeatable desktop stable-candidate validation script now proves the desktop TypeScript build, frontend bundle, and Tauri shell still build coherently on the current machine
- a repeatable desktop operator walk-through gate now proves the current desktop candidate still exposes the expected service, PostgreSQL, export, and report actions in the UI and Tauri boundary
- a repeatable desktop bundle-candidate gate now proves the repository has produced real Linux packaging artifacts instead of only build-time evidence
- the repository now includes a dedicated operator-facing validation guide for clean-profile bootstrap, backup scope, and restart expectations
- the repository now includes a dedicated desktop stable-candidate validation guide so release evidence is not limited to local-service CLI flows
- the repository now includes a dedicated desktop operator walk-through guide so near-packaged desktop evidence is not reduced to raw build success alone
- the repository now includes a dedicated desktop bundle-candidate guide so packaging evidence is recorded separately from later installer acceptance work
- a stable-candidate evidence capture script now records version, environment, checkpoint gate output, version gate output, and clean-profile validation in one place before Issue 47 is resumed
- a stable review record now exists so Issue 47 can be updated from structured evidence instead of ad hoc summaries
- a `0.11.0` operator-notes draft now translates the raw evidence into explicit provisional blockers and acceptable-limit candidates for the stable decision
- validation scripts for clean-profile and packaged-desktop acceptance now auto-run scenario-specific environment gates before they attempt evidence capture
