# OpsProbe Desktop

OpsProbe Desktop is the local-first Tauri application for running infrastructure inspections, reviewing remediation, and managing the dedicated local runtime.

## Common Commands

- `npm --workspace @opsprobe/desktop run dev`
- `npm --workspace @opsprobe/desktop run build`
- `npm --workspace @opsprobe/desktop run typecheck`
- `npm --workspace @opsprobe/desktop run test:ui`
- `npm --workspace @opsprobe/desktop run test:browser-ui`

## Packaged Validation

- `npm --workspace @opsprobe/desktop run validate:packaged-launch`

This packaged launch smoke check expects a Linux AppImage to already exist at the release bundle path and requires `xvfb-run` on the local machine.
