# Issue 57 Progress For `0.12.5`

This note turns the current packaging blocker into a concrete offline recovery workflow.

## Current Intent

`0.12.5` is an offline vendoring recovery checkpoint.

Its purpose is to:

- avoid repeated dead-end retries against crate download paths that are already known to fail on this machine
- add a supported path for injecting missing `.crate` payloads from another machine
- keep the next packaging attempt focused on refreshing `.opsprobe-vendor`, not rediscovering the same blocker again

## Changes

- `scripts/hydrate-cargo-cache.sh` now supports `OPSPROBE_PRELOADED_CRATE_DIRS`
- matching `.crate` files from those directories are copied into the local Cargo cache before online download is attempted
- the Linux packaged-evidence runbook now documents how to preload a missing crate such as `linux-raw-sys-0.12.2.crate`
- environment-preparation help text now exposes the same offline recovery path

## Why This Matters

The active blocker is still the missing vendored `linux-raw-sys 0.12.2` input, but the repository now has a deterministic recovery path:

1. obtain `linux-raw-sys-0.12.2.crate` from another machine or working network path
2. place it in a local preload directory
3. run `OPSPROBE_PRELOADED_CRATE_DIRS=... ./scripts/hydrate-cargo-cache.sh`
4. rerun `npm run env:prepare:fast` or `./scripts/prepare-desktop-build-env.sh`
5. retry Linux and Windows packaged validation on the refreshed vendor set

## Remaining Limit

`0.12.5` does not itself produce the missing packaged artifacts because this machine still does not have the required crate payload yet.

## Best Next Path

Copy `linux-raw-sys-0.12.2.crate` into a local preload directory, refresh `.opsprobe-vendor`, and then re-run current-version Linux and Windows packaging evidence.
