# Intel Triage Incident Runbook

Last updated: 2026-02-19

## Current Production Policy

- `INTEL_TRIAGE_AUTO_INCIDENT=1`
- `INTEL_TRIAGE_AUTO_INCIDENT_DRY_RUN=false`
- `INTEL_TRIAGE_DRY_RUN_STRICT=1`
- `INTEL_TRIAGE_DRY_RUN_WARNING_HOURS=48`
- `INTEL_TRIAGE_DRY_RUN_EXPIRES_AT=2026-02-21`
- `INTEL_SLA_INCIDENT_LABELS=ops,incident,intel,sla,priority:p1`
- `INTEL_SLA_INCIDENT_ASSIGNEES=zak5555`
- `INTEL_SLA_INCIDENT_COMMENT_COOLDOWN_MINUTES=60`
- `INTEL_SLA_INCIDENT_ESCALATION_HOURS=6`
- `INTEL_SLA_INCIDENT_ESCALATION_LABEL=priority:p0`

## Daily Health Checks

```bash
npm run ops:intel:health -- --window-minutes 60 --min-events 5 --max-delayed 25
npm run ops:intel:triage:route:live:check
npm run ops:intel:burnin
```

Expected:

- `ops:intel:health`: `"ok": true`
- `ops:intel:triage:route:live:check`: `routeMode=live`, `productionReady=true`, `"ok": true`
- `ops:intel:burnin`: `"ok": true`

## Workflow Validation (Full Lane)

```bash
gh workflow run smoke-defense.yml --repo zak5555/alidade-pwa -f verify_profile=full
```

Then validate `intel-verify-full` step list includes:

- `Publish intel verify summary (full)`
- `Intel verify triage signal (full)`
- `Guard triage dry-run horizon (full lane)`
- `Triage dry-run reminder signal (full lane)`
- `Route triage-critical incident (full lane)`

## Critical + Resolve Drill (Real, Isolated)

Use drill prefix to avoid touching real SLA incident title:

```bash
node scripts/report-intel-sla-incident.cjs \
  --mode open \
  --repo zak5555/alidade-pwa \
  --workflow smoke-defense.yml \
  --branch main \
  --required-job intel-verify-full \
  --sla-max-age-hours 12 \
  --sla-outcome failure \
  --remediation-outcome triage_critical \
  --remediation-dispatched false \
  --remediation-reason drill_triage_critical \
  --labels ops,incident,intel,sla,priority:p1 \
  --comment-cooldown-minutes 0 \
  --escalation-hours 6 \
  --escalation-label priority:p0 \
  --title-prefix "[INTEL_SLA_DRILL]" \
  --dry-run false
```

```bash
node scripts/report-intel-sla-incident.cjs \
  --mode resolve \
  --repo zak5555/alidade-pwa \
  --workflow smoke-defense.yml \
  --branch main \
  --required-job intel-verify-full \
  --sla-max-age-hours 12 \
  --sla-outcome success \
  --labels ops,incident,intel,sla,priority:p1 \
  --comment-cooldown-minutes 0 \
  --escalation-hours 6 \
  --escalation-label priority:p0 \
  --title-prefix "[INTEL_SLA_DRILL]" \
  --dry-run false
```

Verify issue state:

```bash
gh issue list --repo zak5555/alidade-pwa --state all --search "[INTEL_SLA_DRILL] smoke-defense.yml stale on main in:title"
```

Expected:

- Open drill: `action=created` (or `action=commented` if rerun)
- Resolve drill: `action=closed`

## Rollback (If Needed)

Emergency safe mode:

```bash
gh variable set INTEL_TRIAGE_AUTO_INCIDENT_DRY_RUN --body "true" --repo zak5555/alidade-pwa
gh workflow run smoke-defense.yml --repo zak5555/alidade-pwa -f verify_profile=full
```

## Notes

- `Route triage-critical incident (full lane)` being `skipped` is normal when `triage_has_critical=false`.
- Keep `INTEL_TRIAGE_DRY_RUN_EXPIRES_AT` refreshed only when intentionally using dry-run mode.
