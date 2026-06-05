# Testing Strategy

OpsProbe currently has basic validation gates, but not a high automated test coverage level yet.

Current state:

- Type safety checks exist for the desktop TypeScript code
- Production builds are validated for the desktop app
- Rust `cargo check` is part of the release flow
- Version, milestone, and release gates exist
- Automated unit, integration, smoke, and end-to-end functional coverage is still limited

## Coverage Assessment

Current practical assessment:

- Unit test coverage: low
- Integration test coverage: low
- Smoke test coverage: low
- Functional end-to-end coverage: low

This means the repository can catch some build-time regressions, but it still relies heavily on manual verification for behavior.

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

## 0.8.0 Planning Fit

The `0.8.0` stage should include test-foundation work because deeper inspection workflows will raise behavior complexity and regression risk.

Suggested first checkpoint:

- add a test runner
- define package-level test scripts
- cover report transforms, settings normalization, and one local-service integration path
- add a smoke checklist script for release candidates
