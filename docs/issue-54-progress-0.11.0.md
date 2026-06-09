# Issue 54 Progress: `0.11.0` Stable-Candidate Evidence

This document is intended to be copied into GitHub Issue `54` as a progress update or working comment.

## Current Status

`0.11.0` has moved past the earlier evidence-version mismatch problem.

The stable-candidate review now distinguishes between:

- evidence that is already aligned to `0.11.0`
- evidence that is still blocked for environmental reasons
- evidence that must be completed on another machine or network before Issue `54` can be closed

## What Is Already Aligned To `0.11.0`

- Desktop stable-candidate validation now records `0.11.0` in `.opsprobe-validation/desktop-stable-candidate.json`
- Windows validation records now record `0.11.0`
- The stable review record and operator notes have been refreshed to describe current-version blockers instead of relying on stale `0.10.3` or `0.10.7` assumptions
- The repository is already on the correct post-`0.10.8` development line for Issue `54`

## What Passed

- clean-user-profile validation
- desktop typecheck
- frontend production build
- Tauri `cargo check`
- current smoke validation for the active `0.11.0` development line

## Current Blockers

### 1. Linux current-version packaged evidence is still incomplete

Current Linux package artifacts for `0.11.0` have not been rebuilt successfully yet.

What changed:

- the desktop packaging entry point now routes through `scripts/run-desktop-tauri-build.sh`
- the wrapper correctly redirects Cargo away from default `crates.io`
- the build now reaches the configured mirror instead of silently using the wrong registry path

What still fails:

- the current environment still hits SSL reset failures while downloading from `https://rsproxy.cn/index/config.json`

Meaning:

- this is no longer a version-discipline problem
- this is no longer a Tauri build-entry wiring problem
- the remaining blocker is network access from the current machine to the configured Cargo mirror

### 2. Windows current-version packaged evidence is still incomplete

Current `0.11.0` Windows validation records show:

- desktop Windows binary path exists or can be checked
- current-version NSIS installer is still missing
- Wine is not installed on the current Linux machine

Meaning:

- Windows validation is now honest for `0.11.0`
- Windows packaged acceptance still requires either:
  - a Linux machine that can generate the current NSIS installer successfully, or
  - a Windows-capable machine for direct installer validation

## What Changed In The Repo

- refreshed [stable-candidate-operator-notes-0.11.0.md](./stable-candidate-operator-notes-0.11.0.md)
- refreshed [stable-review-record.md](./stable-review-record.md)
- added [run-desktop-tauri-build.sh](../scripts/run-desktop-tauri-build.sh) so `desktop:build` can honor `OPSPROBE_CARGO_REGISTRY_OVERRIDE`
- updated root [package.json](../package.json) so `npm run desktop:build` uses the mirror-aware wrapper

## Recommended Next Steps

1. Re-run `npm run desktop:build` on a Linux machine or network that can successfully reach the configured Cargo mirror.
2. After current-version Linux bundle artifacts exist, refresh:
   - `./scripts/validate-desktop-bundle-candidate.sh`
   - `./scripts/validate-desktop-packaged-acceptance-preflight.sh`
   - `./scripts/validate-desktop-packaged-launch-smoke.sh`
   - `npm run desktop:validate-packaged-record`
3. Re-run Windows packaged validation after the current-version NSIS installer exists:
   - `npm run desktop:validate-windows-record`
   - `npm run desktop:validate-windows-wine-record`
4. Move the current Windows installer to a Windows-capable environment for real launch or install acceptance evidence.
5. Update Issue `54` with the refreshed packaged evidence and decide whether the remaining blockers belong in `0.11.0` or should be split into `0.11.1`.

## Copy-Paste Summary For Issue 54

Current `0.11.0` stable-candidate work is no longer blocked by stale version evidence. Desktop stable-candidate records and Windows validation records are now aligned to `0.11.0`, and the stable review docs now describe current-version blockers instead of older `0.10.x` assumptions.

The remaining blocker is packaged evidence. On Linux, the Tauri packaging path now correctly routes through the Cargo mirror wrapper, but the current machine still fails to download from `https://rsproxy.cn/index/config.json` due to SSL reset failures. On Windows, the current `0.11.0` NSIS installer is still missing and Wine is not installed on this Linux machine, so packaged acceptance evidence is still incomplete.

Next step: generate current-version Linux bundle artifacts on a network or machine that can reach the Cargo mirror, refresh packaged validation records, then continue Windows installer acceptance evidence on a Windows-capable environment.
