# @opsprobe/storage

Storage contracts and adapters for OpsProbe.

The package is PostgreSQL-first and is intended to be consumed by the local service instead of the desktop UI directly.

Recovery notes:

- the local file adapter treats malformed JSON snapshots as recoverable local damage
- when recovery is triggered, the malformed snapshot is quarantined to a timestamped `.corrupt-*` file and a clean empty snapshot is rebuilt automatically
