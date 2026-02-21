# Contract: `price.crowd_submitted.v1`

## Event name
- `price.crowd_submitted`

## Payload (required)
- `item_type` (string)
- `area` (string)
- `price_paid` (number)
- `currency` (string, expected `MAD` in current rollout)

## Payload (optional)
- `asking_price` (number)
- `quality_estimate` (number in `[0,1]`)
- `lat_fuzzy` (number)
- `lng_fuzzy` (number)
- `app_version` (string)

## Meta (required)
- `sessionId` (string)
- `source` (string)

## Meta (optional)
- `auth_user_id` (string, client hint only - server does not trust this directly)
- `auth_trust` (string, server-enriched)
- `contribution_fingerprint` (string, server-enriched)
- `contribution_verdict` (string, server-enriched)
- `app_version` (string)

## Server rules (Phase 1)
- Rate limits:
- Authenticated: `<=30/hour`, `<=120/day`
- Anonymous/session: `<=12/hour`, `<=40/day`
- Dedupe window: `6h` on contribution fingerprint.
- Sanity:
- `price_paid` in `[5,50000]`
- `asking_price >= price_paid` when provided
- `quality_estimate` in `[0,1]` when provided

## Verdicts
- Accepted contributions are stored in `intel_event_stream`.
- Rejections are stored in `intel_event_rejections` with reason codes (for telemetry and abuse analysis).
