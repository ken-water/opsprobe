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

Target release:

- `0.8.0`

## Future Commercial Direction

Potential future capabilities outside the open source scope:

- Web report publishing
- Customer login and online viewing
- Notification delivery
- Multi-user collaboration
- Multi-tenant management
- Enterprise security and audit controls

See also:

- [Versioning Strategy](./versioning.md)
- [Release Plan](./releases.md)
- [Validation Cycle 0.7](./validation-cycle-0.7.md)
- [Testing Strategy](./testing-strategy.md)
