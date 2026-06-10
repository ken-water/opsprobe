# Issue 57 Progress For `0.12.4`

This note closes the next checkpoint in the final pre-stable hardening line.

## Current Intent

`0.12.4` is a packaged-build convergence checkpoint.

Its purpose is to:

- verify whether the current blocker only affects Windows packaging or also blocks the current Linux packaged build
- refresh current-version Windows validation records so release evidence stays aligned
- record the exact next handoff without pretending the current machine can finish packaged acceptance

## Commands Executed

- `find /home/ken -type f \( -name 'linux-raw-sys-0.12.2.crate' -o -name 'linux-raw-sys-0.12.2*' \) 2>/dev/null`
- `find /home/ken -type d -path '*/linux-raw-sys-0.12.2' 2>/dev/null`
- `npm run env:prepare:fast`
- `npm run desktop:validate-windows-record`
- `npm run desktop:validate-windows-wine-record`
- `npm run desktop:build`
- `npm run desktop:validate-packaged-gate`

## Findings

### The current machine still does not have the required crate payload

- no local filesystem hit was found for `linux-raw-sys-0.12.2.crate`
- no unpacked `linux-raw-sys-0.12.2` source directory was found on this machine
- `.opsprobe-vendor/linux-raw-sys/` is still aligned to `0.12.1`

### Online hydration still fails on this machine

- `npm run env:prepare:fast` still fails on `linux-raw-sys-0.12.2.crate`
- both configured download bases still return `403` for this crate on the current machine

### The blocker also affects the current Linux packaged build

- `npm run desktop:build` now fails before packaged artifact generation begins
- the failing resolver path is the vendored source replacement, not application logic
- Cargo reports that lockfile resolution requires `linux-raw-sys 0.12.2` while the vendored source only offers `0.12.1`

### Current Windows evidence is refreshed but still incomplete

- `.opsprobe-validation/desktop-windows-validation-record.*` now reflects `0.12.4`
- the Windows desktop binary remains present for `x86_64-pc-windows-gnu`
- the matching current-version NSIS installer is still missing

## Refined Blocker Statement

The current `0.12.4` blocker is:

- this machine cannot refresh the current-version vendored Cargo source to include `linux-raw-sys 0.12.2`, and that single missing vendored dependency now blocks both Linux packaged build generation and Windows installer generation for the current version

That means the active blocker is narrower and more actionable than a generic packaging failure:

- not a product workflow problem
- not a Tauri UI regression
- not a platform-specific NSIS-only issue
- specifically a stale vendored Cargo source plus an unavailable crate-download path on this machine

## Best Next Paths

1. refresh `.opsprobe-vendor` from a machine or network path that can actually obtain `linux-raw-sys-0.12.2.crate`
2. commit the refreshed vendored source as a current-version packaging input
3. rerun `npm run desktop:build`, packaged Linux validation, and Windows installer validation for the same version line
4. if that is not possible on this machine, move the packaging checkpoint to another machine that can hydrate the crate cache or vendor source
