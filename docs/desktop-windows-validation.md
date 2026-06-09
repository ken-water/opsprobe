# Desktop Windows Validation

Use this workflow to prove whether the current version has a Windows desktop binary and NSIS installer for the selected target triple.

## Commands

- `npm run desktop:validate-windows-record`
- `npm --workspace @opsprobe/desktop run tauri build -- --target x86_64-pc-windows-gnu`

## Evidence Output

- `.opsprobe-validation/desktop-windows-validation-record.json`
- `.opsprobe-validation/desktop-windows-validation-record.md`

This record is intentionally narrow: it answers whether the current version has a matching Windows binary and installer artifact, and whether more Windows-side install validation is still missing.
