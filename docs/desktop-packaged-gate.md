# Desktop Packaged Gate

This gate combines the desktop packaging evidence required before tagging a release.

It is the single checkpoint that answers whether the current release line has enough packaged-artifact proof to proceed without hand-waving.

## Command

Run:

```bash
npm run desktop:validate-packaged-gate
```

## Required Evidence

- `.opsprobe-validation/desktop-packaged-validation-record.json`
- `.opsprobe-validation/desktop-bundle-candidate.json`
- `.opsprobe-validation/desktop-packaged-acceptance-preflight.json`
- `.opsprobe-validation/desktop-packaged-launch-smoke.json`
- `.opsprobe-validation/desktop-windows-validation-record.json`
- `.opsprobe-validation/desktop-windows-wine-validation-record.json`

## Gate Rule

The gate passes only when:

- all Linux packaged evidence files exist for the current repository version
- the Linux bundle candidate record is current
- the Linux packaged launch smoke record is current and reports `running`
- the Windows artifact record exists for the current repository version
- the Windows Wine record exists for the current repository version

For the current `0.11.x` line, Windows records are required as evidence, but they may still carry warnings if the installer is not yet broadly validated. That keeps release messaging honest while still preventing silent gaps in evidence collection.

## Output

- `.opsprobe-validation/desktop-packaged-gate.json`
- `.opsprobe-validation/desktop-packaged-gate.md`

## Related References

- [Releasing Guide](./releasing.md)
- [Desktop Bundle Candidate Validation](./desktop-bundle-candidate-validation.md)
- [Desktop Windows Validation](./desktop-windows-validation.md)
