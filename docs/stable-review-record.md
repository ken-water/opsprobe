# Stable Review Record

Use this record when resuming `Issue 47`.

This file is the bridge between raw validation evidence and the actual stable-release decision. It should be updated from concrete artifacts, not memory.

## Candidate

- Version under review: `0.11.16`
- Review date: `2026-06-10`
- Reviewer: Codex-assisted repository review
- Related issues:
  - Issue `47`
  - Issue `54`
  - Issue `55`
  - Issue `56`

## 1. Release Discipline

- Checkpoint gate status: current `main` development line is clean and pushed after the `0.11.14` release and `0.11.15` version bump
- Version gate status: `0.11.15` is part of the documented `0.11.x` closeout exception through `0.11.16`
- Release-readiness status: still not applicable yet for `1.0.0`; the repository is in the final decision-prep line, not a release-candidate tag
- Release notes draft reviewed: `v1.0.0` release notes still do not exist and should not be fabricated before the final proceed-or-defer decision
- Milestone scope reviewed: yes, against Issues `47`, `54`, `55`, and `56`

## 2. Install And Bootstrap Credibility

- Clean-user-profile validation completed: yes, via `./scripts/validate-clean-user-profile.sh`
- Install prerequisites understood by operator: yes for Linux local-first setup; PostgreSQL binary discovery and recovery actions are documented
- First-run bootstrap path documented: yes, for clean-profile local runtime bootstrap
- Stop / restart / re-open behavior documented: yes, for local-service stop, restart preparation, and follow-up recovery actions
- Backup scope explained clearly: yes, at the current operator-document level for `~/.opsprobe/data`, `~/.opsprobe/runtime`, and exported config packages

## 3. Primary Workflow Reliability

- Asset save/edit path credible: yes, through clean-profile CLI validation and desktop workflow boundary checks
- SSH setup credible: partially; credible enough to classify as an accepted operator-driven limit if stable proceeds, but still not packaged-desktop-proven
- Inspection preview/run path credible: yes for current local-service validation; still thin for packaged desktop operator proof
- Report export path credible: partially; export surfaces exist and are checked, but packaged human acceptance depth remains unresolved
- Failure guidance actionable: yes, especially around local runtime, PostgreSQL bootstrap, and recovery actions

## 4. Upgrade And Migration Trust

- Latest supported upgrade path reviewed: partially, based on prior `0.10.x` hardening evidence rather than a fresh current-version upgrade rehearsal
- Migration behavior documented honestly: yes, including source-machine provenance and post-import operator steps
- Credential rebind expectations documented: yes, including verification-before-resume expectations from prior hardening work
- Rollback or recovery expectations documented: partially; recovery guidance is documented, but full upgrade rollback remains manual and thinly validated

## 5. Stability And Recovery

- Crash recovery evidence: present from prior `0.10.2` hardening line and still applicable
- First-run repair evidence: present through runtime status and recovery-action guidance, but still not packaged-desktop acceptance-grade
- Upgrade continuity evidence: partially present from `0.10.2` and `0.10.3`; still thin as a stable sign-off input
- Runtime supervision limits accepted or rejected: now classified as an accepted-limit candidate if stable proceeds

## 6. Data Boundary

- Active state boundary acceptable: provisionally yes, based on `0.10.x` hardening outcomes and current backup/machine-move documentation
- Backup and restore expectations acceptable: yes at the current documented scope
- Machine replacement workflow acceptable: provisionally yes, with explicit credential rebind and schedule trust caveats

## 7. Coverage Review

- Unit coverage summary: current desktop UI and browser UI validation have continued to pass on the active closeout line
- Integration coverage summary: current desktop browser validation still covers the main operator workflow, export actions, and responsiveness expectations
- Smoke coverage summary: the stable-candidate evidence line has repeatable clean-profile, bundle, preflight, launch-smoke, and desktop walkthrough scripts, but not a full stable release rehearsal
- Manual validation summary: clean-profile validation and repository-driven desktop evidence are strong enough to classify several limits, but they do not replace real operator-facing packaged acceptance on Linux or Windows
- Current machine packaged note status: preconditions and headless launch evidence are captured, but the machine is still `tty` without an active `DISPLAY`, so one real operator-facing Linux desktop pass is still outstanding
- Thin areas still remaining: real operator-driven packaged Linux acceptance depth, current-version Windows installer generation and acceptance, and broader stable-release human walkthrough evidence
- The dedicated Linux and Windows acceptance note templates now exist, so the remaining gap is no longer how to record the proof but whether the proof itself is present

## 8. Honest Product Boundary

- README and docs reflect actual scope: yes, after the `0.11.x` closeout-line clarification and current community-edition wording
- Unsupported areas visible before reliance: yes, especially for Windows acceptance and future multilingual / website work
- Post-stable roadmap not implied as already shipped: yes

## Accepted Limits

- Limit 1: runtime supervision can remain process-based and best-effort if release notes and operator docs state that limit clearly
- Limit 2: credential rebind and SSH verification can remain operator-driven if recurring schedules stay blocked until verification succeeds
- Limit 3: upgrade and migration trust can remain partially manual if rollback expectations and post-import operator steps stay explicit
- Limit 4: HTML/PDF export can be considered stable enough only if release notes avoid overstating packaged-desktop human proof

## Blocking Reasons

- Blocker 1: Linux packaged evidence is still mostly scripted and headless; a real operator-driven packaged acceptance pass is still missing
- Blocker 2: current-version Windows packaged evidence is incomplete because installer acceptance is still not captured on a Windows-capable environment
- Blocker 3: because those packaged gaps remain open, overall stable-release coverage still looks too thin for a confident `1.0.0` claim

## Decision

Outcome:

- defer `1.0.0`
- open `0.12.0` as a bounded final pre-stable hardening line

Reasoning:

- the stable-candidate evidence line is materially stronger than it was before the later `0.11.x` closeout checkpoints
- several remaining limits are now explicit enough to classify as accepted rather than vague blockers
- however, Linux packaged human acceptance and Windows installer acceptance still remain the clearest unresolved blockers
- because those packaged gaps remain open, overall stable-release coverage is still too thin for a defensible `1.0.0`
- the remaining work is now narrow enough to justify one last bounded pre-stable line instead of another open-ended defer cycle

## Evidence Links

- [Stable Candidate Operator Notes 0.11.0 Draft](./stable-candidate-operator-notes-0.11.0.md)
- [Clean User Profile Validation](./clean-user-profile-validation.md)
- [Stable Release Readiness](./stable-readiness.md)
- [Issue 56 Stable Decision Blockers 0.11.15](./issue-56-stable-decision-blockers-0.11.15.md)
- [Issue 56 Progress 0.11.15](./issue-56-progress-0.11.15.md)
- [Issue 47 Stable Decision Summary 0.11.16](./issue-47-stable-decision-0.11.16.md)
- [Issue 57 Final Pre-Stable Hardening 0.12.0](./issue-57-final-prestable-hardening-0.12.0.md)
