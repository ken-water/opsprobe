# Issue 54 Runbook: Refresh `0.11.0` Linux Packaged Evidence

Use this runbook on a Linux machine that needs to refresh current-version packaged evidence with the vendor-first build flow.

Goal:

- generate current-version `0.11.0` Linux desktop bundle artifacts
- refresh packaged validation records so Issue `54` no longer depends on `0.10.7` packaged evidence

## Preconditions

- repository is on the `0.11.0` development line
- `node`, `npm`, Rust, Tauri system dependencies, `xvfb-run`, `dpkg`, and `rpm` are installed
- the machine can either reach the configured Cargo mirror or already have enough local Cargo cache to vendor from the current lockfile
- current working tree is clean

## 0. Preload Cargo Cache If Needed

If Cargo mirror access is unstable, first hydrate the local Cargo cache from the lockfile:

```bash
./scripts/hydrate-cargo-cache.sh
```

Then prepare vendored sources for the desktop build:

```bash
./scripts/prepare-desktop-build-env.sh
```

Optional offline sanity check after hydration:

```bash
tmp="$(mktemp -d)"
cat >"${tmp}/config.toml" <<'EOF'
[source.crates-io]
replace-with = "opsprobe-mirror"

[source.opsprobe-mirror]
registry = "sparse+https://rsproxy.cn/index/"
EOF

CARGO_HOME="$HOME/.cargo" cargo metadata \
  --format-version 1 \
  --manifest-path apps/desktop/src-tauri/Cargo.toml \
  --locked \
  --offline \
  --config "${tmp}/config.toml"

rm -rf "${tmp}"
```

Expect:

- the hydration script completes without failed downloads
- `.opsprobe-vendor/` is created locally
- the offline metadata command succeeds, proving local dependency resolution is ready before `tauri build`

## 1. Confirm Version And Working Tree

Run:

```bash
git status --short
node --input-type=module -e 'import fs from "node:fs"; console.log(JSON.parse(fs.readFileSync("package.json","utf8")).version)'
```

Expect:

- working tree is clean
- printed version is `0.11.0`

## 2. Build Current-Version Linux Bundles

Run:

```bash
npm run desktop:build
```

Expect:

- `tauri build` completes successfully
- current-version bundle artifacts exist under `apps/desktop/src-tauri/target/release/bundle/`
- if `.opsprobe-vendor/` exists, the build prefers vendored sources instead of live registry access

Quick verification:

```bash
find apps/desktop/src-tauri/target/release/bundle -maxdepth 3 \
  \( -name 'OpsProbe_0.11.0_amd64.deb' -o \
     -name 'OpsProbe-0.11.0-1.x86_64.rpm' -o \
     -name 'OpsProbe_0.11.0_amd64.AppImage' -o \
     -name 'OpsProbe.AppDir' \) | sort
```

## 3. Refresh Bundle Candidate Evidence

Run:

```bash
./scripts/validate-desktop-bundle-candidate.sh
```

Expect:

- `.opsprobe-validation/desktop-bundle-candidate.json` is recreated
- recorded version is `0.11.0`

## 4. Refresh Packaged Acceptance Preflight

Run:

```bash
./scripts/validate-desktop-packaged-acceptance-preflight.sh
```

Expect:

- `.opsprobe-validation/desktop-packaged-acceptance-preflight.json` is recreated
- recorded version is `0.11.0`
- readiness reflects the real machine state for GUI launch

## 5. Refresh Packaged Launch Smoke

Run:

```bash
./scripts/validate-desktop-packaged-launch-smoke.sh
```

Expect:

- `.opsprobe-validation/desktop-packaged-launch-smoke.json` is recreated
- recorded version is `0.11.0`
- AppImage stays alive for the smoke window

## 6. Refresh Aggregated Packaged Record

Run:

```bash
npm run desktop:validate-packaged-record
```

Expect:

- `.opsprobe-validation/desktop-packaged-validation-record.json` is recreated
- `currentVersion` is `0.11.0`
- blockers no longer reference missing `0.11.0` Linux artifacts

## 7. Sanity-Check All Refreshed Evidence

Run:

```bash
cat .opsprobe-validation/desktop-bundle-candidate.json
cat .opsprobe-validation/desktop-packaged-acceptance-preflight.json
cat .opsprobe-validation/desktop-packaged-launch-smoke.json
cat .opsprobe-validation/desktop-packaged-validation-record.json
```

Confirm:

- each file records `0.11.0`
- Linux artifact paths now point to `0.11.0`
- remaining blockers, if any, are about acceptance scope rather than missing current-version bundles

## 8. Optional Windows Follow-Up On The Same Machine

If the current machine can also build the Windows target, run:

```bash
npm run desktop:validate-windows-record
npm run desktop:validate-windows-wine-record
```

Use this only to refresh the record.
Real Windows installer acceptance still belongs on a Windows-capable environment.

## 9. Update Issue 54

After the refreshed evidence exists, update Issue `54` with:

- whether vendor-first `desktop:build` succeeded
- whether current-version Linux packaged evidence is now aligned to `0.11.0`
- whether packaged launch smoke passed
- whether Windows evidence still needs to move to Issue `55`

## Failure Note

If step 2 still fails, capture:

- the exact command used
- the exact mirror URL
- the first Cargo or Tauri error block
- whether the failure is network, dependency, signing, or packaging-tool related

Do not continue to the later packaged validation steps if current-version bundle artifacts were not produced.
