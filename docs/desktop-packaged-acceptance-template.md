# Desktop Packaged Acceptance Template

Use this template when running a real near-packaged or packaged desktop acceptance pass for `0.11.x` and later stable-candidate work.

This template is intentionally operator-facing. It should capture what a user actually experienced from launch to first useful inspection, not only whether engineering scripts passed.

Before using this template, run:

```bash
./scripts/validate-desktop-packaged-acceptance-preflight.sh
./scripts/validate-desktop-packaged-launch-smoke.sh
```

If the preflight says GUI launch is not currently possible, record that limitation first instead of pretending the packaged acceptance pass already happened.

If the launch smoke fails, record that before attempting a broader acceptance pass.

## Candidate Metadata

- Candidate version:
- Validation date:
- Reviewer:
- Machine label:
- Operating system:
- Package format:
- Package path:
- Install command:
- Launch command:

## 1. Install Experience

- Did the package install successfully?
- Were there any missing desktop dependencies?
- Did the app appear in the desktop launcher/menu?
- Did the icon and app name render correctly?
- Notes:

## 2. First Launch

- Did the app window open successfully?
- Did the first screen render without a blank window?
- Was `System Settings` usable on first launch?
- Were `Readiness Summary`, `Actionable Repair Packs`, and `First-Run Wizard` visible?
- Notes:

## 3. Runtime Bootstrap

- Could the operator understand the current runtime state?
- Were service start/stop/restart actions visible?
- Were PostgreSQL bootstrap/start/stop actions visible?
- If runtime repair was needed, were next steps understandable without source-code inspection?
- Notes:

## 4. First Useful Workflow

- Was saving an asset understandable?
- Was SSH verification understandable?
- Could the operator preview or run an inspection?
- Were the resulting findings understandable?
- Notes:

## 5. Export And Follow-Up

- Could the operator export config?
- Could the operator export HTML/PDF reports?
- Did open/reveal export actions work as expected?
- Was the report path understandable?
- Notes:

## 6. Recovery And Reopen

- After closing and reopening, did the app remain usable?
- If service repair was needed, was the repair path still understandable?
- Were any blank states or stalled actions observed?
- Notes:

## 7. Acceptance Outcome

Choose one:

- Accept as credible near-packaged evidence
- Accept with limitations
- Reject and continue pre-stable hardening

Reasoning:

- 
