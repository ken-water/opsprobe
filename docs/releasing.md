# Releasing Guide

OpsProbe releases should be created with all three artifacts aligned:

- Git commit
- Git tag
- GitHub release notes

## Release Checklist

0. Before development for a new minor or major version begins, run the development gates:
   - `npm run env:check:strict`
   - `./scripts/check-worktree-gate.sh`
   - `./scripts/check-version-gate.sh <target-version>`
   - if the previous minor has no tag or GitHub release yet, publish it before starting the next one
   - for patch releases, still run the checkpoint gate and version gate, but milestone creation may be skipped when the patch only covers bounded fixes, docs, UX polish, or release metadata
1. Before switching to another issue or ending the work session, commit and push the current checkpoint
2. After a version is tagged and released, immediately bump repository version files to the next development version before substantial follow-up work begins
3. Update version references in:
   - root `package.json`
   - `apps/desktop/package.json`
   - `apps/desktop/src-tauri/Cargo.toml`
   - `apps/desktop/src-tauri/tauri.conf.json`
   - `CHANGELOG.md`
4. Verify the release scope matches the current milestone in [releases.md](./releases.md)
   - for `1.0.0`, complete the review in [stable-readiness.md](./stable-readiness.md)
5. Run build and validation commands
   - `./scripts/smoke-release-candidate.sh`
   - `./scripts/validate-desktop-bundle-candidate.sh`
   - `./scripts/validate-desktop-packaged-acceptance-preflight.sh`
   - `./scripts/validate-desktop-packaged-launch-smoke.sh`
   - `npm run desktop:validate-windows-record`
   - `npm run desktop:validate-windows-wine-record`
   - `npm run desktop:validate-packaged-gate`
   - `./scripts/check-release-readiness.sh <target-version>`
   - for desktop packaging, also verify the target-specific bundle command succeeds
6. Commit with a release-oriented message
7. Create an annotated tag
8. Push branch and tags
9. Publish a GitHub release with structured notes
10. If a historical release was backfilled, explicitly restore the GitHub `Latest` marker to the newest shipped version instead of leaving it on the newly created older release
11. Bump to the next development version and push that checkpoint before starting broader follow-up work
12. Do not begin the next minor version until the previous minor's release commit, tag, and GitHub release all exist on GitHub

Patch-release note:

- Patch releases may skip a target milestone if they do not introduce new roadmap scope
- If a patch release does use a milestone, it may still pass the gate without requiring new open issues for future development

If step 1 is skipped, development should not continue into another issue.

## Development Version Vs Published Release

OpsProbe keeps the repository on the next development version immediately after a release is published.

That means:

- `package.json`, desktop version files, and `CHANGELOG.md` may already show the next unreleased version
- GitHub Releases should only show versions that already have a pushed tag and published release notes
- an `Unreleased` changelog entry such as `0.10.8` is a development line, not proof that `v0.10.8` should already exist on GitHub

## Release Readiness Gate

Before publishing a release, OpsProbe also requires a release-readiness gate:

- version files must all align to the target release
- `release-notes/v<target-version>.md` must exist
- `CHANGELOG.md`, `README.md`, and desktop release copy must reference the target release
- the release-candidate smoke script must have completed for the same target version
- the desktop packaged gate must pass for the same target version

Use:

`./scripts/check-release-readiness.sh <target-version>`

Use the packaged-evidence aggregate directly when refreshing desktop release proof:

`npm run desktop:validate-packaged-gate`

For the current `0.11.x` line this means:

- Linux bundle candidate evidence is mandatory
- Linux packaged launch smoke must show the AppImage stayed alive
- Windows artifact and Wine records must exist for the current version even if they still document limitations

For `1.0.0`, release readiness is necessary but not sufficient. The stable-release review in [stable-readiness.md](./stable-readiness.md) must also be completed with explicit evidence and a written decision.

For the pre-stable `0.11.x` evidence line, also capture:

- `npm run env:check:strict`
- `npm run env:prepare:fast` when desktop packaging depends on vendored Cargo sources
- `./scripts/validate-clean-user-profile.sh`
- `./scripts/validate-desktop-stable-candidate.sh`
- `./scripts/validate-desktop-operator-walkthrough.sh`
- `./scripts/validate-desktop-bundle-candidate.sh`
- `./scripts/capture-stable-candidate-evidence.sh`
- the operator notes in [clean-user-profile-validation.md](./clean-user-profile-validation.md)
- the desktop candidate notes in [desktop-stable-candidate-validation.md](./desktop-stable-candidate-validation.md)
- the desktop operator walk-through in [desktop-operator-walkthrough.md](./desktop-operator-walkthrough.md)
- the desktop bundle candidate notes in [desktop-bundle-candidate-validation.md](./desktop-bundle-candidate-validation.md)
- the filled validation record based on [stable-candidate-operator-notes.md](./stable-candidate-operator-notes.md)
- the current issue-specific draft such as [stable-candidate-operator-notes-0.11.0.md](./stable-candidate-operator-notes-0.11.0.md)
- the decision summary based on [stable-review-record.md](./stable-review-record.md)

The environment report should be preserved alongside the other `.opsprobe-validation` artifacts whenever a new machine or changed toolchain is involved in packaged evidence collection.

## Tag Format

Use:

`vMAJOR.MINOR.PATCH`

Examples:

- `v0.1.0`
- `v0.2.0`
- `v1.0.0`

## GitHub Release Title

Use:

`OpsProbe vMAJOR.MINOR.PATCH`

Example:

`OpsProbe v0.1.0`

## Release Notes Structure

- Summary
- Included milestones
- Key changes
- Known limits
- Next target version

## Desktop Packaging

OpsProbe desktop releases are built with Tauri bundle targets declared in [apps/desktop/src-tauri/tauri.conf.json](/home/ken/opsprobe/apps/desktop/src-tauri/tauri.conf.json).

Current default bundle targets:

- Linux: `deb`, `appimage`, `rpm`
- Windows: `nsis`

### Linux Build

Run:

`npm run desktop:build`

Expected Linux artifacts are written under:

- `apps/desktop/src-tauri/target/release/bundle/deb/`
- `apps/desktop/src-tauri/target/release/bundle/appimage/`
- `apps/desktop/src-tauri/target/release/bundle/rpm/`

### Windows Build

Preferred command on a Windows build machine:

`npm --workspace @opsprobe/desktop run tauri build -- --target x86_64-pc-windows-msvc`

Expected Windows installer output:

- `apps/desktop/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/`

Current Linux cross-build fallback:

`npm --workspace @opsprobe/desktop run tauri build -- --target x86_64-pc-windows-gnu`

Fallback artifact output:

- `apps/desktop/src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/`

### Windows Packaging Notes

- `x86_64-pc-windows-msvc` requires the Rust target to be installed on the build machine
- Linux cross-builds may still fail on network-dependent crate fetches or Windows-specific toolchain gaps
- A release should only advertise a Windows installer after the `.exe` is present in the NSIS output directory and basic install validation has been recorded
