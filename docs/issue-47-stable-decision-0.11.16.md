# Issue 47 Stable Decision Summary: `0.11.16`

This document is the final written recommendation produced by the `0.11.x` closeout line.

It answers one question only:

- should OpsProbe proceed into `1.0.0` now, or should it open another bounded pre-stable line first?

## Reviewed Evidence

- [Stable Release Readiness](./stable-readiness.md)
- [Stable Review Record](./stable-review-record.md)
- [Issue 56 Stable Decision Blockers 0.11.15](./issue-56-stable-decision-blockers-0.11.15.md)
- [Issue 56 Progress 0.11.15](./issue-56-progress-0.11.15.md)
- [Issue 54 Linux Packaged Acceptance 0.11.0](./issue-54-linux-packaged-acceptance-0.11.0.md)
- [Draft Issue 55 Windows Installer Acceptance 0.11.1](./draft-issue-55-windows-installer-acceptance-0.11.1.md)
- current clean-profile, bundle, preflight, launch-smoke, desktop UI, and browser UI validation evidence

## Final Recommendation

- Do not publish `1.0.0` yet
- Open `0.12.0` as a bounded final pre-stable hardening line

## Why `1.0.0` Should Be Deferred

The repository is materially stronger than it was before the `0.11.x` closeout line:

- versioning and release discipline are stronger
- the desktop workflow is clearer and more consistent
- clean-profile bootstrap and local runtime guidance are credible
- several former blockers can now be treated as accepted limits if documented honestly

However, the strongest remaining blockers are still real:

1. Linux packaged acceptance is still mostly scripted and headless
2. Windows installer acceptance is still not proven on a Windows-capable environment
3. Because of those gaps, overall stable-release coverage is still too thin for a defensible `1.0.0`

That means the project is no longer blocked by vague uncertainty. It is blocked by a short, concrete list of remaining proof gaps.

## Accepted Limits If Stable Were Otherwise Ready

These areas now look acceptable in principle if documented honestly:

- process-based and best-effort runtime supervision
- operator-driven SSH verification and credential rebind flow
- partially manual upgrade rollback expectations
- HTML/PDF export scope that avoids overstating packaged-desktop human acceptance

These are not the reasons to defer.

## What `0.12.0` Must Do

`0.12.0` should be the final bounded line before `1.0.0`, focused only on:

- one real operator-facing Linux packaged acceptance pass
- one real Windows installer acceptance pass
- explicit refresh of the stable decision record after those proofs exist

Non-goals for `0.12.0`:

- no broad desktop UX expansion
- no multilingual work
- no hosted/web product expansion
- no hidden architectural exploration

## Resulting Path

1. close `0.11.x` at `0.11.16`
2. open `0.12.0` with a narrow evidence-only scope
3. revisit `1.0.0` after `0.12.0` closes the packaged acceptance gaps
