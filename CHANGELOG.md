# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and the project follows semantic versioning with a product-oriented release policy documented in [docs/versioning.md](./docs/versioning.md).

## [0.11.0] - Unreleased

### Planned

- consolidate clean-machine and stable-candidate evidence before resuming the `1.0.0` decision
- turn the current stable-review record into a version-aligned, reviewable checkpoint for Issue `54`

## [0.10.8] - 2026-06-09

### Added

- a structured Windows installer validation record for the desktop release line
- a structured Wine validation record that explicitly reports when Windows launch validation was not attempted on the current Linux machine
- release guidance that now distinguishes unreleased development versions from published GitHub releases

### Changed

- repaired the published `0.10.x` release chain by restoring the missing `v0.10.6` tag and GitHub release
- clarified release and development gates so version history must stay contiguous and backfilled releases must not leave the wrong GitHub `Latest` marker behind
- tightened the next-step roadmap so `0.11.x` stays focused on stable-candidate evidence instead of continuing unbounded desktop-surface churn

### Known Limits

- Windows validation now exists as structured evidence, but real Windows installer acceptance is still deferred beyond `0.10.8`
- `0.10.8` is a release-discipline and validation-record patch, not the stable-candidate decision line

## [0.10.7] - 2026-06-09

### Changed

- reworked the desktop start page into a clearer install-first launch surface with explicit next-step guidance, denser navigation, and fewer duplicated explanations
- tightened the inspection path into a more linear target -> SSH -> preview -> result flow so first-run operators can reach a real inspection faster
- refocused the report-strategy workspace so it shapes export audience and remediation framing instead of repeating the current-result view

### Added

- packaged desktop validation records that summarize whether the current version has matching `deb`, `rpm`, `AppImage`, preflight, launch-smoke, and walkthrough evidence
- current-version packaged bundle evidence for `0.10.7`, including Linux `deb`, `rpm`, and `AppImage` outputs plus refreshed preflight and launch-smoke validation
- updated packaged-walkthrough validation so desktop release evidence stays aligned with the current UI copy and operator path

### Known Limits

- Windows installer validation is still not captured for `0.10.7`, so packaged evidence is currently Linux-first
- desktop packaged validation is now recorded, but GitHub Release publication and the post-release version bump still need to be completed

## [0.10.6] - 2026-06-09

### Changed

- simplified the desktop operator flow into clearer `Start`, `Inspect`, `Reports`, and `System` workspaces
- reduced duplicate setup and reporting sections so users reach the real action surfaces faster
- tightened card, button, table, and page density to make the desktop console feel less loose and more intentional
- reordered the results workspace so the current conclusion and export actions appear before history and comparison

### Added

- browser-level Playwright coverage for the main desktop operator path, including start, inspect, reports, and system transitions
- stronger desktop UI regression coverage for focused inspection sections and the reordered results workflow

### Known Limits

- packaged install and first-launch credibility still need another round of explicit start-page feedback and packaged validation evidence
- Windows installer and first-launch behavior still need a tighter operator-facing validation pass before broader release claims

## [0.10.5] - 2026-06-09

### Added

- A version-state gate that fails when new development continues on top of an already published release version
- A draft release-notes entry for `0.10.5` so current work has a visible version target before tagging

### Changed

- Desktop navigation now uses the shorter `Home`, `Inspect`, `Results`, and `System` labels
- The inspection workspace is clearer about the operator path: target first, then preview, then automation
- Repository version files now point to `0.10.5` so current work is traceable without relying on commit hashes

### Known Limits

- `0.10.5` simplifies the main operator path, but the `Inspect` page still needs another round of hierarchy and density tightening
- Additional packaged desktop validation may still be needed before the broader `1.0.0` stability decision resumes

## [0.10.4] - 2026-06-08

### Added

- A `System Settings` readiness summary that tells operators whether the desktop is ready for the first real inspection
- Grouped repair packs for managed runtime, report exports, local SSH tooling, and recurring-inspection prerequisites
- Browser UI assertions covering the new first-run readiness and repair surfaces

### Changed

