# Release Plan

This document maps the initial open source roadmap to concrete release milestones.

## Release Themes

### `0.1.0` Foundation

Goal:

- Establish the repository, desktop shell, and reusable package structure

Includes:

- Initialize repository structure
- Bootstrap Tauri desktop app
- Define core domain models
- Add setup documentation baseline

Related issues:

- Issue 1
- Issue 2
- Issue 3
- Issue 15

Exit criteria:

- Project structure is stable enough for parallel development
- Desktop app launches locally
- Core models are defined

### `0.2.0` First Inspection Flow

Goal:

- Deliver the first end-to-end Linux SSH inspection run

Includes:

- Implement SSH connection test
- Build inspection runner skeleton
- Define check interface
- Implement host resource checks
- Implement host state checks

Related issues:

- Issue 4
- Issue 5
- Issue 6
- Issue 7
- Issue 8

Exit criteria:

- User can add a Linux host
- User can validate connectivity
- User can run a built-in host inspection template
- Results are normalized and readable

### `0.3.0` Local Service Foundation

Goal:

- Establish the dedicated local runtime boundary behind the desktop UI

Includes:

- Add local background service process for the desktop edition
- Move long-running scheduling and durable state ownership into that service
- Expose a stable local command boundary for the desktop UI

Related issues:

- Issue 20

Exit criteria:

- Desktop architecture assumes a dedicated local service
- Long-running tasks and persistence are owned by that service
- UI can query service status and interact through a defined boundary

### `0.4.0` Local Usability

Goal:

- Make the desktop workflow usable for repeated daily work

Includes:

- Add inspection history view
- Add local scheduling
- Support configuration export and import for machine migration
- Add first-run setup and environment validation

Related issues:

- Issue 13
- Issue 14
- Issue 18
- Issue 19

Exit criteria:

- Inspection history is browsable
- Recurring local inspection can be configured
- Local migration package can be imported safely on another machine
- Missing environment prerequisites are surfaced clearly during first run

### `0.5.0` Open Source MVP

Goal:

- Consolidate the first complete open source MVP release

Includes:

- Build result view model
- Implement local HTML report export
- Add PDF export path
- Finish broader local persistence polish
- Documentation cleanup
- Bug fixing and stability improvements
- UX polish across the desktop flow
- Review of built-in checks and report quality

Exit criteria:

- Core MVP flow is stable
- Documentation is sufficient for first outside users
- The repository is ready for wider open-source testing

### `0.6.0` Service-Aware Templates

Goal:

- Expand the Linux inspection MVP from a single baseline into multiple reusable built-in templates

Includes:

- Add built-in inspection template registry and desktop template selection
- Add Nginx, MySQL, and Redis baseline checks
- Add Docker and Kubernetes node baseline checks
- Show template metadata in history and reports

Exit criteria:

- Users can choose different built-in inspection templates for the same Linux host
- Template choice is persisted through desktop restart and scheduling
- Middleware and runtime templates have meaningful built-in checks
- History and report outputs make template choice visible

### `0.7.0` External Validation I: Guided First Run

Goal:

- Let outside users understand OpsProbe value within minutes, even before connecting a real host

Includes:

- Demo asset, demo run history, and demo report experience
- Guided landing state for first-time users
- Clear separation between sample data and real inspections

Exit criteria:

- A first-time user can understand the product workflow without setting up infrastructure first
- Demo content makes reports, history, and templates visible immediately

### `0.7.1` External Validation II: Runtime Diagnostics

Goal:

- Reduce user drop-off caused by environment and dependency problems

Includes:

- Better SSH troubleshooting detail
- Better local-service and PostgreSQL diagnostics
- Clear dependency checks and repair suggestions

Exit criteria:

- Users can understand why setup failed without reading source code
- Common local environment failures are surfaced clearly in the UI

### `0.7.2` External Validation III: Report Variants

Goal:

