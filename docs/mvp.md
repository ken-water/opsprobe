# OpsProbe Open Source MVP

## Goal

Build a local-first desktop inspection tool that enables SMB operators and MSP teams to replace manual host inspection with a structured, repeatable workflow.

## Target Users

- Small and mid-sized IT teams
- External operations service providers
- Operators responsible for recurring infrastructure health reports

## MVP Product Shape

The open source MVP is a Tauri desktop application that runs inspections locally and stores results on the client side.

It is designed to:

- Connect to Linux hosts over SSH
- Execute standardized inspection checks
- Detect risks with clear evidence
- Generate detailed local reports
- Present remediation suggestions for common issues

## Core Modules

### 1. Asset Management

Capabilities:

- Add Linux host assets
- Organize assets with basic grouping
- Store connection metadata
- Test SSH connectivity before execution

Out of scope for MVP:

- Cloud asset discovery
- Windows and network devices
- CMDB-level modeling

### 2. Inspection Execution

Capabilities:

- Run inspections manually
- Run inspections on a schedule
- Execute checks over SSH
- Apply built-in host inspection templates

Execution requirements:

- Timeout control
- Retry handling
- Structured result output
- Basic execution logs

### 3. Inspection Checks

Initial built-in checks:

- CPU usage
- Memory usage
- Disk usage
- Load average
- Time synchronization
- Key process status
- Key port listening status
- Last reboot time
- Log directory usage

Every check should return:

- Status: pass, warning, critical, unknown
- Summary
- Evidence
- Remediation suggestion

### 4. Report Center

Capabilities:

- Generate a report for each inspection run
- Summarize host risk level
- List abnormal items
- Display remediation suggestions
- Export HTML and PDF reports locally

Report audiences:

- Operators: detailed evidence
- Managers: summary, severity, and recommendations

### 5. History

Capabilities:

- View inspection history by host
- Filter by time
- Compare recent results
- Detect repeated problems

### 6. Local Settings

Capabilities:

- Configure schedule rules
- Configure report output path
- Configure basic application settings
- View basic local logs

## Non-Goals For MVP

- Multi-user collaboration
- Web report publishing
- Mobile applications
- Notification center
- Multi-tenant support
- SSO and enterprise audit controls

## Success Criteria

The MVP is successful when a user can:

1. Add a Linux host
2. Test SSH connectivity
3. Run an inspection from a built-in template
4. See structured results with evidence and suggestions
5. Export a readable report
6. Revisit previous inspection history locally

## Future Expansion

After the open source MVP is stable, future versions can extend to:

- Web-based report publishing
- Customer login for report viewing
- Notification workflows
- Windows, database, and network device inspections
- Team collaboration and remediation workflows
- Export and import flows for migrating to a new machine
- Guided first-run setup with environment validation
