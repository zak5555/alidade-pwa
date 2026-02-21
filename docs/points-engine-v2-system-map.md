# Points Engine v2 - System Map (Phase 0)

## Entry
- User submits a crowd contribution from price flow (`showContributionPrompt` -> `CrowdPriceDB.submitPrice`).
- Dual-write transition:
- `crowd_prices` REST insert (legacy path).
- `price.crowd_submitted` canonical intel event (new server-validation lane).

## Process
- Local lane (UX continuity):
- Local reward (`+10`) and rank update remains active when `ENABLE_REWARDS_UI=true`.
- Server-validation lane:
- Edge ingest validates schema, rate, dedupe, sanity.
- Trust enrichment classifies contribution as `supabase_jwt` or `anonymous`.
- Verdict is recorded via accepted stream row or rejection telemetry reason code.
- Ledger lane (Phase 2):
- Projector RPC consumes accepted `price.crowd_submitted` events.
- Writes append-only `points_ledger` rows (`verified` for trusted auth, `pending` for session mode).

## Storage
- Local keys:
- `alidade_contributions`
- `alidade_crowd_points`
- `alidade_crowd_rank`
- `alidade_crowd_sync_badge`
- Server:
- `public.intel_event_stream`
- `public.intel_event_rejections`
- `public.points_ledger`
- `public.points_projection_state`
- `public.points_balance_v1` (derived view)

## Output
- Current UX remains local-first for points/rank.
- Sync badge is displayed in contribution modal:
- `SYNCED`
- `PENDING REVIEW`
- `REJECTED`
- `LOCAL MODE` (fallback/default)

## Control Flags
- `ENABLE_REWARDS_UI`
- `ENABLE_SERVER_VALIDATION`
- `ENABLE_LEDGER_WRITE`
- `ENABLE_ADVANCED_SCORING`
