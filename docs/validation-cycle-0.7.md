# External Validation Cycle 0.7

This document closes the `0.7.0` to `0.7.4` validation cycle with an explicit record of what friction was addressed, what remains deferred, and what the next stage should be.

## What Was Addressed

### `0.7.0` Guided First Run

- Added a demo mode so first-time users can understand reports, history, and templates without connecting a real host
- Kept demo data separate from real persisted inspection history

### `0.7.1` Runtime Diagnostics

- Added better SSH troubleshooting detail
- Added repair guidance for local service, managed PostgreSQL, PATH, permissions, and port conflicts

### `0.7.2` Report Variants

- Added operator and manager report audiences
- Kept both variants on the same export paths so users can compare them directly

### `0.7.3` Feedback Capture

- Added structured GitHub issue templates for inspection needs, report feedback, and workflow friction
- Added clear feedback prompts in the repository and desktop UI

## Highest-Signal Friction Themes

Across the `0.7.x` cycle, the repeated friction themes were:

- first-time users needed a way to understand the product before configuring infrastructure
- setup failures needed to be explained in the product, not just in logs
- one report style was not enough for different readers
- users needed a clearer path to submit feedback tied to a real workflow

## Deferred On Purpose

These items remain important, but are not yet the right next step:

- web report publishing and customer login
- notification delivery
- multi-user collaboration
- trend reporting across many runs
- in-product feedback submission backend
- control-plane aware Kubernetes inspection

They were deferred because the strongest current evidence still points to improving local inspection quality and workflow reliability first.

## Decision Checkpoint

Decision:

- choose a `0.8.x` exploration line next
- do not declare `1.0.0` yet

Reason:

- the open source workflow is more understandable now, but it still needs stronger inspection depth, broader real-world coverage, and more evidence from outside usage before it can credibly claim stable `1.0.0` status

## Next Stage Choice

The next stage should focus on:

- deeper inspection coverage for real Linux service roles
- better template flexibility and report usefulness for recurring operations work
- continued local-first workflow polish before any hosted or collaborative features

In short:

- keep the product local-first
- deepen inspection quality
- delay platform breadth
