# OpsProbe Roadmap

## Phase 0: Foundation

- Define product boundary for the open source edition
- Publish repository documentation
- Set up Tauri desktop skeleton
- Establish package layout for reusable core modules

Target release:

- `0.1.0`

## Phase 1: Local Inspection MVP

- Linux host asset management
- SSH connection testing
- Manual inspection execution
- Initial built-in host checks
- Structured result view
- Local HTML/PDF report export
- PostgreSQL-first local service direction confirmed

Target releases:

- `0.2.0`
- `0.3.0`

## Phase 2: Usability

- Scheduled inspections
- Inspection history
- Result comparison
- Better report formatting
- Improved error handling and logs
- Export and import local configuration
- Credential rebind flow after machine migration
- First-run setup and environment validation for a better out-of-box experience
- Managed local PostgreSQL bootstrap and health checks

Target releases:

- `0.4.0`
- `0.5.0`

## Phase 3: Expansion

- More host checks
- Built-in template selection by Linux service role
- Database inspection support
- Configurable templates
- Better remediation knowledge base
- External PostgreSQL mode for advanced deployments

Candidate release range:

- `0.6.0+`

## Phase 4: External Validation

- Guided first-run experience with demo data
- Clearer runtime diagnostics and repair guidance
- Report variants for operators and managers
- Better structured feedback capture from early outside users
- Evidence-based closure of repeated early-user friction

Target releases:

- `0.7.0`
- `0.7.1`
- `0.7.2`
- `0.7.3`
- `0.7.4`

## Phase 5: Post-Validation Exploration

- Deepen inspection coverage for real Linux service roles
- Improve template flexibility without losing local-first simplicity
- Keep refining recurring operations workflows before any hosted expansion
- Establish a real automated testing foundation before complexity grows further

Target release line:

- `0.8.x`

Current planned checkpoints:

- `0.8.0`: Docker workflow depth and current exploration release
- `0.8.1`: Kubernetes node workflow depth
- `0.8.2`: report and remediation usefulness
- `0.8.3`: functional coverage and release hardening

## Phase 6: Service Depth And Operator Trust

- Deepen built-in inspection workflows for the most common SMB service roles
- Make remediation advice more evidence-driven for database and web-service operations
- Strengthen cross-signal reports so host and service findings lead to clearer action order
- Keep expanding automated coverage around local-service workflows, installation, and upgrade safety

Target release line:

- `0.9.x`

Current planned checkpoints:

- `0.9.0`: MySQL deep inspection workflow
- `0.9.1`: Redis deep inspection workflow
- `0.9.2`: Nginx deep inspection workflow
- `0.9.3`: host-and-service correlated reporting
- `0.9.4`: installation, upgrade, and regression hardening

## Phase 7: Pre-Stable Hardening

- tighten the runtime data boundary before the first stable release
- make migration and credential recovery safer for recurring schedules
- increase evidence for crash recovery, first-run repair, and upgrade continuity
- make local runtime supervision and machine-replacement guidance honest and repeatable

Target release line:

- `0.10.x`

Current planned checkpoints:

- `0.10.0`: schedules, settings, backup, and storage-boundary hardening
- `0.10.1`: credential revalidation before recurring schedules resume
- `0.10.2`: crash recovery, first-run repair, and upgrade continuity evidence
- `0.10.3`: local runtime supervision and machine-move trust
- `0.10.4`: post-install readiness summary and grouped repair guidance

## Phase 8: Stable-Candidate Evidence

- verify clean-machine install and bootstrap credibility
- document stop, restart, backup, and recovery behavior as an operator workflow instead of only engineering assumptions
- capture explicit stable-decision evidence before allowing a `1.0.0` tag

Target release line:

- `0.11.x`

Current planned checkpoints:

- `0.11.0`: clean-machine install, bootstrap, and stable-decision evidence

## Future Commercial Direction

Potential future capabilities outside the open source scope:

- Web report publishing
- Customer login and online viewing
- Notification delivery
- Multi-user collaboration
- Multi-tenant management
- Enterprise security and audit controls

## Next Product Stage

### `1.0.0` Stable Decision

- Do not treat `1.0.0` as the automatic next coding milestone after `0.10.x`
- After `0.10.3`, continue through `0.11.x` before revisiting the stable decision
- Use `Issue 47` to decide whether current blockers must be fixed first or can be explicitly accepted
- Require a defensible stable-release rationale, not just another finished release

### `1.1.0` Multilingual Foundation

- Add multilingual infrastructure for the desktop UI
- Support at least Chinese and English in the main workflow
- Add multilingual static copy for HTML and PDF reports
- Move user-visible local-service messages toward a translation boundary

Related issue:

- `1.1.0`: Issue 48

### `1.2.0` Customer-Testable Website And Language Support

- Provide a multilingual website for product orientation and downloads
- Keep website terminology aligned with desktop and report language choices
- Make multilingual distribution credible for customer testing instead of only internal validation

Related issue:

- `1.2.0`: Issue 49

See also:

- [Versioning Strategy](./versioning.md)
- [Release Plan](./releases.md)
- [Validation Cycle 0.7](./validation-cycle-0.7.md)
- [Testing Strategy](./testing-strategy.md)
