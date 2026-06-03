# Development Gate

OpsProbe requires an issue and milestone gate before starting work for a new version.

This gate exists to prevent three recurring problems:

- completed issues left open
- new scope implemented without a matching issue
- milestones drifting away from actual release work

## Gate Rule

Before starting development for a target version:

1. The previous milestone must be closed
2. Earlier milestones must not have open issues
3. The target milestone must already exist
4. The target milestone must already contain at least one open issue
5. Any new scope discovered during planning must be added as a new issue before implementation starts

If the gate fails, development should pause until the issue and milestone state is corrected.

## Required Workflow

For every new version:

1. Run the gate check script
2. Close completed issues from earlier milestones
3. Move unfinished work to the correct milestone if needed
4. Create new issues for any newly identified work
5. Start implementation only after the gate passes

## Current Practice For OpsProbe

- Patch releases may skip milestone creation if they are limited to fixes, docs, or release metadata
- Minor releases must pass the full gate
- Major releases must pass the full gate and include a release plan review

## Command

```bash
./scripts/check-version-gate.sh 0.2.0
```

## Expected Output

Pass example:

```text
[pass] previous milestone 0.1.0 is closed
[pass] no open issues found in milestones before 0.2.0
[pass] target milestone 0.2.0 exists
[pass] target milestone 0.2.0 has open issues ready for development
Gate passed for version 0.2.0
```

Failure example:

```text
[fail] previous milestone 0.1.0 is still open
[fail] target milestone 0.2.0 has no open issues
Gate failed for version 0.2.0
```
