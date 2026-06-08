# Releasing Guide

OpsProbe releases should be created with all three artifacts aligned:

- Git commit
- Git tag
- GitHub release notes

## Release Checklist

0. Before development for a new minor or major version begins, run the development gates:
   - `./scripts/check-worktree-gate.sh`
   - `./scripts/check-version-gate.sh <target-version>`
   - if the previous minor has no tag or GitHub release yet, publish it before starting the next one
1. Before switching to another issue or ending the work session, commit and push the current checkpoint
2. Update version references in:
   - root `package.json`
   - `apps/desktop/package.json`
   - `apps/desktop/src-tauri/Cargo.toml`
   - `apps/desktop/src-tauri/tauri.conf.json`
   - `CHANGELOG.md`
3. Verify the release scope matches the current milestone in [releases.md](./releases.md)
   - for `1.0.0`, complete the review in [stable-readiness.md](./stable-readiness.md)
4. Run build and validation commands
   - `./scripts/smoke-release-candidate.sh`
   - `./scripts/check-release-readiness.sh <target-version>`
5. Commit with a release-oriented message
6. Create an annotated tag
7. Push branch and tags
8. Publish a GitHub release with structured notes
9. Do not begin the next minor version until the previous minor's release commit, tag, and GitHub release all exist on GitHub

If step 1 is skipped, development should not continue into another issue.

## Release Readiness Gate

Before publishing a release, OpsProbe also requires a release-readiness gate:

- version files must all align to the target release
- `release-notes/v<target-version>.md` must exist
- `CHANGELOG.md`, `README.md`, and desktop release copy must reference the target release
- the release-candidate smoke script must have completed for the same target version

Use:

`./scripts/check-release-readiness.sh <target-version>`

For `1.0.0`, release readiness is necessary but not sufficient. The stable-release review in [stable-readiness.md](./stable-readiness.md) must also be completed with explicit evidence and a written decision.

For the pre-stable `0.11.x` evidence line, also capture:

- `./scripts/validate-clean-user-profile.sh`
- `./scripts/validate-desktop-stable-candidate.sh`
- `./scripts/validate-desktop-operator-walkthrough.sh`
- `./scripts/capture-stable-candidate-evidence.sh`
- the operator notes in [clean-user-profile-validation.md](./clean-user-profile-validation.md)
- the desktop candidate notes in [desktop-stable-candidate-validation.md](./desktop-stable-candidate-validation.md)
- the desktop operator walk-through in [desktop-operator-walkthrough.md](./desktop-operator-walkthrough.md)
- the filled validation record based on [stable-candidate-operator-notes.md](./stable-candidate-operator-notes.md)
- the current issue-specific draft such as [stable-candidate-operator-notes-0.11.0.md](./stable-candidate-operator-notes-0.11.0.md)
- the decision summary based on [stable-review-record.md](./stable-review-record.md)

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
