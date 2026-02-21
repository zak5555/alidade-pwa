# Points Projector (Points Engine v2)

Edge function that advances the server-side points ledger by calling:

- `public.project_points_from_intel_stream(p_limit integer default 500)`
- `public.settle_pending_points_v2(p_limit integer default 500)` (Phase 3)

It is intended to run on a schedule (every 1 minute).

## Required Secrets

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `POINTS_PROJECTOR_API_KEY` (recommended for manual invoke hardening)
- `POINTS_PROJECTOR_DEFAULT_LIMIT` (default: `500`, max: `5000`)
- `POINTS_PROJECTOR_RUN_SETTLEMENT` (default: `true`)
- `POINTS_PROJECTOR_SETTLEMENT_LIMIT` (default: `500`)

## Deploy

```bash
supabase functions deploy points-projector --no-verify-jwt
```

`verify_jwt=false` is intentional. Access is controlled by:

- service-role DB credentials inside the function runtime
- optional `POINTS_PROJECTOR_API_KEY` gate on requests

## Manual Invoke

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/points-projector" \
  -H "Content-Type: application/json" \
  -H "x-projector-key: <POINTS_PROJECTOR_API_KEY>" \
  -d '{"p_limit":500,"run_settlement":true,"settlement_limit":500}'
```

If `POINTS_PROJECTOR_API_KEY` is not configured, `x-projector-key` is not required.

## Scheduler Guidance

- Cadence: every minute (`* * * * *`)
- Suggested payload: `{"p_limit":500}`
- Monitor:
  - `public.points_projection_state.last_stream_id`
  - projector lag via `npm run ops:points:projector:health`
  - Phase 3 status via `npm run ops:points:phase3:status`
