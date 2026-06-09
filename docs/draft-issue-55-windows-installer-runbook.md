# Draft: Issue 55 Runbook For Future `0.11.1` Windows Installer Acceptance Evidence

Use this draft runbook later on a Windows-capable environment when `0.11.1` actually begins.

Goal:

- prove whether the current Windows installer can actually be built, launched, installed, opened, used for a first useful inspection flow, and removed credibly enough to reduce `1.0.0` uncertainty
- keep Windows artifact existence separate from real Windows acceptance

## Preconditions

- repository is on the `0.11.1` development line
- working tree is clean
- the previous `0.11.0` evidence line has already been pushed
- a Windows-capable environment is available:
  - preferred: real Windows desktop session
  - fallback: a trustworthy Windows-capable validation environment with enough GUI fidelity to record installer behavior honestly

Before acceptance work begins, run:

```bash
npm run env:check:strict
```

If the current machine is also used to refresh Linux packaged evidence, run:

```bash
./scripts/validate-desktop-bundle-candidate.sh
./scripts/validate-desktop-packaged-acceptance-preflight.sh
./scripts/validate-desktop-packaged-launch-smoke.sh
```

## 1. Confirm Version And Working Tree

Run:

```bash
git status --short
node --input-type=module -e 'import fs from "node:fs"; console.log(JSON.parse(fs.readFileSync("package.json","utf8")).version)'
```

Expect:

- working tree is clean
- printed version is `0.11.1`

## 2. Build The Current Windows Installer

Preferred command on Windows:

```bash
npm --workspace @opsprobe/desktop run tauri build -- --target x86_64-pc-windows-msvc
```

Fallback if the environment intentionally uses GNU cross-build:

```bash
npm --workspace @opsprobe/desktop run tauri build -- --target x86_64-pc-windows-gnu
```

Expect:

- current-version desktop binary exists
- current-version NSIS installer exists

## 3. Refresh Structured Windows Evidence

Run:

```bash
npm run desktop:validate-windows-record
npm run desktop:validate-windows-wine-record
```

Expect:

- `.opsprobe-validation/desktop-windows-validation-record.json` is recreated
- `.opsprobe-validation/desktop-windows-wine-validation-record.json` is recreated
- recorded version is `0.11.1`
- if Wine is not present, that limitation is recorded honestly instead of implied away

## 4. Run Real Installer Acceptance

Complete:

- [Draft Issue 55 Windows Installer Acceptance 0.11.1](./draft-issue-55-windows-installer-acceptance-0.11.1.md)

Minimum real acceptance scope:

- installer launch
- install completion or exact failure point
- first app launch
- blank-window check
- runtime readiness understanding
- one asset and inspection attempt
- HTML/PDF export check if the workflow reaches that point
- close and reopen behavior
- uninstall behavior or a documented reason why uninstall could not be checked in the same pass

## 5. Update Issue 55

After the acceptance pass exists, update Issue `55` with:

- whether the current-version NSIS installer was produced
- whether the installer launched and completed successfully
- whether the app opened without a blank window
- whether first-run runtime repair was understandable
- whether the first useful inspection flow was credible
- whether uninstall or upgrade trust still has unresolved gaps
- whether anything should still remain blocked for `0.11.2`

## Failure Note

If the Windows build or install fails, capture:

- the exact command used
- the exact target triple
- the first meaningful error block
- whether the failure is toolchain, signing, NSIS packaging, app launch, runtime bootstrap, or desktop UX related

Do not collapse those categories into one generic "Windows failed" note.