- First-run setup guidance now explains why each repair theme matters and which action should happen next instead of only listing raw checks
- System Settings now includes explicit refresh and workspace shortcuts from the readiness workflow
- Release metadata is aligned to `0.10.4` across desktop packaging and repository version files

### Known Limits

- The desktop can now explain environment repair more clearly, but operators still perform package installation, PATH repair, and local permission fixes outside the app
- Runtime lifecycle control is still process-based and best-effort rather than backed by a hardened service supervisor on each platform
- `0.10.4` focuses on first-run readiness clarity; clean-machine install evidence and the broader stable-candidate decision remain deferred

## [0.10.3] - 2026-06-08

### Added

- Structured `recoveryActions` in local-service status output so operators and the desktop UI can see the next repair step instead of only raw health checks
- A dedicated local-service `restart` flow plus functional and smoke coverage for stopped-state recovery and restart preparation
- Machine-move provenance in exported config packages, including source machine name and OpsProbe root path, plus import feedback that reports rebind count, disabled schedules, and recommended next steps

### Changed

- Desktop local-service guidance now surfaces restart and recovery actions directly in the runtime panel
- Machine-migration guidance now tells operators which imported assets still need credential rebind and which schedules remain disabled until SSH verification succeeds
- Storage and testing docs now treat runtime recovery guidance and machine-move provenance as explicit pre-stable evidence for `0.10.3`

### Known Limits

- Runtime supervision is still process-based and best-effort rather than backed by a hardened service manager on each platform
- Restart guidance and machine-move provenance are clearer now, but operators still drive the actual restart, credential rebind, and SSH verification flow manually
- `0.10.3` focuses on making local runtime and machine replacement behavior more trustworthy; a final stable decision still depends on whether these remaining limits are acceptable for `1.0.0`

## [0.10.2] - 2026-06-08

### Added

- Automatic quarantine and rebuild coverage for malformed local storage snapshots so file-backed state can recover without manual JSON repair
- Recovery coverage for malformed persisted service-status snapshots, stale PID fallback, and legacy export packages that do not yet include desktop settings
- Expanded release smoke evidence for malformed storage recovery, malformed status fallback, stale PID cleanup, and post-recovery asset save continuity

### Changed

- Local file storage now renames malformed snapshots into timestamped `.corrupt-*` files before rebuilding a clean state file
- Local service status now distrusts stale PID files and falls back to persisted status recovery when the referenced process is gone
- Recovery and stable-readiness documentation now treat corrupted-state repair and upgrade continuity as explicit pre-stable evidence for the `0.10.x` line

### Known Limits

- Runtime supervision is still process-based and best-effort rather than backed by a hardened service manager on each platform
- Recovery now handles several corrupted local-state paths automatically, but operators still need to inspect quarantined `.corrupt-*` files manually if they want to preserve broken payload details
- `0.10.2` focuses on recovery and upgrade continuity evidence; deeper runtime supervision and machine-move trust hardening remain planned for later `0.10.x` releases
## [0.10.1] - 2026-06-07

### Added

- A distinct `verification-required` credential state between imported `rebind-required` assets and fully usable `linked` assets
- Schedule-level guardrails that block enable or resume operations until the latest saved asset has passed credential verification
- Regression coverage for imported schedules being forced into a disabled state until rebound credentials are verified

### Changed

- Desktop credential edits now keep assets in a verification-pending state until a successful SSH test proves the rebound key path or password works
- Successful SSH tests now persist the verified asset back into local storage so later schedule actions can trust the saved credential state
- Imported schedules are now automatically disabled with an explicit verification message instead of silently resuming on unverified credentials

### Known Limits

- Credential verification is now enforced before recurring schedules resume, but the operator still has to drive the rebind and SSH test flow manually in the desktop UI
- Local runtime supervision is still process-based and best-effort rather than a hardened service-manager integration across platforms
- `0.10.1` focuses on credential-resume safety; broader crash recovery, first-run repair, and upgrade continuity hardening remain planned for later `0.10.x` releases

## [0.10.0] - 2026-06-07

### Added

- A shared local state repository in the storage layer so schedules and desktop settings can live in the same active storage boundary as assets, templates, and inspection runs
- Automatic migration from legacy `desktop-settings.json` and `inspection-schedules.json` files into the active state store
- Storage-layout documentation covering backup scope, machine replacement, and the difference between active runtime state and exported reports
- Unit coverage for unified settings and schedule persistence plus migration from legacy file-backed state

### Changed

- Local config export and import now include desktop settings while still masking and rebinding credential-backed assets
- PostgreSQL activation now migrates unified state alongside file-backed inspection history instead of leaving schedules and settings behind
- Desktop and repository release copy now reflect the pre-stable storage-boundary hardening `0.10.0` checkpoint

### Known Limits

- Credential rebind after migration is still explicit, but OpsProbe does not yet verify rebound credentials before recurring schedules resume
- Local runtime supervision is still process-based and best-effort rather than a hardened service-manager integration across platforms
- `0.10.0` improves the storage boundary first; broader crash recovery, first-run repair, and upgrade continuity hardening remain planned for later `0.10.x` releases

## [0.9.4] - 2026-06-07

### Added

- Local config migration regression coverage for credential masking, built-in template fallback, and schedule import behavior
- A release-readiness gate that checks version alignment, release-note presence, desktop release copy, and smoke-validation evidence before publishing
- Stopped-state recovery coverage so local-service status can preserve an explicit stopped snapshot instead of falling back to an ambiguous starting state

### Changed

- Release smoke validation now exercises manager report export and config export/import rebind behavior in addition to the earlier local-service preview flow
- Desktop and repository release copy now reflect the install, migration, and regression-hardening `0.9.4` checkpoint in the `0.9.x` service-depth line
- The pre-`1.0.0` limits around mixed storage, credential rebind verification, desktop coverage, and runtime supervision are now documented explicitly

### Known Limits

- Assets, templates, and runs prefer PostgreSQL, but schedules and desktop settings are still file-backed instead of living in one transactional store
- Credential rebind after migration is explicit, but OpsProbe still does not verify rebound credentials before recurring schedules resume
- Local runtime supervision is still process-based and best-effort rather than a hardened service-manager integration across platforms

## [0.9.3] - 2026-06-07

### Added

- Correlated `priorityActions` in report view models that group related host and service findings into clearer remediation work items
- Queue-style report metadata including rank, urgency, rationale, and related-signal summaries across operator HTML, manager HTML, and manager PDF exports
- Automated multi-service correlation coverage for Nginx, MySQL, Redis, and Kubernetes report scenarios

### Changed

- Manager summaries now surface the lead queue item and immediate-vs-next-window priority counts instead of relying only on flat severity totals
- Desktop and repository release copy now reflect the correlated-reporting `0.9.3` checkpoint in the `0.9.x` service-depth line

### Known Limits

- Correlation rules are still built from check metadata and naming conventions; they do not yet use learned weighting or historical incident outcomes
- `0.9.3` focuses on report correlation only; install, upgrade, migration, and regression hardening remain planned for `0.9.4`

## [0.9.2] - 2026-06-07

### Added

- Deeper Nginx inspection workflow coverage for upstream hints, error-log risk, TLS posture, and recent config-drift hints
- Real SSH execution paths for Nginx process, config validation, virtual-host inventory, and the new Nginx operational checks
- CLI functional and smoke validation that directly exercises the Nginx edge preview template path

### Changed

- Desktop and repository release copy now reflect the Nginx-focused `0.9.2` checkpoint in the `0.9.x` service-depth line
- Nginx template coverage now goes beyond process and syntax validation into recurring edge, TLS, and config-review signals

### Known Limits

- Nginx checks remain host-side and config-file oriented; they do not yet probe live upstream health over HTTP or HTTPS
- `0.9.2` focuses on Nginx depth only; correlated reporting and release hardening remain planned for `0.9.3+`

## [0.9.1] - 2026-06-07

### Added

- Deeper Redis inspection workflow coverage for memory pressure, persistence risk, blocking risk, and eviction or rejection risk
- Real SSH execution paths for Redis process, listener, runtime, replication, and the new Redis operational checks
- CLI functional and smoke validation that directly exercises the Redis preview template path

### Changed

- Desktop and repository release copy now reflect the Redis-focused `0.9.1` checkpoint in the `0.9.x` service-depth line
- Redis template coverage now goes beyond process and port presence into recurring cache and persistence review signals

### Known Limits

- Redis checks remain host-side and `redis-cli` driven; they do not yet use a dedicated OpsProbe credential or alternate transport path
- `0.9.1` focuses on Redis depth only; Nginx and broader correlated reporting remain planned for `0.9.2+`

## [0.9.0] - 2026-06-07

### Added

- Deeper MySQL inspection workflow coverage for connection pressure, replication hints, slow-query posture, and temporary disk-table spill risk
- Real SSH execution paths for MySQL process, listener, runtime, schema inventory, and the new MySQL depth checks
- CLI functional and smoke validation that directly exercises the MySQL preview template path

### Changed

- Desktop and repository release copy now reflect the start of the `0.9.x` service-depth line
- MySQL template coverage now goes beyond process and port presence into recurring operational review signals

### Known Limits

- MySQL checks remain host-side and local-client driven; they do not yet use a dedicated OpsProbe credential or remote API path
- `0.9.0` focuses on MySQL depth only; Redis, Nginx, and broader correlated reporting remain planned for `0.9.1+`

## [0.8.3] - 2026-06-05

### Added

- Local-service CLI functional coverage for asset save, inspection preview, and HTML report export
- A dedicated smoke flow that validates the local-service asset-preview-report path before broader release checks

### Changed

- Release-candidate smoke validation now exercises a user-visible local workflow instead of build-only checks
- Testing strategy documentation now reflects the first automated functional slice in the `0.8.x` line

### Known Limits

- Desktop UI journeys still rely largely on manual verification and do not yet have browser or Tauri end-to-end automation
- The current functional slice covers preview and export confidence, but not live SSH execution against real hosts

## [0.8.2] - 2026-06-05

### Added

- Operator-facing `Action Queue` and cross-run `Recurring Actions` sections in report output
- `Evidence signal` and `Action focus` summaries to make repeated operational pain points easier to scan

### Changed

- Manager and operator report variants now surface clearer next actions and shorter evidence summaries
- Repository and desktop release copy now reflect the `0.8.2` report-usefulness checkpoint

### Known Limits

- Recurring action summaries currently group repeated findings within the included report runs and do not yet compute long-term trends across broader history exports
- Functional hardening and release-process coverage growth remain planned for `0.8.3`

## [0.8.1] - 2026-06-05

### Added

- Deeper Kubernetes node workflow coverage with node summary, static pod inventory, kubelet health, and node pressure signals
- Report-side `Action focus` lines for abnormal and priority items so operators and managers can scan next actions faster

### Changed

- Kubernetes remediation guidance now points more explicitly at kubelet status, journal failures, runtime endpoint drift, static control-plane containers, and pressure or eviction hints
- Desktop and repository release copy now reflect the `0.8.1` Kubernetes node exploration checkpoint

### Known Limits

- Kubernetes inspection remains SSH-first and node-side only; it still does not query the cluster API server or Kubernetes control plane directly
- Report-usefulness improvements beyond the Kubernetes workflow remain planned for `0.8.2`

## [0.8.0] - 2026-06-05

### Added

- Deeper Redis workflow coverage with runtime configuration and replication-role evidence
- Deeper Docker workflow coverage with runtime summary plus image and abnormal container inventory
- Explicit `0.8.x` release-line planning with `0.8.1`, `0.8.2`, and `0.8.3` checkpoints and aligned GitHub milestones

### Changed

- Docker host template now surfaces operator-facing runtime and abnormal-container evidence instead of only daemon presence
- Release workflow and version gate now support continuing the same exploration theme through `0.8.x` checkpoints
- Desktop and repository release copy now reflect the start of the `0.8.x` exploration line

### Known Limits

- Docker inspection still depends on local `docker` CLI access on the inspected host and does not yet query remote registries or swarm state
- Kubernetes node workflow depth, report-usefulness improvements, and functional hardening are deferred to `0.8.1+`

## [0.7.4] - 2026-06-05

### Added

- Validation-cycle summary panel in the desktop app to show what was addressed, what was deferred, and the next-stage decision
- Explicit `0.7.x` decision document describing fixed friction, deferred scope, and why `0.8.0` is next instead of `1.0.0`

### Changed

- Repository docs now point to the completed `0.7.x` validation-cycle checkpoint
- Desktop release copy now reflects the feedback-driven closure of the external-validation cycle

### Known Limits

- The decision checkpoint is documented, but it does not yet synthesize live feedback metrics automatically
- Several broader platform requests remain intentionally deferred until local inspection depth improves further

## [0.7.3] - 2026-06-05

### Added

- Structured GitHub issue templates for inspection needs, report feedback, and workflow friction
- Dedicated feedback guide with direct links and prompts for higher-signal early-user input
- Desktop feedback entry panel with direct routes into the structured GitHub forms

### Changed

- Repository entry points now direct early users toward actionable feedback instead of generic feature requests
- Desktop release copy now reflects the `0.7.3` external-validation focus on feedback capture

### Known Limits

- Feedback still routes through GitHub issues rather than an in-product submission backend
- The current workflow captures structured input, but does not yet aggregate or prioritize repeated themes automatically

## [0.7.2] - 2026-06-05

### Added

- Shared operator and manager report audiences for HTML and PDF export
- Desktop report-variant selector with persisted audience preference and in-product comparison guidance

### Changed

- HTML report rendering now supports a detailed operator layout and a condensed manager summary layout from the same inspection data
- PDF export now supports a concise manager-facing priority-actions view in addition to the existing detailed operator view
- Local HTML export flow now preserves the selected report audience across desktop and local-service boundaries

### Known Limits

- Report variants are currently single-run views; cross-run or multi-run comparison reports remain out of scope
- Manager summaries are intentionally concise and do not yet include trend or SLA-oriented rollups

## [0.7.1] - 2026-06-05

### Added

- Desktop troubleshooting guidance panel that turns failing runtime checks into concrete repair steps
- SSH repair guidance in the UI for common authentication, reachability, DNS, and password-helper failures

### Changed

- SSH connection failures and SSH-backed inspection command failures now return clearer, categorized explanations
- Local service, managed PostgreSQL, schedule, asset, and history actions now surface readable failure messages instead of silent command rejection
- Desktop release copy now reflects the `0.7.1` runtime-diagnostics milestone

### Known Limits

- Troubleshooting guidance is still rule-based and currently focuses on common local environment failures rather than every host-specific edge case
- Deeper automated log-tail or self-healing flows remain out of scope for the open source desktop edition

## [0.7.0] - 2026-06-04

### Added

- Guided first-run demo mode in the desktop app with realistic bundled sample inspection runs
- Explicit desktop onboarding mode persistence so users can choose demo exploration or direct real setup
- Clear sample-data labelling in history and report replay views to avoid mixing demo content with real local-service history

### Changed

- Desktop history and repeated-problem analysis now work against the visible onboarding context instead of assuming persisted history only
- Release-facing desktop copy now reflects the `0.7.0` external-validation focus instead of the earlier `0.6.0` milestone text

### Known Limits

- Demo runs are static examples and do not yet adapt to the currently selected template or asset beyond the guided starter flow
- Feedback capture from early users still depends on external channels and remains planned for `0.7.1+`

## [0.6.0] - 2026-06-04

### Added

- Built-in inspection template registry with Linux baseline, capacity, state, nginx, MySQL, Redis, Docker, and Kubernetes node templates
- Desktop template selection with local persistence and schedule-aware template execution
- Nginx process and configuration validation checks
- MySQL or MariaDB process and TCP listener checks
- Redis process and TCP listener checks
- Docker daemon, runtime info, and container inventory checks
- Kubelet process, kubelet secure port, and Kubernetes node runtime checks

### Changed

- HTML reports, PDF exports, and desktop history now show template metadata for each inspection run
- Repeated-problem review now reflects which templates produced the same recurring finding
- `0.6.0` version gate and release planning are now defined explicitly in the repository workflow

### Known Limits

- Service checks currently focus on process, listener, and basic runtime validation rather than deep application semantics
- Kubernetes inspection currently targets node-side signals only and does not query the control plane or cluster API
- Docker and Kubernetes checks assume compatible CLI tooling is available on the inspected host when runtime details are requested

