# Storage Layout

OpsProbe now treats local runtime state as one active storage boundary instead of splitting schedules and desktop settings into separate primary files.

## Active Local Paths

Default root:

- `~/.opsprobe`

Primary subdirectories:

- `data/postgres`
  Dedicated PostgreSQL data directory for the OpsProbe-managed runtime
- `data/opsprobe-storage.json`
  Transitional fallback store when managed PostgreSQL is not ready
- `logs`
  Local-service and PostgreSQL logs
- `reports`
  Exported reports
- `runtime`
  PID and runtime-status markers

## What Lives In The Active State Store

Whether OpsProbe is currently using managed PostgreSQL or the fallback file adapter, these state categories now share one active storage boundary:

- assets
- templates
- inspection runs
- schedules
- desktop settings

This means schedules and desktop settings are no longer treated as separate primary JSON stores during normal operation.

## Legacy Files

Older builds may still have:

- `~/.opsprobe/config/desktop-settings.json`
- `~/.opsprobe/config/inspection-schedules.json`

OpsProbe now treats these as migration sources. When they are detected, their contents are copied into the active state store automatically.

## Backup Guidance

For a conservative local backup, keep:

- `~/.opsprobe/data`
- `~/.opsprobe/runtime`
- any exported config package created through OpsProbe

For the highest confidence backup before machine replacement:

1. stop the local service and managed PostgreSQL runtime
2. back up `~/.opsprobe/data`
3. keep exported reports separately if they matter operationally
4. keep the exported config package if you want a workflow-level import path in addition to raw data backup

## Machine Replacement Guidance

There are two supported operator-level approaches:

1. raw data move
   Move `~/.opsprobe/data` to the new machine, then reinstall and start OpsProbe so it reuses the managed PostgreSQL data directory
2. config export/import
   Export local configuration from the old machine, then import it on the new machine and rebind credentials

Notes:

- config export/import protects secrets by forcing credential rebind
- exported config packages include the source machine name and OpsProbe root path so operators can confirm where the package came from before importing it
- backup and restore at the raw data level preserve more local runtime history
- report files are not the same as active runtime state
