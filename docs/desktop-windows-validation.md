# Desktop Windows Validation

Use this workflow to prove whether the current version has a Windows desktop binary and NSIS installer for the selected target triple.

It is narrower than real installer acceptance. It answers whether Windows artifacts exist and whether Wine-based launch can even be attempted from the current machine.

## Commands

- `npm run desktop:validate-windows-record`
- `npm run desktop:validate-windows-wine-record`
- `npm --workspace @opsprobe/desktop run tauri build -- --target x86_64-pc-windows-gnu`

## Evidence Output

- `.opsprobe-validation/desktop-windows-validation-record.json`
- `.opsprobe-validation/desktop-windows-validation-record.md`
- `.opsprobe-validation/desktop-windows-wine-validation-record.json`
- `.opsprobe-validation/desktop-windows-wine-validation-record.md`

These records are intentionally split:

- the Windows validation record answers whether the current version has a matching Windows binary and NSIS installer artifact
- the Wine validation record answers whether the current machine can actually attempt a Windows installer launch

For a later `0.11.x` Windows acceptance checkpoint, continue with these drafts after the current stable-candidate checkpoint is released:

- [Draft Issue 55 Runbook](./draft-issue-55-windows-installer-runbook.md)
- [Draft Issue 55 Windows Installer Acceptance 0.11.1](./draft-issue-55-windows-installer-acceptance-0.11.1.md)
