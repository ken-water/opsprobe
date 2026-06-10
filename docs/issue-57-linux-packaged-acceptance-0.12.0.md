# Issue 57 Linux Packaged Acceptance: `0.12.0`

Use this note to capture the real operator-facing Linux packaged acceptance pass required by `0.12.0`.

This file replaces the older `0.11.0` placeholder as the current-version acceptance record.

Before filling this note, run:

```bash
npm run env:check:strict
./scripts/validate-desktop-packaged-acceptance-preflight.sh
./scripts/validate-desktop-packaged-launch-smoke.sh
```

If those steps fail, record that first and do not present this note as successful packaged acceptance evidence.

## Candidate Metadata

- Candidate version: `0.12.0`
- Validation date:
- Reviewer:
- Machine label:
- Operating system:
- Desktop session type:
- Package format reviewed:
- Package path:
- Install command:
- Launch command:

## Preconditions

- `npm run env:check:strict` passed:
- `./scripts/validate-desktop-packaged-acceptance-preflight.sh` passed:
- `./scripts/validate-desktop-packaged-launch-smoke.sh` passed:
- `.opsprobe-validation/desktop-packaged-validation-record.json` shows `currentVersion: 0.12.0`:
- Notes:

## 1. Install And Launch Credibility

- Package installed or launched successfully:
- App icon and product name rendered correctly:
- Desktop menu or launcher entry was visible if applicable:
- Window opened without a blank screen:
- First screen was understandable without reading source code:
- Notes:

## 2. First-Run Runtime Understanding

- `Readiness Summary` was visible:
- `Actionable Repair Packs` was visible:
- `First-Run Wizard` was visible:
- Service status could be refreshed:
- PostgreSQL bootstrap or start actions were understandable:
- Recovery guidance was understandable if repair was needed:
- Notes:

## 3. First Useful Inspection Workflow

- Asset entry was understandable:
- SSH verification path was understandable:
- Preview inspection could be triggered:
- Full inspection run could be triggered:
- Findings were understandable:
- Notes:

## 4. Export And Follow-Up

- Config export worked:
- HTML report export worked:
- PDF report export worked:
- Open or reveal actions worked:
- Export locations were understandable:
- Notes:

## 5. Reopen And Recovery

- After close and reopen, the app remained usable:
- Runtime state after reopen was understandable:
- Any repair steps after reopen were understandable:
- No obvious stalled buttons or misleading empty states were observed:
- Notes:

## 6. Acceptance Outcome

Choose one:

- Accept as credible packaged Linux evidence for `0.12.0`
- Accept with limitations and carry those limits into the reopened `1.0.0` decision
- Reject and continue pre-stable hardening

Reasoning:

- 

## 7. Copy-Paste Summary For Issue 57

```md
Linux packaged acceptance for `0.12.0` was reviewed on a real operator-facing desktop session.

- package format:
- install or launch result:
- blank window observed: yes/no
- first-run readiness understandable: yes/no
- asset save and inspection path understandable: yes/no
- HTML/PDF export usable: yes/no
- reopen and recovery understandable: yes/no
- outcome:

Remaining limitations:
- 
```
