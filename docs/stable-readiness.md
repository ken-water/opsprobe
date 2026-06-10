# Stable Release Readiness

This document defines the explicit decision gate for `1.0.0`.

OpsProbe should not enter `1.0.0` because the repository feels mature enough. It should enter `1.0.0` only when the stable-release checklist below is reviewed with evidence and the remaining limits are either fixed or deliberately accepted.

Related issue:

- Issue 47

## Decision Outcomes

The `1.0.0` review must end in one of two outcomes:

1. Continue with another `0.x` hardening cycle and create the missing pre-`1.0.0` issues
2. Accept the current state as stable enough, document the remaining limits, and prepare a `1.0.0` release candidate

If neither outcome can be defended clearly, the review is incomplete.

## Review Checklist

### 1. Release Discipline

- [ ] The current candidate passes `./scripts/check-worktree-gate.sh`
- [ ] The current candidate passes `./scripts/check-version-gate.sh 1.0.0`
- [ ] The current candidate passes `./scripts/check-release-readiness.sh 1.0.0`
- [ ] The `release-notes/v1.0.0.md` scope matches the actual milestone and shipped behavior
- [ ] The `1.0.0` milestone contains the full stable-release scope and no hidden side work

Required evidence:

- command output captured in the issue or release preparation notes
- linked release notes draft

### 2. Install And Bootstrap Credibility

- [ ] A new user can install the desktop build without needing to understand PostgreSQL internals
- [ ] First-run bootstrap for the local runtime and bundled PostgreSQL path is documented and repeatable
- [ ] Shutdown, restart, and re-open behavior are documented and verified
- [ ] The product explains clearly where local data lives and what should be backed up

Required evidence:

- a documented clean-machine or clean-user-profile validation path
- operator notes for install, start, stop, restart, and backup

### 3. Primary Workflow Reliability

- [ ] Asset creation and editing are reliable in the desktop workflow
- [ ] SSH credential setup, including key-based authentication, is proven in the current build
- [ ] At least one repeatable inspection path for Linux hosts is validated end to end
- [ ] The report export path is reliable for the supported report formats
- [ ] Failure states show actionable operator guidance instead of silent or vague errors

Required evidence:

- smoke validation output
- manual validation notes for the current release candidate

### 4. Upgrade And Migration Trust

- [ ] Upgrade from the latest supported `0.9.x` release is documented and repeatable
- [ ] Asset, credential, schedule, and settings migration behavior is explained honestly
- [ ] Credential rebind after migration is validated before recurring schedules can resume, or the gap is explicitly accepted and documented
- [ ] Rollback or recovery expectations are documented if upgrade repair is manual

Required evidence:

- upgrade test notes from a real `0.9.x` state
- documentation for migration limits and operator actions

### 5. Stability And Recovery

- [ ] Crash recovery expectations are tested or explicitly limited in documentation
- [ ] First-run repair behavior is tested or explicitly limited in documentation
- [ ] Upgrade continuity is tested or explicitly limited in documentation
- [ ] Local runtime supervision limits are documented honestly if service-manager integration is still best-effort

Required evidence:

- manual validation notes for recovery scenarios
- known-limit entries in release notes and docs

### 6. Data Model And Runtime Boundary

- [ ] The split between PostgreSQL-backed runtime data and other local state is acceptable for `1.0.0`, or a pre-stable fix issue exists
- [ ] Backup and restore expectations match the real storage layout
- [ ] Machine replacement or host migration steps are documented at the operator level

Required evidence:

- storage-layout documentation
- either an explicit acceptance note or linked pre-`1.0.0` issue for remaining data-boundary gaps

### 7. Test Coverage Sufficiency

- [ ] Unit, integration, smoke, and manual functional coverage are reviewed together instead of assumed
- [ ] The current coverage is strong enough to catch likely release-breaking regressions in the shipped workflow
- [ ] Any thin coverage areas are listed explicitly in the stable decision record

Required evidence:

- links to the current test strategy and executed validation commands
- a short coverage summary captured in Issue 47

### 8. Honest Product Boundary

- [ ] `README.md`, release notes, and in-product copy describe the community edition honestly
- [ ] Known unsupported areas are visible to users before they rely on them
- [ ] `1.1.0` and `1.2.0` work is not implied to already exist in `1.0.0`

Required evidence:

- doc review against shipped behavior
- stable-release notes that separate current capability from future roadmap

## Current Known Gaps To Resolve Or Accept

These gaps already exist and must not stay implicit during the `1.0.0` decision:

- schedules and desktop settings are being unified into the active storage boundary; Issue 50 should be closed only after the new layout, backup expectations, and machine-move guidance are all validated
- desktop end-to-end coverage is still thin for crash recovery, first-run repair, and upgrade continuity, but `0.10.2` now includes automated evidence for malformed file-storage recovery, malformed status-file recovery, stale PID cleanup, and stopped-state continuity; see Issue 52
- rebound credentials now require explicit SSH validation before recurring schedules can resume, but the overall recovery UX still needs broader pre-stable review; see Issue 51
- local runtime supervision is still process-based and best-effort rather than a hardened cross-platform service-manager integration; see Issue 53
- `0.10.3` should at minimum keep start, stop, restart, and recovery guidance explicit in both status output and operator-facing docs even if a full supervisor is deferred; see Issue 53
- clean-machine install, bootstrap, and stable-candidate evidence are still not captured strongly enough to defend `1.0.0`; see Issue 54

Each gap needs one of these dispositions:

- fixed before `1.0.0`
- accepted for `1.0.0` and documented clearly
- moved into a new pre-stable `0.x` issue

## Review Record

Issue 47 should capture:

- the final decision outcome
- the evidence reviewed
- the accepted limits
- the follow-up issues created if `1.0.0` is deferred

Current closeout references:

- [Issue 56 Stable Decision Blockers 0.11.15](./issue-56-stable-decision-blockers-0.11.15.md)
- [Issue 56 Progress 0.11.15](./issue-56-progress-0.11.15.md)
- [Draft Issue 56 Stable Decision Runbook](./draft-issue-56-stable-decision-runbook.md)
- [Issue 47 Stable Decision Summary 0.11.16](./issue-47-stable-decision-0.11.16.md)
- [Issue 57 Final Pre-Stable Hardening 0.12.0](./issue-57-final-prestable-hardening-0.12.0.md)

`0.11.16` should use the current blocker table above rather than restarting from the older `0.11.2` draft wording.
