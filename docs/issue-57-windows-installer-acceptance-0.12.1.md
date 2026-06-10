# Issue 57 Windows Installer Acceptance: `0.12.1`

This note records the current Windows installer acceptance status for `0.12.1`.

It is stronger than the `0.12.0` template because it already includes the current artifact and Wine-blocker state. It still does not claim a successful installer acceptance pass.

## Candidate Metadata

- Candidate version: `0.12.1`
- Validation date: `2026-06-10`
- Reviewer: Codex-assisted repository validation
- Machine label: local development environment
- Operating system: Linux workspace
- Windows build or runtime environment: Linux cross-build environment only
- Target triple: `x86_64-pc-windows-gnu`
- Installer path: `apps/desktop/src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/OpsProbe_0.12.1_x64-setup.exe`
- Install command: not attempted
- Launch command: not attempted

## Preconditions

- `npm run env:check:strict` passed: yes
- `npm run desktop:validate-windows-record` passed: yes
- `npm run desktop:validate-windows-wine-record` passed or recorded an honest environmental limitation: yes
- `.opsprobe-validation/desktop-windows-validation-record.json` shows `version: 0.12.1`: yes
- `.opsprobe-validation/desktop-windows-wine-validation-record.json` shows `version: 0.12.1`: yes
- Notes:
  Current machine evidence proves the `0.12.1` Windows desktop binary exists for `x86_64-pc-windows-gnu`, but the matching NSIS installer is still missing and Wine is not installed on this machine.

## 1. Installer Credibility

- NSIS installer existed for the current version: no
- Installer launched successfully: not attempted
- Install flow completed successfully: not attempted
- Install location was understandable: not checked
- Any security prompts or warnings were understandable: not checked
- Notes:
  The current blocker is concrete: the expected `0.12.1` NSIS installer file is absent.

## 2. First Launch

- App launched successfully after install: not attempted
- No blank window was observed: not checked
- Product name and icon rendered correctly: not checked
- First screen was understandable without source-code inspection: not checked
- Notes:
  No installer acceptance can proceed until the installer exists and a Windows-capable environment is available.

## 3. Runtime And First-Run Understanding

- Runtime readiness state was understandable: pending Windows-capable validation
- Service start or stop actions were visible: pending Windows-capable validation
- PostgreSQL bootstrap or start actions were understandable: pending Windows-capable validation
- Recovery guidance was understandable if repair was needed: pending Windows-capable validation
- Notes:
  This section remains blocked behind missing installer proof.

## 4. First Useful Workflow

- Asset entry was understandable: pending Windows-capable validation
- SSH verification path was understandable: pending Windows-capable validation
- Preview inspection could be triggered: pending Windows-capable validation
- Full inspection run could be triggered: pending Windows-capable validation
- Findings were understandable: pending Windows-capable validation
- Notes:
  This section remains blocked behind missing installer proof.

## 5. Export, Reopen, And Removal

- Config export worked: pending Windows-capable validation
- HTML/PDF report export worked: pending Windows-capable validation
- App remained usable after close and reopen: pending Windows-capable validation
- Uninstall worked: pending Windows-capable validation
- Any post-uninstall leftovers were acceptable or clearly documented: pending Windows-capable validation
- Notes:
  This section remains blocked behind missing installer proof.

## 6. Acceptance Outcome

Choose one:

- Accept as credible Windows installer evidence for `0.12.1`
- Accept with limitations and carry those limits into the reopened `1.0.0` decision
- Reject and continue pre-stable hardening

Current reading:

- not accepted
- current artifact record is fresh
- installer acceptance remains blocked

## 7. Copy-Paste Summary For Issue 57

```md
Windows installer acceptance for `0.12.1` was refreshed on the current machine.

- target triple: x86_64-pc-windows-gnu
- Windows binary present: yes
- NSIS installer present: no
- Wine installed locally: no
- installer launch attempted: no
- outcome: current artifact status recorded, installer acceptance still blocked

Remaining limitations:
- missing current-version NSIS installer
- no Windows-capable acceptance environment on this machine
```
