# Draft: Issue 56 Runbook For Future `0.11.2` Stable Decision Blocker Review

Use this draft runbook later when `0.11.2` actually begins.

Goal:

- turn the accumulated `0.11.0` and `0.11.1` evidence into one explicit `1.0.0` release-or-defer decision
- prevent the repository from drifting into `1.0.0` just because enough work has accumulated

## Preconditions

- repository is on the `0.11.2` development line
- working tree is clean
- the `0.11.0` Linux packaged acceptance note is either completed or explicitly marked as still blocked
- the `0.11.1` Windows installer acceptance note is either completed or explicitly marked as still blocked
- the latest evidence documents are already pushed

Before the review begins, run:

```bash
npm run env:check:strict
./scripts/smoke-release-candidate.sh
./scripts/check-worktree-gate.sh
./scripts/check-version-gate.sh 1.0.0
```

If `release-notes/v1.0.0.md` already exists and version files are aligned for a candidate rehearsal, also run:

```bash
./scripts/check-release-readiness.sh 1.0.0
```

If that command is not yet meaningful, record why it is premature instead of pretending the gate passed.

## 1. Refresh The Decision Inputs

Review these sources together:

- [stable-readiness.md](./stable-readiness.md)
- [stable-review-record.md](./stable-review-record.md)
- [issue-54-linux-packaged-acceptance-0.11.0.md](./issue-54-linux-packaged-acceptance-0.11.0.md)
- [draft-issue-55-windows-installer-acceptance-0.11.1.md](./draft-issue-55-windows-installer-acceptance-0.11.1.md)
- current `.opsprobe-validation/` smoke and validation artifacts

## 2. Classify Every Remaining Blocker

Complete:

- [Draft Issue 56 Stable Decision Blocker Table](./draft-issue-56-stable-decision-blockers-0.11.2.md)

Allowed dispositions only:

- fixed before `1.0.0`
- accepted for `1.0.0` with explicit documentation
- deferred into another pre-stable issue

Do not leave blockers in an implied or ambiguous state.

## 3. Decide Release Or Defer

Complete:

- [Draft Issue 56 Progress 0.11.2](./draft-issue-56-progress-0.11.2.md)

The recommendation must end in one of two outcomes:

- prepare `1.0.0` release candidate
- defer and define the next bounded `0.x` issue line before more coding begins

## 4. Update Issue 47

After the blocker table and decision recommendation exist, update Issue `47` with:

- the reviewed evidence set
- the blocker classification table
- the accepted limits
- the release-or-defer recommendation
- the follow-up issues if `1.0.0` is deferred

## Failure Note

If the review cannot produce a clear recommendation, capture:

- which blockers are still missing evidence
- which blocker dispositions are still disputed
- which exact new issue or validation pass is needed before the decision can resume

Do not continue into `1.0.0` planning while those gaps stay vague.
