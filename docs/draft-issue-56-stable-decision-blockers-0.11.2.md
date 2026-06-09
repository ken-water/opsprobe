# Draft: Issue 56 Stable Decision Blockers For Future `0.11.2`

Use this draft table later to classify every remaining `1.0.0` blocker during `0.11.2`.

One line per blocker. Do not merge unrelated risks into one vague item.

## Candidate Metadata

- Review version: `0.11.2`
- Review date:
- Reviewer:
- Related issues:
  - Issue `47`
  - Issue `54`
  - Issue `55`
  - Issue `56`

## Blocker Table

| Blocker | Evidence Reviewed | Current Status | Disposition | Required Documentation Or Follow-Up |
| --- | --- | --- | --- | --- |
| Linux packaged operator acceptance depth |  | open / closed / partial | fixed / accepted / deferred |  |
| Windows installer existence and acceptance |  | open / closed / partial | fixed / accepted / deferred |  |
| SSH key-based setup credibility in packaged flow |  | open / closed / partial | fixed / accepted / deferred |  |
| Report export credibility in packaged flow |  | open / closed / partial | fixed / accepted / deferred |  |
| Upgrade and migration trust from latest supported pre-stable release |  | open / closed / partial | fixed / accepted / deferred |  |
| Crash recovery and first-run repair coverage depth |  | open / closed / partial | fixed / accepted / deferred |  |
| Runtime supervision limitations |  | open / closed / partial | fixed / accepted / deferred |  |
| Storage boundary, backup, and machine replacement trust |  | open / closed / partial | fixed / accepted / deferred |  |
| Coverage thin areas still too risky for stable |  | open / closed / partial | fixed / accepted / deferred |  |
| Honest product boundary and unsupported-scope clarity |  | open / closed / partial | fixed / accepted / deferred |  |

## Review Rules

- `fixed` means the blocker is no longer blocking because current-version evidence closes it
- `accepted` means the limit remains real, but is honest enough to ship in `1.0.0` if documented clearly
- `deferred` means `1.0.0` should not proceed until a new bounded pre-stable issue closes the gap

## Release-Or-Defer Summary

- Recommended outcome:
- Why:
- If deferred, next required issue line:
