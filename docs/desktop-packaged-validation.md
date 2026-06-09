# Desktop Packaged Validation

Use this workflow when you need a current-version record proving whether the desktop bundle artifacts and packaged launch evidence actually exist.

## Commands

- `npm run desktop:validate-packaged-record`
- `npm --workspace @opsprobe/desktop run validate:packaged-launch`

## Evidence Output

The aggregated record is written to:

- `.opsprobe-validation/desktop-packaged-validation-record.json`
- `.opsprobe-validation/desktop-packaged-validation-record.md`

This record is meant to answer one question quickly: does the current app version have matching packaged artifacts and matching packaged validation evidence, or are we still looking at older bundle output.
