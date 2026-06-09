# Desktop Bundle Candidate Validation

This guide captures the first real packaged-artifact evidence for `0.11.0` / Issue `54`.

Its goal is narrower than full installer acceptance. It proves that the current repository can produce real Linux desktop bundle candidates and that the bundle structure still contains the operator-facing desktop assets required to launch credibly.

## Goal

Confirm that the current desktop candidate has produced:

1. a `.deb` bundle candidate
2. an `.rpm` bundle candidate
3. an AppImage staging directory with `AppRun` and a desktop entry
4. the expected desktop binary and icon structure inside those Linux bundle outputs

## Validation Command

Run:

```bash
./scripts/validate-desktop-bundle-candidate.sh
```

## Expected Result

- `.opsprobe-validation/desktop-bundle-candidate.json` is generated
- the artifact confirms:
  - `apps/desktop/src-tauri/target/release/bundle/deb/OpsProbe_<version>_amd64.deb`
  - `apps/desktop/src-tauri/target/release/bundle/rpm/OpsProbe-<version>-1.x86_64.rpm`
  - `apps/desktop/src-tauri/target/release/bundle/appimage/OpsProbe.AppDir`
  - `AppRun` is present inside the AppDir
  - `usr/share/applications/OpsProbe.desktop` is present inside the AppDir
  - the extracted `.deb` tree contains `usr/bin/opsprobe-desktop` and the desktop entry
  - the AppDir contains `usr/bin/opsprobe-desktop`, the desktop entry, and compiled GLib schemas

## What This Proves

- the current repository can produce real Linux desktop bundle candidates
- the current bundle outputs still contain the desktop shell structure an operator would depend on after installation
- `0.11.0` is no longer limited to desktop build-only evidence
- the remaining stable-candidate gap is now installation and human-operated acceptance, not whether packaging can run at all

## What This Still Does Not Prove

- the generated packages install cleanly on a fresh machine
- the packaged app launches and completes the first-run workflow outside the repository environment
- an operator completed the full start/bootstrap/inspection/export/recovery path from the packaged app

Those remaining gaps should stay explicit until a real installer or packaged acceptance pass is captured.

## Related References

- [Desktop Stable Candidate Validation](./desktop-stable-candidate-validation.md)
- [Desktop Operator Walk-Through](./desktop-operator-walkthrough.md)
- [Stable Candidate Operator Notes](./stable-candidate-operator-notes-0.11.0.md)
