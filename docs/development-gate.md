# Development Gate

OpsProbe requires both a version gate and a checkpoint gate before work continues.

These gates exist to prevent four recurring problems:

- completed issues left open
- new scope implemented without a matching issue
- milestones drifting away from actual release work
- too much uncommitted or unpushed work accumulating locally

## Version Gate Rule

Before starting development for a target version:

1. The previous milestone must be closed
2. The previous version must already have a pushed git tag and a published GitHub release
3. Earlier milestones must not have open issues
4. The target milestone must already exist
5. The target milestone must already contain at least one open issue
6. Any new scope discovered during planning must be added as a new issue before implementation starts

If the gate fails, development should pause until the issue and milestone state is corrected.

## Checkpoint Gate Rule

Before starting a new issue, before ending a work session, and before starting a new version:

1. The git working tree must be clean
2. The current branch must track an upstream branch
3. There must be no unpushed local commits
4. The local branch must not be behind upstream

If the gate fails, work should stop until code is committed and pushed or local state is reconciled.

This rule is intentionally strict. OpsProbe should always be restart-safe at issue boundaries.

## Required Workflow

For every new issue:

1. Finish implementation in a small enough slice to commit safely
2. Commit the checkpoint locally
3. Push the checkpoint to GitHub
4. Run the checkpoint gate before opening the next issue

For every new version:

1. Run the checkpoint gate
2. Run the version gate check script
3. Close completed issues from earlier milestones
4. Publish the previous version if its release artifacts are still missing
5. Move unfinished work to the correct milestone if needed
6. Create new issues for any newly identified work
7. Start implementation only after both gates pass

## Current Practice For OpsProbe

- Patch releases may skip milestone creation if they are limited to fixes, docs, or release metadata
- Minor releases must pass the full gate
- Major releases must pass the full gate and include a release plan review
- No new issue work should begin on top of uncommitted or unpushed code

## Commands

```bash
./scripts/check-worktree-gate.sh
./scripts/check-version-gate.sh 0.2.0
```

## Expected Output

Pass example:

```text
[pass] working tree is clean
[pass] branch main tracks origin/main
[pass] no unpushed commits
[pass] local branch is not behind upstream
Checkpoint gate passed
[pass] previous milestone 0.1.0 is closed
[pass] previous version v0.1.0 has a GitHub release
[pass] previous version v0.1.0 tag exists on origin
[pass] no open issues found in milestones before 0.2.0
[pass] target milestone 0.2.0 exists
[pass] target milestone 0.2.0 has open issues ready for development
Gate passed for version 0.2.0
```

Failure example:

```text
[fail] working tree is not clean
[fail] found 2 unpushed commit(s)
Checkpoint gate failed
[fail] previous milestone 0.1.0 is still open
[fail] previous version v0.1.0 is missing a GitHub release
[fail] target milestone 0.2.0 has no open issues
Gate failed for version 0.2.0
```