- Validate what different report audiences actually want to see

Includes:

- Operator-facing detailed report view
- Manager-facing summary report view
- Shared export path for both report styles

Exit criteria:

- Users can compare at least two report styles aimed at different audiences
- Feedback can be collected on which report structure is more useful

### `0.7.3` External Validation IV: Feedback Capture

Goal:

- Make it easy for early users to submit concrete workflow pain points and requests

Includes:

- Better issue templates for workflow problems and missing checks
- Clear feedback prompts in docs and repository entry points
- Structured request collection for report needs, inspection needs, and friction points

Exit criteria:

- Early users have a clear path to submit actionable feedback
- Feedback arrives in a format that can guide roadmap decisions

### `0.7.4` External Validation V: Feedback Closure

Goal:

- Convert the highest-signal early feedback into a stabilization checkpoint

Includes:

- Fixes for the most common first-user friction points
- UX polish driven by repeated external feedback
- Decision checkpoint for whether the next step is a `0.8.x` exploration line or `1.0.0` stabilization

Exit criteria:

- Repeated early-user pain points have been addressed or explicitly deferred
- The next release stage is chosen with evidence instead of assumptions

### `0.8.x` Exploration I: Deeper Inspection Workflows

Goal:

- Improve real-world inspection depth and local workflow fit after the external-validation cycle

Includes:

- deeper inspection coverage for common Linux service roles
- better template flexibility for recurring operations work
- local-first workflow polish based on the strongest validated needs from `0.7.x`
- test-foundation work for unit, integration, smoke, and functional coverage growth

Exit criteria:

- OpsProbe handles more realistic service-role inspection workflows without relying on ad hoc shell habits
- the next expansion step is based on actual usage fit rather than purely on feature breadth

Release approach:

- `0.8.0`, `0.8.1`, `0.8.2`, and later `0.8.x` patches may be used as bounded checkpoints inside this same exploration line
- each `0.8.x` release should close a concrete slice, such as one service-role workflow, one test-coverage step, or one local workflow improvement
- do not jump to `0.9.0` or `1.0.0` until the planned `0.8.x` exploration outcomes are actually complete

Planned checkpoints:

- `0.8.0`: Docker host operational workflow depth and current exploration baseline release
- `0.8.1`: Kubernetes node operational workflow depth
- `0.8.2`: report usefulness and remediation guidance improvements for recurring operators
- `0.8.3`: functional coverage growth and release hardening for the completed `0.8.x` line

Related issues:

- Issue 31
- Issue 32
- Issue 33
- Issue 34
- Issue 35
- Issue 36
- Issue 37
- Issue 38

### `0.9.x` Exploration II: Service Depth And Operator Trust

Goal:

- turn the validated local-first workflow into a more credible day-to-day inspection tool for SMB operators

Includes:

- deeper MySQL, Redis, and Nginx service-role inspection coverage
- stronger evidence-to-remediation mapping for common operational failures
- better report correlation across host and service findings
- more release hardening for install, upgrade, and migration confidence

Exit criteria:

- OpsProbe can inspect the most common SMB Linux service roles with more than process-level signals
- reports help operators prioritize repair work across host and service context
- installation and release validation are strong enough to support wider open-source adoption

Release approach:

- `0.9.0` through `0.9.4` should each close a bounded workflow slice while keeping the same local-first product direction
- every `0.9.x` release should be backed by issue, milestone, release notes, and validation evidence before the next one starts
- do not jump to `1.0.0` until the `0.9.x` line proves both operational usefulness and release discipline

Planned checkpoints:

- `0.9.0`: MySQL deep inspection workflow, including instance state, connection pressure, replication hints, and slow-query risk signals
- `0.9.1`: Redis deep inspection workflow, including persistence, replication, memory pressure, and blocking-risk signals
- `0.9.2`: Nginx deep inspection workflow, including upstream health hints, TLS posture, config drift, and log-oriented troubleshooting signals
- `0.9.3`: correlated reporting across host and service findings so operators get clearer priority actions instead of isolated check lists
- `0.9.4`: install, upgrade, migration, and regression hardening before deciding whether `1.0.0` is credible

Related issues:

- Issue 42
- Issue 43
- Issue 44
- Issue 45
- Issue 46

## `0.10.x` Exploration III: Pre-Stable Hardening

Goal:

- close the known credibility gaps that still block or weaken a defensible `1.0.0` decision

Includes:

- stronger runtime-state boundaries for schedules and desktop settings
- safer recurring-schedule behavior after credential rebind or migration
- more evidence for crash recovery, first-run repair, and upgrade continuity
- clearer local runtime supervision and machine-replacement expectations

Exit criteria:

- the storage boundary is either improved materially or documented clearly enough to defend for `1.0.0`
- recurring schedules do not silently trust rebound credentials without revalidation
- recovery-sensitive workflows have stronger validation evidence than the `0.9.4` baseline
- local runtime supervision and machine-move expectations are honest, documented, and reviewable in the stable decision

Release approach:

- `0.10.0` through `0.10.4` each close one bounded pre-stable credibility gap
- every `0.10.x` release must still ship concrete user-facing trust improvements, not only internal refactors
- do not resume the `1.0.0` decision until the `0.10.x` line is either complete or explicitly cut short with written justification

Planned checkpoints:

- `0.10.0`: runtime-state boundary hardening for schedules, settings, backup, and machine-move expectations
- `0.10.1`: rebound credential verification before recurring schedules resume
- `0.10.2`: recovery and upgrade continuity evidence for crash, first-run repair, and upgrade-sensitive flows
- `0.10.3`: local runtime supervision hardening and honest operator guidance for restart and machine replacement
- `0.10.4`: post-install readiness summary, grouped repair packs, and stronger desktop UI gates for first-run recovery clarity
- `0.10.5`: desktop workflow simplification, clearer operator entry points, and stricter development-version discipline after release
- `0.10.6`: follow-up polish for the simplified desktop flow, including denser action hierarchy, reduced secondary clutter, and stronger packaged-release validation if needed

Related issues:

- Issue 50
- Issue 51
- Issue 52
- Issue 53

Current release split after `0.10.4`:

- `0.10.5` scope
  - simplify desktop navigation to `Home`, `Inspect`, `Results`, and `System`
  - reduce inspection workflow sprawl into a clearer target, preview, and automation path
  - remove version ambiguity by separating the current development version from the latest published release tag
  - strengthen repository gates so new work cannot continue indefinitely under an already released version number
- `0.10.6` deferred scope
  - further compress the `Inspect` page so the primary inspection action dominates and secondary controls recede
  - continue UI consistency work across spacing, table density, visual hierarchy, and operator feedback timing
  - decide whether packaged desktop validation for the simplified flow needs another bounded patch release before resuming the `1.0.0` decision

Post-`0.10.7` / `0.10.8` priority clarification:

- do not keep expanding desktop surface area only because more polish is possible
- prioritize evidence that reduces `1.0.0` uncertainty faster than additional UI iteration
- treat Windows installer existence and Windows installer acceptance as separate checkpoints
- keep multilingual work out of the current pre-stable line unless it directly blocks user testing or release credibility

Recommended next issue order after the current `0.10.8` checkpoints:

- Windows installer acceptance evidence on a Windows-capable environment
- stable-candidate operator notes and clean-machine validation consolidation
- explicit stable-decision blocker review for `1.0.0`
- multilingual desktop foundation only after the stable-decision evidence line is no longer thin

## Stable Milestone

### `1.0.0`

Candidate conditions:

- Open source MVP is proven by real users
- Core desktop workflow is stable
- Installation and onboarding are documented
- Primary inspection and report workflows are reliable
- Versioning and upgrade expectations are clear

