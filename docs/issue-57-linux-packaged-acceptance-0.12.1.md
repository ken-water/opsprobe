# Issue 57 Linux Packaged Acceptance: `0.12.1`

This note records the current Linux packaged acceptance status for `0.12.1`.

It is stronger than the `0.12.0` template because it already includes the automated current-version evidence that exists on this machine. It still does not claim a completed human desktop acceptance pass.

## Candidate Metadata

- Candidate version: `0.12.1`
- Validation date: `2026-06-10`
- Reviewer: Codex-assisted repository validation
- Machine label: local development environment
- Operating system: Linux workspace
- Desktop session type: `tty` without active `DISPLAY`
- Package format reviewed: `.deb`, `.rpm`, `.AppImage`, and AppImage smoke path
- Package path: `apps/desktop/src-tauri/target/release/bundle/appimage/OpsProbe_0.12.1_amd64.AppImage`
- Install command: not completed on an operator-facing desktop session yet
- Launch command: `xvfb-run -a apps/desktop/src-tauri/target/release/bundle/appimage/OpsProbe_0.12.1_amd64.AppImage`

## Preconditions

- `npm run env:check:strict` passed: yes
- `npm run desktop:build` passed: yes
- `./scripts/validate-desktop-packaged-acceptance-preflight.sh` passed: yes
- `./scripts/validate-desktop-packaged-launch-smoke.sh` passed: yes
- `.opsprobe-validation/desktop-packaged-acceptance-preflight.json` shows `version: 0.12.1`: yes
- `.opsprobe-validation/desktop-packaged-launch-smoke.json` shows `version: 0.12.1`: yes
- Notes:
  Current machine evidence confirms that `0.12.1` Linux bundle artifacts exist, packaged preflight is ready, and the AppImage remains alive for the smoke window under `xvfb-run`. However, this machine is not currently running a real graphical desktop session, so the operator-facing acceptance steps below remain pending and must not be marked complete yet.

## 1. Install And Launch Credibility

- Package installed or launched successfully: partially
- App icon and product name rendered correctly: not yet confirmed on a real desktop session
- Desktop menu or launcher entry was visible if applicable: not yet confirmed
- Window opened without a blank screen: not yet confirmed on a real desktop session
- First screen was understandable without reading source code: not yet confirmed on a real desktop session
- Notes:
  Packaged launch smoke succeeded under `xvfb-run` for at least 10 seconds on the current `0.12.1` AppImage. This proves the bundle starts and stays alive briefly, but it does not replace a human-operated desktop review.

## 2. First-Run Runtime Understanding

- `Readiness Summary` was visible: pending real desktop session
- `Actionable Repair Packs` was visible: pending real desktop session
- `First-Run Wizard` was visible: pending real desktop session
- Service status could be refreshed: pending real desktop session
- PostgreSQL bootstrap or start actions were understandable: pending real desktop session
- Recovery guidance was understandable if repair was needed: pending real desktop session
- Notes:
  Repository-level operator walkthrough evidence already proves these UI labels and command boundaries exist, but this specific note still requires a real operator-facing packaged check.

## 3. First Useful Inspection Workflow

- Asset entry was understandable: pending real desktop session
- SSH verification path was understandable: pending real desktop session
- Preview inspection could be triggered: pending real desktop session
- Full inspection run could be triggered: pending real desktop session
- Findings were understandable: pending real desktop session
- Notes:
  Current automated evidence proves the packaged shell is present and launchable, but the packaged desktop workflow still needs one human pass.

## 4. Export And Follow-Up

- Config export worked: pending real desktop session
- HTML report export worked: pending real desktop session
- PDF report export worked: pending real desktop session
- Open or reveal actions worked: pending real desktop session
- Export locations were understandable: pending real desktop session
- Notes:
  Export surfaces remain in scope for the human acceptance pass and are not yet closed by this machine's headless proof.

## 5. Reopen And Recovery

- After close and reopen, the app remained usable: pending real desktop session
- Runtime state after reopen was understandable: pending real desktop session
- Any repair steps after reopen were understandable: pending real desktop session
- No obvious stalled buttons or misleading empty states were observed: pending real desktop session
- Notes:
  This note remains intentionally incomplete until an operator-facing desktop session confirms reopen behavior directly.

## 6. Acceptance Outcome

Choose one:

- Accept as credible packaged Linux evidence for `0.12.1`
- Accept with limitations and carry those limits into the reopened `1.0.0` decision
- Reject and continue pre-stable hardening

Current reading:

- not yet accepted
- automated evidence is current and healthy
- real operator-facing packaged acceptance is still missing

## 7. Copy-Paste Summary For Issue 57

```md
Linux packaged acceptance for `0.12.1` was refreshed on the current Linux machine.

- package formats present: deb / rpm / AppImage
- packaged preflight version aligned: yes
- AppImage launch smoke held for 10 seconds: yes
- blank window checked by human: no
- first-run readiness checked by human: no
- asset save and inspection path checked by human: no
- HTML/PDF export checked by human: no
- reopen and recovery checked by human: no
- outcome: automated evidence refreshed, human acceptance still pending

Remaining limitations:
- current machine is still `tty` without an operator-facing desktop session
```
