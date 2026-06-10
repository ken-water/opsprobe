# Issue 57 Progress For `0.12.1`

This note captures the first current-version evidence refresh inside the `0.12.x` line.

It does not close packaged acceptance. Its purpose is to prove that the active version now has current Linux packaging artifacts, packaged preflight evidence, launch-smoke evidence, and refreshed Windows artifact records.

## Current Intent

`0.12.1` is the first evidence-refresh checkpoint on the final pre-stable line.

Its purpose is to:

- rebuild Linux packaged artifacts for the active version
- refresh packaged preflight and launch-smoke evidence for the active version
- refresh current-version Windows artifact and Wine-blocker records
- leave a cleaner handoff for the later human acceptance pass

## Commands Executed

- `npm run env:check:strict`
- `npm run desktop:build`
- `./scripts/validate-desktop-packaged-acceptance-preflight.sh`
- `./scripts/validate-desktop-packaged-launch-smoke.sh`
- `npm run desktop:validate-windows-record`
- `npm run desktop:validate-windows-wine-record`

## Current Evidence Snapshot

### Linux packaged evidence

- `.deb`, `.rpm`, and `.AppImage` artifacts exist for `0.12.1`
- packaged preflight records the current version and says GUI launch can be attempted on this machine through `xvfb-run`
- packaged launch smoke records `0.12.1` and confirms the AppImage stayed alive for 10 seconds
- the current machine still lacks a real interactive desktop session, so human packaged acceptance remains open

### Windows evidence

- the `x86_64-pc-windows-gnu` desktop binary exists for `0.12.1`
- the NSIS installer is still missing for `0.12.1`
- Wine is still not installed on this machine
- Windows installer acceptance therefore remains blocked

## Result

`0.12.1` improves evidence freshness, not evidence completeness.

After this checkpoint:

- Linux packaged artifact and headless launch proof are current
- Windows artifact status is current
- the remaining blockers are narrower and easier to hand off:
  - real Linux packaged human acceptance
  - real Windows installer acceptance