Known blockers that should be explicitly addressed or accepted before `1.0.0`:

- local migration is credible, but the new unified schedules/settings storage boundary still needs release validation and operator-facing backup guidance; see Issue 50
- release and smoke gates are stronger now, but desktop end-to-end coverage remains thin for crash recovery, first-run repair, and upgrade continuity; see Issue 52
- credential rebind after migration is explicit, but OpsProbe still does not verify the rebound credential before recurring schedules resume; see Issue 51
- local runtime supervision is still process-based and best-effort rather than a hardened service-manager integration across platforms; see Issue 53

Required review artifact:

- [Stable Release Readiness](./stable-readiness.md)

`1.0.0` should not be used just because enough code exists. It should represent the first stable and externally credible open source release.

Deferred decision after `0.10.3`:

- do not publish `1.0.0` yet
- create one more pre-stable line focused on clean-machine install evidence, stable-candidate operator notes, and explicit acceptance or rejection of remaining runtime limits
- resume Issue 47 only after that evidence line is complete or explicitly cut short with written justification

## `0.11.x` Exploration IV: Stable-Candidate Evidence

Goal:

- prove whether OpsProbe can be installed, bootstrapped, and recovered credibly enough on a clean machine to justify a `1.0.0` release candidate

Includes:

- clean-machine or clean-user-profile validation notes for install, bootstrap, inspect, export, stop, and restart
- operator-facing install and backup guidance tightened to match the real packaged runtime behavior
- explicit acceptance or rejection of the remaining best-effort runtime supervision limits
- stable-decision evidence capture in Issue 47 rather than relying only on release automation

Exit criteria:

- install/bootstrap credibility is documented and repeatable enough to review for `1.0.0`
- the remaining runtime and migration limits are either accepted explicitly or moved into another pre-stable issue
- Issue 47 has enough concrete evidence to choose between a stable release candidate and another defer decision

Related issues:

- Issue 54

Recommended issue split inside `0.11.x`:

- `0.11.0`: clean-machine install, bootstrap, restart, backup, and stable-decision evidence consolidation, including honest recording of any current-machine packaging blockers
- `0.11.1`: immediate follow-up checkpoint after `0.11.0` so pushed UX, docs, or gate work gets its own patch identity
- `0.11.2`: current-version Linux packaged evidence refresh on a viable build environment plus Windows installer acceptance evidence on a real Windows or Wine-capable validation environment if earlier `0.11.x` checkpoints still lack install credibility
- `0.11.3`: final blocker acceptance or follow-up defer decision before reopening `1.0.0`

## Post-Stable Direction

### `1.1.0`

Goal:

- Establish the multilingual foundation for the desktop app, reports, and user-visible service messaging

Includes:

- Desktop translation boundary and language switch
- Chinese and English support for the main workflow
- Static report-copy translation for operator and manager exports

Related issues:

- Issue 48

Exit criteria:

- Main desktop workflow is switchable between Chinese and English
- HTML and PDF reports render their static copy in the selected language
- New user-facing strings have a defined i18n path instead of being hardcoded ad hoc

Suggested issue themes:

- i18n string extraction boundary for desktop React views
- report-copy translation boundary for HTML and PDF exports
- local-service user-facing message translation contract

### `1.2.0`

Goal:

- Make multilingual distribution and onboarding credible for customer testing

Includes:

- Product website with multilingual download and orientation pages
- Language consistency between the website, desktop app, and reports
- Clear download paths for released desktop builds

Related issues:

- Issue 49

Exit criteria:

- Users can reach a multilingual website and choose the correct download path
- Chinese and English terminology is consistent across the website and desktop product
- The release is strong enough for customer-facing multilingual testing instead of internal-only evaluation

Suggested issue themes:

- multilingual website shell and download page
- release artifact listing and version-aware download metadata
- terminology consistency review across website, desktop, and report exports
