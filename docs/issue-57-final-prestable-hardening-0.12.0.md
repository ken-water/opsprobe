# Issue 57 Proposal: `0.12.0` Final Pre-Stable Hardening

Suggested title:

- `0.12.0: final packaged acceptance hardening before 1.0.0`

## Problem

`0.11.x` closed the versioning and decision-discipline gaps, but it did not close the last packaged acceptance gaps strongly enough to justify `1.0.0`.

The remaining blockers are now concrete:

- Linux packaged human acceptance is still missing
- Windows installer acceptance is still missing
- stable-release coverage remains too thin while those two proofs are absent

## Scope

- capture one real operator-facing Linux packaged acceptance pass for the current build line
- capture one real Windows installer acceptance pass on a Windows-capable environment
- refresh the stable review record and stable-readiness outcome from those new artifacts
- keep release notes and operator docs aligned to the actual proved behavior

Current execution records:

- [Issue 57 Linux Packaged Acceptance 0.12.0](./issue-57-linux-packaged-acceptance-0.12.0.md)
- [Issue 57 Windows Installer Acceptance 0.12.0](./issue-57-windows-installer-acceptance-0.12.0.md)
- [Issue 57 Progress 0.12.1](./issue-57-progress-0.12.1.md)
- [Issue 57 Linux Packaged Acceptance 0.12.1](./issue-57-linux-packaged-acceptance-0.12.1.md)
- [Issue 57 Windows Installer Acceptance 0.12.1](./issue-57-windows-installer-acceptance-0.12.1.md)
- [Issue 57 Progress 0.12.2](./issue-57-progress-0.12.2.md)

## Non-Goals

- no broad UX redesign
- no new inspection features
- no multilingual foundation work
- no hosted or website work

## Definition Of Done

- Linux packaged acceptance is recorded by a real operator-facing pass, not only by headless smoke
- Windows installer acceptance is recorded by a real Windows-capable pass, not only by artifact existence or Wine limitations
- the stable review record no longer lists packaged acceptance as the primary blocker
- the repository can re-open the `1.0.0` decision with concrete evidence instead of placeholders
