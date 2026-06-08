# Desktop Stable Candidate Validation

This guide captures the near-packaged desktop evidence still needed by `0.11.0` / Issue `54`.

It does not claim a fully packaged installer walk-through yet. Its narrower goal is to prove that the desktop build, frontend bundle, and Tauri shell still form a coherent release candidate on the current machine.

## Goal

Confirm that the current desktop candidate can:

1. pass desktop type safety checks
2. build the frontend bundle successfully
3. pass Tauri `cargo check`
4. leave behind concrete desktop validation artifacts that can be reviewed later

## Validation Command

Run:

```bash
./scripts/validate-desktop-stable-candidate.sh
```

## Expected Result

- `npm run desktop:typecheck` passes
- `npm --workspace @opsprobe/desktop run build` passes
- `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml --config 'source.crates-io.registry="sparse+https://index.crates.io/"'` passes
- `apps/desktop/dist/index.html` exists after the build
- `.opsprobe-validation/desktop-stable-candidate.json` is created with:
  - validated timestamp
  - aligned desktop version values
  - frontend dist artifact metadata
  - Tauri product and bundle metadata

## What This Does Not Prove Yet

- a real installer or packaged bundle can be installed on a clean machine
- the desktop UI was exercised end to end by a human operator
- first-run and restart behavior were proven from the packaged desktop shell instead of the repository workflow

Those gaps should remain explicit in `0.11.0` operator notes until a stronger packaged validation path exists.

## Related References

- [Clean User Profile Validation](./clean-user-profile-validation.md)
- [Stable Candidate Operator Notes](./stable-candidate-operator-notes-0.11.0.md)
- [Stable Release Readiness](./stable-readiness.md)
