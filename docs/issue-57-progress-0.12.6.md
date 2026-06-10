# Issue 57 Progress For `0.12.6`

This note closes the active packaged-build recovery loop with real current-version artifacts and validation records.

## Current Intent

`0.12.6` is the packaged-build recovery completion checkpoint.

Its purpose is to:

- convert the earlier vendoring diagnosis into successful current-version Linux and Windows package builds
- refresh packaged validation evidence so every required record points to the same release version
- remove the stale operator walkthrough mismatch that was still blocking the packaged validation record

## Changes

- repaired the vendored `linux-raw-sys 0.12.2` metadata mismatch so Cargo can use the current offline vendor set again
- updated the desktop build wrapper to export `APPIMAGE_EXTRACT_AND_RUN=1` when the cached Tauri `linuxdeploy` AppImage is used on Linux systems without `libfuse.so.2`
- rebuilt the Linux desktop bundles and confirmed current-version `deb`, `rpm`, `AppImage`, and `AppDir` outputs
- rebuilt the Windows GNU NSIS installer and refreshed current-version Windows validation records
- updated the operator walkthrough labels to the current desktop UI so the packaged validation record no longer points at stale `0.11.0` evidence

## Why This Matters

Before `0.12.6`, the repository had packaging recovery guidance but not a full current-version proof set.

After `0.12.6`:

1. Linux packaged artifacts exist for the current version
2. the Windows GNU installer exists for the current version
3. the packaged validation aggregate points only to `0.12.6` evidence
4. the release line can be published without carrying the old walkthrough mismatch forward

## Remaining Limit

`0.12.6` proves the Windows GNU installer path from the current Linux environment, but it does not replace a later native Windows install-and-run acceptance pass.

## Best Next Path

Publish `v0.12.6`, then move the repository to `0.12.7` and continue the final pre-stable hardening line with native Windows acceptance and remaining release-quality checks.
