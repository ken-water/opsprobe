# OpsProbe Desktop

OpsProbe Desktop is the local-first Tauri application for running infrastructure inspections, reviewing remediation, and managing the dedicated local runtime.

## Common Commands

- `npm run env:check`
- `npm run env:check:strict`
- `npm run env:gate:desktop-packaging`
- `npm run env:prepare`
- `npm --workspace @opsprobe/desktop run dev`
- `npm --workspace @opsprobe/desktop run build`
- `npm --workspace @opsprobe/desktop run typecheck`
- `npm --workspace @opsprobe/desktop run test:ui`
- `npm --workspace @opsprobe/desktop run test:browser-ui`

## Packaged Validation

- `npm --workspace @opsprobe/desktop run validate:packaged-launch`
- `npm run desktop:validate-packaged-record`

This packaged launch smoke check expects a Linux AppImage to already exist at the release bundle path and requires `xvfb-run` on the local machine.
The packaged validation record summarizes whether the current version actually has matching bundle artifacts and matching evidence files.

If desktop packaging is flaky on the current machine, run `npm run env:prepare:fast` first so the Cargo cache and local `.opsprobe-vendor/` directory are refreshed before `npm run desktop:build`.
