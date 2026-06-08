# Stable Candidate Operator Notes

Use this template during `0.11.0` and later `1.0.0` review work.

The goal is to record the operator-facing reality of install, bootstrap, inspection, export, stop, restart, backup, and recovery instead of relying on memory after the validation run.

## Candidate Metadata

- Candidate version:
- Validation date:
- Validator:
- Machine or VM label:
- Operating system:
- PostgreSQL binaries available in `PATH`:
- Validation home/profile path:

## 1. Install And Bootstrap

### Local prerequisites seen by the operator

- Node / npm:
- Rust / cargo:
- Tauri dependencies:
- PostgreSQL binaries:

### First-run status result

- Command used:
- Was `~/.opsprobe` created automatically?
- Were missing prerequisites explained clearly?
- Did `recoveryActions` show the next step?

### Bootstrap notes

- Command used:
- Did bootstrap succeed?
- If bootstrap failed, was the reason clear enough for an operator?
- Did the status output explain fallback vs. managed PostgreSQL behavior honestly?

## 2. Primary Workflow

### Asset save

- Command or UI path:
- Was the save path clear?
- Any confusing fields or hidden assumptions?

### Inspection preview or run

- Command or UI path:
- Did the operator get a usable result?
- Were failures actionable?

### Report export

- Command or UI path:
- Was the output path clear?
- Did the operator understand where the report was written?

## 3. Stop / Restart / Recovery

### Stop flow

- Command or UI path:
- Was the result explicit about what stopped and what still needed checking?

### Restart flow

- Command or UI path:
- Did the product avoid implying that the background process was already running?
- Were the next steps clear?

### Recovery guidance

- Which `recoveryActions` appeared?
- Were they enough for an operator to continue without source-code inspection?

## 4. Backup And Machine Replacement

### Backup understanding

- Could the operator identify the right backup scope?
- Was the distinction between runtime state, reports, and migration packages clear?

### Migration package understanding

- Was the export package produced successfully?
- Was source-machine provenance visible?
- Was the post-import rebind and verification path obvious?

## 5. Accepted Limits Or Blockers

List anything that still blocks a credible stable release:

- Blocker 1:
- Blocker 2:

List any limit that might be acceptable for `1.0.0` if documented honestly:

- Accepted limit candidate 1:
- Accepted limit candidate 2:

## 6. Stable Decision Recommendation

Choose one:

- Continue another pre-stable issue
- Prepare `1.0.0` release candidate

Reasoning:

- 

## Related Evidence

- [Clean User Profile Validation](./clean-user-profile-validation.md)
- [Managed PostgreSQL Validation](./postgres-runtime-validation.md)
- [Stable Release Readiness](./stable-readiness.md)
