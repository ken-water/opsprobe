# Issue 56 Stable Decision Blockers: `0.11.15`

This document turns the accumulated pre-stable evidence into one explicit blocker table for the `1.0.0` decision.

It is intentionally current-version specific and should be treated as the source table for Issue `47` until `0.11.16` finalizes the recommendation.

## Candidate Metadata

- Review version: `0.11.15`
- Review date: `2026-06-10`
- Reviewer: Codex-assisted repository review
- Related issues:
  - Issue `47`
  - Issue `54`
  - Issue `55`
  - Issue `56`

## Blocker Table

| Blocker | Evidence Reviewed | Current Status | Disposition | Required Documentation Or Follow-Up |
| --- | --- | --- | --- | --- |
| Linux packaged operator acceptance depth | `issue-54-linux-packaged-acceptance-0.11.0.md`, `desktop-bundle-candidate-validation.md`, packaged preflight and launch-smoke artifacts, `stable-candidate-operator-notes-0.11.0.md` | partial | deferred | capture one real operator-facing Linux packaged acceptance pass or defer `1.0.0` into `0.12.0` |
| Windows installer existence and acceptance | `draft-issue-55-windows-installer-acceptance-0.11.1.md`, `desktop-windows-validation.md`, current Windows/Wine validation artifacts | open | deferred | either prove current-version NSIS installer acceptance on a Windows-capable environment or treat Windows installer credibility as a pre-`1.0.0` defer item |
| SSH key-based setup credibility in packaged flow | clean-profile validation, desktop operator walk-through, current desktop workflow and SSH troubleshooting states | partial | accepted | keep docs explicit that the supported path is operator-driven SSH setup and verification, not auto-remediated credential repair |
| Report export credibility in packaged flow | browser UI coverage, current desktop export actions, report-export notes in operator evidence | partial | accepted | keep HTML/PDF export scope honest in release notes and note that packaged human acceptance depth remains part of the Linux blocker above |
| Upgrade and migration trust from latest supported pre-stable release | `stable-review-record.md`, `clean-user-profile-validation.md`, migration/export notes, prior `0.10.x` hardening evidence | partial | accepted | call out that upgrade rollback remains manual and that credential rebind plus verification is still an operator step |
| Crash recovery and first-run repair coverage depth | `stable-readiness.md`, `stable-review-record.md`, prior `0.10.2` and `0.10.3` recovery evidence | partial | accepted | keep the thin areas explicit in Issue `47` instead of implying hardened desktop QA depth that does not exist |
| Runtime supervision limitations | runtime/recovery docs, service status guidance, restart/stop flow evidence | open | accepted | keep the best-effort process-based supervision limit explicit in `1.0.0` notes if stable proceeds |
| Storage boundary, backup, and machine replacement trust | storage layout docs, config export/import notes, clean-profile validation, machine-move guidance | partial | accepted | keep backup scope and post-import credential rebind expectations explicit in stable docs |
| Coverage thin areas still too risky for stable | unit/integration/browser validation, smoke scripts, manual evidence notes | partial | deferred | final `0.11.16` recommendation must decide whether current thin areas are acceptable or require `0.12.0` hardening |
| Honest product boundary and unsupported-scope clarity | `README.md`, roadmap/docs, current desktop/community-edition wording | closed | fixed | maintain the current honesty boundary; do not imply multilingual website or hosted features are already part of `1.0.0` |

## Current Reading Of The Table

- already acceptable with explicit documentation:
  - SSH key-based setup credibility
  - report export credibility
  - upgrade and migration trust
  - crash recovery and first-run repair limits
  - runtime supervision limitations
  - storage boundary, backup, and machine replacement trust
- still blocking a credible stable sign-off:
  - Linux packaged operator acceptance depth
  - Windows installer existence and acceptance
  - overall coverage thin areas if those two gaps remain open

## Provisional Release-Or-Defer Reading

If no stronger evidence is added before `0.11.16`, the table currently leans toward:

- defer `1.0.0`
- open `0.12.0` as a bounded final pre-stable hardening line

That is still a provisional reading, not the final decision.
