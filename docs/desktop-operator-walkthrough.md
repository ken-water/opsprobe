# Desktop Operator Walk-Through

This guide captures the near-packaged desktop operator path still needed by `0.11.0` / Issue `54`.

The goal is not to pretend a real installer has already been validated. The narrower goal is to prove that the current desktop UI still exposes the operator actions needed for first-run repair, runtime bootstrap, inspection, export, and recovery, and that the current desktop bundle artifacts exist for the same version under review.

## Goal

Confirm that the current desktop candidate still presents these operator-facing actions coherently:

1. expose the first-run repair surfaces in `System Settings`
2. refresh service status
3. start, stop, and restart the local service
4. bootstrap, start, and stop managed PostgreSQL
5. save the current asset
6. preview inspection results and run an inspection through the local service
7. export and import local config
8. expose HTML and PDF export follow-up actions from service-owned history
9. prove the current version already has near-packaged Linux bundle artifacts available for review

## Repository Walk-Through Gate

Run:

```bash
./scripts/validate-desktop-operator-walkthrough.sh
```

Expected result:

- the script passes without missing-label failures
- `.opsprobe-validation/desktop-operator-walkthrough.json` is generated
- the artifact records:
  - the current version
  - the expected `.deb`, `.rpm`, `.AppImage`, and AppDir bundle artifact presence for that same version
  - the desktop UI labels discovered in `apps/desktop/src/App.tsx`
  - the corresponding Tauri command handlers discovered in `apps/desktop/src-tauri/src/lib.rs`

## Manual Review Path

When a near-packaged desktop candidate is reviewed manually, walk through these areas in order:

1. Open `System Settings` and confirm these first-run surfaces are visible:
   - `Readiness Summary`
   - `Actionable Repair Packs`
   - `First-Run Wizard`
   - `Open Assets & Strategy`
   - `Refresh Environment`
2. Open the desktop service area and confirm the `Local Service Status` section is visible.
3. Confirm the service action row exposes:
   - `Refresh Service Status`
   - `Start Service`
   - `Stop Service`
   - `Restart Service`
   - `Bootstrap PostgreSQL`
   - `Start PostgreSQL`
   - `Stop PostgreSQL`
4. Confirm the `Machine Migration` section exposes:
   - `Save Current Asset`
   - `Export Local Config`
   - `Import Local Config`
5. Confirm the `Local Service Inspection Preview` section exposes `Preview Inspection Results`.
6. Confirm the `Local Service Inspection Run` section exposes `Run Through Local Service`.
7. If a run is present, confirm report export buttons exist for:
   - operator HTML/PDF
   - manager HTML/PDF after audience switch
8. Confirm export follow-up actions exist for:
   - `Open HTML File`
   - `Show HTML In Folder`
   - `Open PDF File`
   - `Show PDF In Folder`
9. Record the manual acceptance outcome in [desktop-packaged-acceptance-template.md](./desktop-packaged-acceptance-template.md) when a real near-packaged or packaged pass is performed
10. Before claiming packaged acceptance readiness, run `./scripts/validate-desktop-packaged-acceptance-preflight.sh` and confirm the environment can actually launch a GUI app

## What This Still Does Not Prove

- the packaged installer launches successfully on a clean machine
- the desktop process starts its local service cleanly outside the repository workflow
- a human operator completed the full sequence through a packaged app window

Those gaps should remain explicit in `0.11.0` until a real packaged desktop acceptance pass is captured.

## Related References

- [Desktop Stable Candidate Validation](./desktop-stable-candidate-validation.md)
- [Clean User Profile Validation](./clean-user-profile-validation.md)
- [Stable Candidate Operator Notes](./stable-candidate-operator-notes-0.11.0.md)
- [Desktop Packaged Acceptance Template](./desktop-packaged-acceptance-template.md)
