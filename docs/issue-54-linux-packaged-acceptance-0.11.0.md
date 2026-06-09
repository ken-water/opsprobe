# Issue 54 Linux Packaged Acceptance: `0.11.0`

Use this note when capturing the real operator-driven Linux packaged acceptance pass that still closes the main human-evidence gap in Issue `54`.

This file is intentionally specific to `0.11.0` so the remaining stable-candidate evidence can be reviewed without mixing versions.

Before filling this note, run:

```bash
npm run env:check:strict
./scripts/validate-desktop-packaged-acceptance-preflight.sh
./scripts/validate-desktop-packaged-launch-smoke.sh
```

If those steps fail, record that first and do not present this note as a successful packaged acceptance pass.

## Candidate Metadata

- Candidate version: `0.11.0`
- Validation date: `2026-06-09`
- Reviewer: Codex-assisted repository validation
- Machine label: local development environment
- Operating system: Linux workspace
- Desktop session type: `tty` without active `DISPLAY`
- Package format reviewed: `AppImage` smoke path only on this machine; real operator-facing desktop pass still pending
- Package path: `apps/desktop/src-tauri/target/release/bundle/appimage/OpsProbe_0.11.0_amd64.AppImage`
- Install command: not completed on an operator-facing desktop session yet
- Launch command: `xvfb-run -a apps/desktop/src-tauri/target/release/bundle/appimage/OpsProbe_0.11.0_amd64.AppImage`

## Preconditions

- `npm run env:check:strict` passed: yes
- `./scripts/validate-desktop-packaged-acceptance-preflight.sh` passed: yes
- `./scripts/validate-desktop-packaged-launch-smoke.sh` passed: yes
- `.opsprobe-validation/desktop-packaged-validation-record.json` shows `currentVersion: 0.11.0`: yes
- Notes:
  Current machine evidence confirms that `0.11.0` Linux bundle artifacts exist, packaged preflight is ready, and the AppImage remains alive for the smoke window under `xvfb-run`. However, this machine is not currently running a real graphical desktop session, so the operator-facing acceptance steps below remain pending and must not be marked complete yet.

## 1. Install And Launch Credibility

- Package installed or launched successfully: partially
- App icon and product name rendered correctly: not yet confirmed on a real desktop session
- Desktop menu or launcher entry was visible if applicable: not yet confirmed
- Window opened without a blank screen: not yet confirmed on a real desktop session
- First screen was understandable without reading source code: not yet confirmed on a real desktop session
- Notes:
  Packaged launch smoke succeeded under `xvfb-run` for at least 10 seconds. This proves the current AppImage starts and stays alive briefly, but it does not substitute for a human-operated desktop review.

## 2. First-Run Runtime Understanding

- `Readiness Summary` was visible: pending real desktop session
- `Actionable Repair Packs` was visible: pending real desktop session
- `First-Run Wizard` was visible: pending real desktop session
- Service status could be refreshed: pending real desktop session
- PostgreSQL bootstrap or start actions were understandable: pending real desktop session
- Recovery guidance was understandable if repair was needed: pending real desktop session
- Notes:
  Repository-level operator walkthrough evidence already proves these UI labels and command boundaries exist in `0.11.0`, but this specific note still requires a real operator-facing packaged check.

## 3. First Useful Inspection Workflow

- Asset entry was understandable: pending real desktop session
- SSH verification path was understandable: pending real desktop session
- Preview inspection could be triggered: pending real desktop session
- Full inspection run could be triggered: pending real desktop session
- Findings were understandable: pending real desktop session
- Notes:
  Clean-profile CLI evidence and desktop operator walkthrough evidence are present, but the packaged desktop workflow itself still needs one human pass.

## 4. Export And Follow-Up

- Config export worked: pending real desktop session
- HTML report export worked: pending real desktop session
- PDF report export worked: pending real desktop session
- Open or reveal actions worked: pending real desktop session
- Export locations were understandable: pending real desktop session
- Notes:
  Export surfaces are present in current operator walkthrough evidence, but the packaged desktop path still needs direct human confirmation.

## 5. Reopen And Recovery

- After close and reopen, the app remained usable: pending real desktop session
- Runtime state after reopen was understandable: pending real desktop session
- Any repair steps after reopen were understandable: pending real desktop session
- No obvious stalled buttons or misleading empty states were observed: pending real desktop session
- Notes:
  This note remains intentionally incomplete until an operator-facing desktop session confirms reopen behavior directly.

## 6. Acceptance Outcome

Choose one:

- Accept as credible packaged Linux evidence for `0.11.0`
- Accept with limitations and carry those limits into `0.11.2`
- Reject and continue pre-stable hardening

Reasoning:

- Current `0.11.0` Linux packaged evidence is strong at the artifact, preflight, and launch-smoke level, but this machine is not a real desktop session and therefore cannot honestly close the human acceptance gap alone.
- The next required action is a single real operator-facing packaged Linux pass using this note as the record.

## 7. Copy-Paste Summary For Issue 54

Use this section when posting the result back into Issue `54`.

```md
Linux packaged acceptance for `0.11.0` was reviewed on a real operator-facing desktop session.

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
