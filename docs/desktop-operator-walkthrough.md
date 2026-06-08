# Desktop Operator Walk-Through

This guide captures the near-packaged desktop operator path still needed by `0.11.0` / Issue `54`.

The goal is not to pretend a real installer has already been validated. The narrower goal is to prove that the current desktop UI still exposes the operator actions needed for first-run repair, runtime bootstrap, inspection, export, and recovery.

## Goal

Confirm that the current desktop candidate still presents these operator-facing actions coherently:

1. refresh service status
2. start, stop, and restart the local service
3. bootstrap, start, and stop managed PostgreSQL
4. save the current asset
5. refresh service preview and run an inspection through the local service
6. export and import local config
7. export HTML and PDF reports from service-owned history

## Repository Walk-Through Gate

Run:

```bash
./scripts/validate-desktop-operator-walkthrough.sh
```

Expected result:

- the script passes without missing-label failures
- `.opsprobe-validation/desktop-operator-walkthrough.json` is generated
- the artifact records:
  - the desktop UI labels discovered in `apps/desktop/src/App.tsx`
  - the corresponding Tauri command handlers discovered in `apps/desktop/src-tauri/src/lib.rs`

## Manual Review Path

When a near-packaged desktop candidate is reviewed manually, walk through these areas in order:

1. Open the desktop and confirm the `Local Service Status` section is visible.
2. Confirm the service action row exposes:
   - `Refresh Service Status`
   - `Start Service`
   - `Stop Service`
   - `Restart Service`
   - `Bootstrap PostgreSQL`
   - `Start PostgreSQL`
   - `Stop PostgreSQL`
3. Confirm the `Machine Migration` section exposes:
   - `Save Current Asset`
   - `Export Local Config`
   - `Import Local Config`
4. Confirm the `Local Service Inspection Preview` section exposes `Refresh Service Preview`.
5. Confirm the `Local Service Inspection Run` section exposes `Run Through Local Service`.
6. If a run is present, confirm report export buttons exist for:
   - operator HTML/PDF
   - manager HTML/PDF after audience switch

## What This Still Does Not Prove

- the packaged installer launches successfully on a clean machine
- the desktop process starts its local service cleanly outside the repository workflow
- a human operator completed the full sequence through a packaged app window

Those gaps should remain explicit in `0.11.0` until a real packaged desktop acceptance pass is captured.

## Related References

- [Desktop Stable Candidate Validation](./desktop-stable-candidate-validation.md)
- [Clean User Profile Validation](./clean-user-profile-validation.md)
- [Stable Candidate Operator Notes](./stable-candidate-operator-notes-0.11.0.md)
