# Stable Review Record

Use this record when resuming `Issue 47`.

This file is the bridge between raw validation evidence and the actual stable-release decision. It should be updated from concrete artifacts, not memory.

## Candidate

- Version under review: `0.11.0`
- Review date: `2026-06-09`
- Reviewer: Codex-assisted repository review
- Related issue: Issue `54`

## 1. Release Discipline

- Checkpoint gate status: current `main` development line is clean and pushed after the `0.10.8` release and `0.11.0` version bump
- Version gate status: `0.11.0` planning line exists and is now the active development version after `0.10.8`
- Release-readiness status: not applicable yet for `1.0.0`; `0.11.0` is an evidence line, not a release-candidate tag
- Release notes draft reviewed: `0.11.0` is still represented by the operator-notes and issue draft path rather than a release-notes file
- Milestone scope reviewed: yes, against Issue `54` and the current `0.11.x` roadmap line

## 2. Install And Bootstrap Credibility

- Clean-user-profile validation completed: yes, via `./scripts/validate-clean-user-profile.sh`
- Install prerequisites understood by operator: yes for Linux local-first setup; PostgreSQL binary discovery and recovery actions are documented
- First-run bootstrap path documented: yes, for clean-profile local runtime bootstrap
- Stop / restart / re-open behavior documented: yes, for local-service stop, restart preparation, and follow-up recovery actions
- Backup scope explained clearly: yes, at the current operator-document level for `~/.opsprobe/data`, `~/.opsprobe/runtime`, and exported config packages

## 3. Primary Workflow Reliability

- Asset save/edit path credible: yes, through clean-profile CLI validation and desktop workflow boundary checks
- SSH setup credible: partially; SSH path and key-based flow exist, but current `0.11.0` evidence is still more repository-driven than packaged-desktop-driven
- Inspection preview/run path credible: yes for current local-service validation; still thin for packaged desktop operator proof
- Report export path credible: partially; export surfaces exist and are checked, but current `0.11.0` evidence is stronger for config export than for packaged desktop report acceptance
- Failure guidance actionable: yes, especially around local runtime, PostgreSQL bootstrap, and recovery actions

## 4. Upgrade And Migration Trust

- Latest supported upgrade path reviewed: partially, based on prior `0.10.x` hardening evidence rather than a fresh `0.11.0` upgrade rehearsal
- Migration behavior documented honestly: yes, including source-machine provenance and post-import operator steps
- Credential rebind expectations documented: yes, including verification-before-resume expectations from prior hardening work
- Rollback or recovery expectations documented: partially; recovery guidance is documented, but full upgrade rollback remains manual and thinly validated

## 5. Stability And Recovery

- Crash recovery evidence: present from prior `0.10.2` hardening line and still applicable
- First-run repair evidence: present through runtime status and recovery-action guidance, but still not packaged-desktop acceptance-grade
- Upgrade continuity evidence: partially present from `0.10.2` and `0.10.3`; not yet expanded further in `0.11.0`
- Runtime supervision limits accepted or rejected: not finally accepted yet; currently still an acceptable-limit candidate pending stable decision

## 6. Data Boundary

- Active state boundary acceptable: provisionally yes for review, based on `0.10.x` hardening outcomes
- Backup and restore expectations acceptable: yes at the current documented scope
- Machine replacement workflow acceptable: provisionally yes, with explicit credential rebind and schedule trust caveats

## 7. Coverage Review

- Unit coverage summary: current smoke run passed 47 unit tests
- Integration coverage summary: current smoke run passed 9 integration tests
- Smoke coverage summary: `0.11.0` smoke-release script passed for the active development line before evidence review resumed
- Manual validation summary: clean-profile validation passed; desktop stable-candidate evidence refreshed; Linux packaged bundle, preflight, launch-smoke, and operator-walkthrough evidence now refresh successfully for `0.11.0`; Windows validation records refreshed; Windows installer acceptance still remains open but should be treated as a deferred next-minor item rather than an implicit requirement to keep `0.11.0` open
- Current machine packaged note status: preconditions and headless launch evidence are captured for `0.11.0`, but the machine is still `tty` without an active `DISPLAY`, so one real operator-facing Linux desktop pass is still outstanding
- Thin areas still remaining: real operator-driven packaged Linux acceptance depth, current-version Windows installer generation and acceptance, and broader stable-release human walkthrough evidence
- The dedicated `0.11.0` Linux packaged acceptance note now exists, so the remaining gap is no longer "how to record it" but only performing and attaching that real operator pass

## 8. Honest Product Boundary

- README and docs reflect actual scope: yes, after the `0.10.8` release and `0.11.0` development-line reset
- Unsupported areas visible before reliance: yes, especially for Windows acceptance and future multilingual / website work
- Post-stable roadmap not implied as already shipped: yes

## Accepted Limits

- Limit 1: runtime supervision can remain process-based and best-effort if release notes and operator docs state that limit clearly
- Limit 2: credential rebind and SSH verification can remain operator-driven if recurring schedules stay blocked until verification succeeds

## Blocking Reasons

- Blocker 1: current-version `0.11.0` Linux packaged evidence is still mostly scripted and headless; a real operator-driven packaged acceptance pass should still be captured
- Blocker 2: current-version Windows packaged evidence is incomplete because the NSIS installer is missing and Wine is not installed on this machine; this should be recorded as an explicit defer item rather than silently expanding `0.11.0`

## Decision

Choose one:

- Continue another pre-stable issue
- Prepare `1.0.0` release candidate

Reasoning:

- `0.11.0` no longer depends on stale `0.10.3` desktop stable-candidate evidence; the current build and Tauri-shell validation record is aligned to the active version
- clean-profile bootstrap, restart guidance, backup scope, and migration understanding are strong enough to continue the stable-candidate review with concrete operator-facing material
- Linux packaged proof is now materially stronger because vendor-first `desktop:build`, bundle validation, packaged preflight, packaged launch smoke, and operator walkthrough all align to `0.11.0`
- the remaining blockers are now narrower and more honest: human packaged acceptance depth remains in scope for `0.11.0`, while Windows acceptance should be deferred explicitly instead of silently keeping this version open
- the next useful step is to capture real packaged operator acceptance on Linux, then close `0.11.0` with a written Windows defer note

## Evidence Links

- [Stable Candidate Operator Notes 0.11.0 Draft](./stable-candidate-operator-notes-0.11.0.md)
- [Clean User Profile Validation](./clean-user-profile-validation.md)
- [Stable Release Readiness](./stable-readiness.md)
