# Issue 57 Progress For `0.12.3`

This note narrows the Windows packaging-chain blocker further than `0.12.2`.

## Current Intent

`0.12.3` is a cache-and-vendoring diagnosis checkpoint.

Its purpose is to:

- determine whether the missing current-version NSIS installer is blocked by product logic or by the local Cargo cache state
- verify whether the current machine already contains the exact crate version required to refresh `.opsprobe-vendor`
- record the resulting handoff more precisely before continuing Windows acceptance work

## Commands Executed

- `find "$HOME/.cargo" -type f -name 'linux-raw-sys-0.12.2.crate'`
- `find .opsprobe-vendor -maxdepth 2 -type d -name 'linux-raw-sys*'`
- `cargo update --manifest-path apps/desktop/src-tauri/Cargo.toml -p linux-raw-sys --precise 0.12.1`
- `npm run env:prepare:fast`
- `./scripts/run-desktop-tauri-build.sh --target x86_64-pc-windows-gnu`

## Findings

### Local cache state is incomplete for the current lockfile

- the current machine has `linux-raw-sys-0.12.1.crate`
- the current machine does not have `linux-raw-sys-0.12.2.crate`
- `.opsprobe-vendor/linux-raw-sys/` is still aligned to `0.12.1`

### Online recovery path remains unreliable on this machine

- `npm run env:prepare:fast` still fails while trying to fetch `linux-raw-sys-0.12.2.crate`
- fallback attempts against both `rsproxy` and `crates.io` return `403` on this machine

### Direct lockfile manipulation is not a safe recovery path here

- trying to force Cargo toward `0.12.1` online does not give a controlled result
- Cargo attempts live index access and can drift the lockfile instead of safely repairing the current packaged-build state
- the accidental lockfile drift was not kept and should not be treated as a valid fix

## Refined Blocker Statement

The current `0.12.3` blocker is:

- this machine cannot regenerate the current-version vendored Cargo source because it lacks `linux-raw-sys-0.12.2.crate` locally and both configured download paths fail

That means the current Windows GNU packaging blocker is now narrower than before:

- not a generic NSIS problem
- not a vague Windows-support problem
- specifically a missing current-version crate cache plus failing download path on this machine

## Best Next Paths

1. hydrate `.opsprobe-vendor` from a machine or network path that can actually obtain `linux-raw-sys-0.12.2.crate`
2. or move directly to a Windows-capable machine and build the installer there
3. once the current-version vendored source is healthy, rerun the Windows GNU packaging attempt and re-check whether the NSIS installer is actually emitted
