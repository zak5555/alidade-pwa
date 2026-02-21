# Points Engine v2 - Phase 3 Checklist

## Goal
Enable advanced scoring (`v2`) safely while keeping current UX stable.

## Mandatory Now
1. Apply migration:
   - `supabase/migrations/20260221090000_points_phase3_advanced_scoring.sql`
2. Deploy updated Edge Function:
   - `supabase/functions/points-projector/index.ts`
3. Verify current Phase 3 status:
   - `npm run ops:points:phase3:status`
4. Keep advanced scoring OFF for first rollout check:
   - Expected config: `enable_advanced_scoring=false`
5. Run baseline projector health:
   - `npm run ops:points:projector:health`

## Activate Phase 3 (When Ready)
1. Enable advanced scoring:
   - `npm run ops:points:phase3:enable`
2. Optional tune config in one command:
   - `npm run ops:points:phase3:status`
   - `node --env-file=.env scripts/configure-points-phase3.cjs --mode update --pending-auto-verify-minutes 180 --novelty-window-hours 24 --consistency-soft-deviation 0.2 --consistency-hard-deviation 0.6`
3. Run projector once:
   - `npm run ops:points:projector:run`
4. Force pending settlement once:
   - `npm run ops:points:phase3:settle`
5. Re-check status and health:
   - `npm run ops:points:phase3:status`
   - `npm run ops:points:projector:health`

## Optional Later (Can Be Deferred)
1. Tighten scoring weights and thresholds after 2-3 days of live data.
2. Add Phase 3 metrics summary to GitHub Actions step summary.
3. Add user-facing copy for `PENDING REVIEW` to explain expected review window.

## Rollback
1. Disable advanced scoring instantly:
   - `npm run ops:points:phase3:disable`
2. Keep projector running (it will continue with v1 behavior for new rows).
3. Confirm rollback:
   - `npm run ops:points:phase3:status`
