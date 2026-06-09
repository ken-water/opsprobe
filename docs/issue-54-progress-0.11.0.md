# Issue 54 Progress: `0.11.0` Stable-Candidate Evidence

This document is intended to be copied into GitHub Issue `54` as a progress update or working comment.

## Current Status

`0.11.0` has moved past the earlier evidence-version mismatch problem.

The stable-candidate review now distinguishes between:

- evidence that is already aligned to `0.11.0`
- evidence that is still pending manual acceptance or Windows-specific validation
- evidence that should move to the next issue once the current Linux proof is complete

`0.11.0` should now be treated as the Linux-first stable-candidate evidence line.

That means:

- the remaining in-scope closure item is one real operator-driven Linux packaged acceptance pass
- Windows acceptance should stay explicit, but it should no longer keep `0.11.0` open once the Linux packaged note is captured and the defer is written honestly

## What Is Already Aligned To `0.11.0`

- Desktop stable-candidate validation now records `0.11.0` in `.opsprobe-validation/desktop-stable-candidate.json`
- Windows validation records now record `0.11.0`
- The stable review record and operator notes have been refreshed to describe current-version blockers instead of relying on stale `0.10.3` or `0.10.7` assumptions
- The repository is already on the correct post-`0.10.8` development line for Issue `54`
- Linux desktop packaging now succeeds for `0.11.0` through a vendor-first Cargo flow
- Current-version `.deb`, `.rpm`, `.AppImage`, and `AppDir` artifacts now exist for `0.11.0`
- Packaged bundle validation, packaged preflight, packaged launch smoke, and operator walkthrough now all record `0.11.0`

## What Passed

- clean-user-profile validation
- desktop typecheck
- frontend production build
- Tauri `cargo check`
- current smoke validation for the active `0.11.0` development line
- offline Cargo cache hydration from the current lockfile
- vendor-first `npm run desktop:build`
- Linux packaged artifact validation for `.deb`, `.rpm`, `.AppImage`, and `AppDir`
- packaged AppImage smoke launch under `xvfb-run`

## Current Blockers

### 1. Linux current-version packaged evidence still needs real human acceptance

Current Linux package artifacts for `0.11.0` now build successfully on this machine, and the repository can prove the packaged surfaces exist and launch.

What changed:

- the desktop packaging entry point now routes through `scripts/run-desktop-tauri-build.sh`
- the wrapper now prefers a local `.opsprobe-vendor/` directory when present
- a new `scripts/prepare-desktop-build-env.sh` script hydrates the Cargo cache and generates vendored sources from the current lockfile
- `npm run desktop:build` now completes for `0.11.0` and produces `.deb`, `.rpm`, and `.AppImage` artifacts

What still remains:

- packaged evidence is still repository-driven and headless for Linux
- a real operator-driven packaged acceptance pass should still be captured before treating this as final stable evidence
- the repo now includes a dedicated acceptance note so that pass can be captured in one version-specific record instead of scattered comments

Meaning:

- this is no longer a network-blocked Linux packaging problem for Issue `54`
- the remaining Linux gap is human acceptance depth, not artifact generation

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
- that Windows acceptance work should be deferred explicitly instead of silently stretching `0.11.0`

## What Changed In The Repo

- refreshed [stable-candidate-operator-notes-0.11.0.md](./stable-candidate-operator-notes-0.11.0.md)
- refreshed [stable-review-record.md](./stable-review-record.md)
- added [issue-54-linux-packaged-acceptance-0.11.0.md](./issue-54-linux-packaged-acceptance-0.11.0.md) so the remaining human Linux acceptance pass can be recorded in a structured `0.11.0` note
- added [prepare-desktop-build-env.sh](../scripts/prepare-desktop-build-env.sh) to hydrate and vendor desktop Rust dependencies from the current lockfile
- updated [run-desktop-tauri-build.sh](../scripts/run-desktop-tauri-build.sh) so `desktop:build` prefers vendored sources and still honors `OPSPROBE_CARGO_REGISTRY_OVERRIDE`
- updated root [package.json](../package.json) so `npm run desktop:build` uses the mirror-aware wrapper
- ignored `.opsprobe-vendor/` in the root [gitignore](../.gitignore) so local vendor preparation does not dirty future release work

## Recommended Next Steps

1. Capture one real operator-driven packaged Linux acceptance pass against the current `0.11.0` AppImage or `.deb`.
   - record it in [issue-54-linux-packaged-acceptance-0.11.0.md](./issue-54-linux-packaged-acceptance-0.11.0.md)
2. Once that Linux note exists, close `0.11.0` with an explicit statement that Windows installer acceptance is deferred.
3. Keep the current Windows validation records as honest blocker evidence, not as a hidden requirement to keep `0.11.0` open.
4. Resume Windows installer acceptance only after `0.11.0` is released and the repo intentionally moves to the next minor line.

## Copy-Paste Summary For Issue 54

Current `0.11.0` stable-candidate work is no longer blocked by stale version evidence or Linux packaging-network failures. Desktop stable-candidate records, packaged validation records, packaged preflight, packaged launch smoke, and operator walkthrough now all align to `0.11.0`, and Linux packaging succeeds through the new vendor-first desktop build flow.

The current machine now produces `0.11.0` `.deb`, `.rpm`, and `.AppImage` artifacts, and the packaged AppImage smoke launch passes under `xvfb-run`. The remaining in-scope `0.11.0` gap is no longer Linux artifact generation; it is one real operator-driven Linux packaged acceptance pass. Windows still needs either a current NSIS installer build path or a Windows-capable environment for direct validation, but that work should be deferred explicitly instead of silently extending `0.11.0`.

Next step: capture packaged Linux operator acceptance, close `0.11.0` with an honest Windows defer note, and only then decide whether a later minor should take ownership of Windows installer acceptance.
