# Versioning Strategy

OpsProbe uses semantic versioning with a product-oriented release policy.

Version format:

`MAJOR.MINOR.PATCH`

Example:

- `0.1.0`
- `0.2.0`
- `0.2.3`
- `1.0.0`

## Release Types

### Major Version

Format:

- `1.0.0`
- `2.0.0`

When to use:

- Product stage changes significantly
- Core architecture changes in a breaking way
- User-facing workflows change incompatibly
- Plugin, configuration, or data model compatibility breaks

OpsProbe rule:

- Major versions represent a new product generation
- Major versions should be rare
- The first stable public milestone should be `1.0.0`

### Minor Version

Format:

- `0.1.0`
- `0.2.0`
- `1.1.0`

When to use:

- A meaningful feature set is completed
- A usable milestone is reached
- New modules or workflows are added without redefining the entire product

OpsProbe rule:

- Minor versions are the primary planning unit
- Every minor version should have a clear theme
- Every minor version should be demoable and documented
- During `0.x`, a broader validation theme may be split across several consecutive minor versions when that keeps scope smaller and feedback loops faster

Examples:

- `0.1.0`: desktop skeleton and core structure
- `0.2.0`: first runnable SSH inspection flow
- `0.3.0`: local report export and history
- `0.7.0` to `0.7.4`: one external-validation cycle split into several small, separately releasable milestones

### Patch Version

Format:

- `0.1.1`
- `0.2.4`
- `1.0.2`

When to use:

- Bug fixes
- Small UX improvements
- Documentation updates
- Non-breaking performance or stability improvements

OpsProbe rule:

- Patch versions should not change product scope
- Patch versions should be safe upgrades for users on the same minor line

## Pre-1.0 Rules

Before `1.0.0`, OpsProbe is still shaping the open source product boundary.

Rules:

- Use `0.x.y` versions
- Minor versions may still include moderate internal refactors
- Breaking changes are acceptable if clearly documented
- Every minor release should still produce visible user value
- Consecutive minor versions may belong to the same broader product-validation phase if each version still has a concrete user-facing milestone

## Post-1.0 Rules

After `1.0.0`:

- Breaking changes require a major version bump
- New backward-compatible features require a minor version bump
- Fixes and small improvements require a patch version bump

## Release Cadence

Recommended cadence for the open source edition:

- Minor release: every 3 to 6 weeks
- Patch release: as needed
- Major release: only when product maturity or architecture genuinely changes

## Planning Principle

OpsProbe planning should happen at three levels:

1. Major version
   Defines the product stage
2. Minor version
   Defines the current build milestone
3. Patch version
   Delivers fixes and polish

## Current Product Stage

Current stage:

- `0.x`

Meaning:

- Early open source build
- Product boundary still being validated
- Focus on a usable local-first desktop MVP
