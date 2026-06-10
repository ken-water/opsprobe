# Issue 57 Progress For `0.12.2`

This note captures the current Windows packaging blocker discovered while trying to advance the `0.12.x` line.

## Current Intent

`0.12.2` is a packaging-chain diagnosis checkpoint.

Its purpose is to:

- verify whether current-version Windows GNU packaging can produce a matching NSIS installer
- determine whether the remaining Windows blocker is product-side or environment-side
- record the exact build-chain failure before more work continues

## Commands Executed

- `npm run env:prepare:fast`
- `npm --workspace @opsprobe/desktop run tauri build -- --target x86_64-pc-windows-gnu`
- `./scripts/run-desktop-tauri-build.sh --target x86_64-pc-windows-gnu`

## Findings

### Windows GNU packaging still does not complete for `0.12.2`

- direct `tauri build --target x86_64-pc-windows-gnu` still attempts network access and fails when pulling `config.json` from `index.crates.io`
- the vendor-first wrapper avoids that network path, but the local vendored source is stale and does not contain `linux-raw-sys 0.12.2`

### Vendored source refresh is also blocked on this machine

- `scripts/hydrate-cargo-cache.sh` originally used a single mirror path
- the script was updated to try both `rsproxy` and `crates.io`
- even with fallback, the current machine still receives `403 Forbidden` for `linux-raw-sys-0.12.2.crate`

### Resulting current blocker

The active blocker is now explicit:

- Windows current-version NSIS installer cannot be regenerated on this machine because the Cargo dependency fetch path for vendoring is failing before packaging can complete

## Why This Matters

This narrows the problem substantially:

- the blocker is not "Windows support is vague"
- the blocker is not "NSIS is entirely broken"
- the blocker is specifically that the current machine cannot refresh the vendored Cargo dependency set needed to complete current-version Windows GNU packaging

## Next Useful Paths

1. use a machine or network path that can hydrate the missing crate into `.opsprobe-vendor`
2. or build on a real Windows-capable machine with the supported target and record installer acceptance there
3. or both, if we want Linux cross-build evidence plus real Windows installer evidence
