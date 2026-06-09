# Desktop Windows Validation

Use this workflow to prove whether the current version has a Windows desktop binary and NSIS installer for the selected target triple.

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
