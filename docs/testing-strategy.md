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