## [0.5.0] - 2026-06-04

### Added

- Structured report result view model for reusable history and export rendering
- Local HTML report export through the local service
- Built-in PDF export for desktop report sharing without external browser dependencies
- Desktop local-state persistence for active asset, history filters, schedule interval, and export paths

### Changed

- Desktop startup no longer auto-runs inspection preview or service execution as a side effect
- Built-in Linux baseline template is now persisted into local storage for migration and export consistency
- Local settings persistence now restores the previous desktop editing context after restart

### Known Limits

- Service-aware inspection templates were not included yet and remained planned for `0.6.0`
- Middleware and container runtime checks were still out of scope at this point
- Release automation gates had not yet enforced previous minor-version release completion, which is now fixed after this backfill

## [0.4.0] - 2026-06-04

### Added

- Dedicated local service runtime boundary for the desktop edition
- Managed local PostgreSQL bootstrap, start, stop, and health inspection flow
- Service-owned inspection preview and execution flow
- Inspection history filtering, report replay, and repeated-problem summary
- Local recurring inspection schedules owned by the background service
- Portable local configuration export and import for machine migration
- First-run setup guidance with environment validation for `ssh`, `sshpass`, and report directory writability

### Changed

- Desktop workflow now routes long-running runtime concerns through the local service boundary
- Inspection persistence now prefers managed PostgreSQL and falls back to local file storage when needed
- Imported assets are now marked with `bindingStatus: rebind-required` instead of carrying local secret bindings across machines
- Development and release process now require a clean, pushed checkpoint gate before starting the next issue

### Known Limits

- Local HTML and PDF report export are not included yet and remain planned for `0.5.0`
- Asset persistence is available, but broader persistence polish remains open under `#12`

## [0.3.0] - 2026-06-04

### Added

- Dedicated local service package and desktop-visible runtime status flow
- Service-owned inspection preview and execution path
- Managed local PostgreSQL health inspection, bootstrap, start, and stop flow
- PostgreSQL-backed inspection run persistence with file-backed fallback
- File-to-PostgreSQL migration for previously persisted inspection runs

### Changed

- Desktop architecture now assumes a dedicated local service boundary for long-running runtime responsibilities
- Inspection execution can now be routed through the local service instead of living only inside the UI process
- Managed PostgreSQL runtime validation is now part of the local service operational workflow

### Known Limits

- Inspection history, scheduling, migration import/export, and first-run setup guidance were not included yet in `0.3.0`
- Local HTML and PDF report export remained out of scope for this release and were deferred further
- Asset persistence polish was still incomplete at this point and remained tracked separately

## [0.2.1] - 2026-06-03

### Added

- Password-based SSH connection testing through `sshpass`
- Password-based SSH execution support for Linux baseline checks

### Changed

- Desktop SSH credential input now switches to a password field when password authentication is selected
- SSH validation now reports missing `sshpass` explicitly when password mode is requested

## [0.2.0] - 2026-06-03

### Added

- Shared inspection domain models in `@opsprobe/core`
- Reusable Linux check contracts in `@opsprobe/checks`
- Runner adapter flow for normalized inspection execution
- Editable Linux host asset input in the desktop UI
- SSH connection testing through a Tauri backend command
- SSH-backed Linux baseline checks for CPU, memory, disk, load, time sync, sshd, port 22, reboot age, and log usage
- Development gate checks to enforce issue and milestone hygiene before new version work begins

### Changed

- Desktop preview now uses a unified asset model for both connection testing and inspection execution
- Architecture direction has been updated toward a managed PostgreSQL runtime for future local service work

## [0.1.1] - 2026-06-03

### Added

- Apache License 2.0 for the open source community edition
- GitHub funding metadata for project sponsorship
- Support links in the README and desktop foundation screen

## [0.1.0] - 2026-06-03

### Added

- Initial repository documentation for MVP, architecture, roadmap, releases, and versioning
- Root workspace setup for the desktop app and shared packages
- Tauri desktop application bootstrap for the open source edition
- Initial placeholder package layout for `core`, `runner`, `checks`, `report`, and `shared`
- Initial release planning and issue mapping for versions `0.1.0` through `0.5.0`
