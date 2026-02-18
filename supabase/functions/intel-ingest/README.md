# Intel Ingest Deployment Notes

## Required Secrets

Set these before deploying:

- `INTEL_INGEST_SIGNING_SECRET` (required, strong random value)
- `INTEL_INGEST_PERSIST` (set to `1` to persist into `public.intel_event_stream`)
- `INTEL_INGEST_API_KEY` (required when `INTEL_INGEST_PERSIST=1`)

Optional hardening:

- Additional gateway controls (WAF/IP allowlist) in front of Edge endpoint

Supabase CLI example:

```bash
supabase secrets set \
  INTEL_INGEST_SIGNING_SECRET="<strong-secret>" \
  INTEL_INGEST_PERSIST="1" \
  INTEL_INGEST_API_KEY="<optional-ingest-api-key>"
```

## Migration Dependency

Apply migration before function deploy:

- `supabase/migrations/20260217220500_create_intel_event_stream.sql`
- `supabase/migrations/20260218052018_add_intel_ingest_rejection_telemetry.sql`

This migration creates:

- `public.intel_event_stream`
- `public.intel_event_rejections`
- strict service-role-only RLS policies
- dedupe unique index on `event_id`
- retention function `public.purge_intel_event_stream(retain_days integer)`

## Deploy

```bash
supabase functions deploy intel-ingest --no-verify-jwt
```

`verify_jwt=false` is intentional here because requests are authenticated by:

- envelope signature (`INTEL_INGEST_SIGNING_SECRET`)
- optional ingest API key (`INTEL_INGEST_API_KEY`)

## Defensive Limits (default)

- request body max: `512 KB`
- content type required: `application/json`
- events per request max: `200`
- event age window: `<= 5 min` and future skew `<= 60 sec`
- replay nonce required (length + charset validation)
- `signature_alg` must be `sha256`
- payload/meta/event byte-size caps to block oversized envelopes
- in-memory nonce/session caches are bounded and pruned

## Post-Deploy Smoke

Run:

```bash
npm run test:smoke:defense:full
npm run security:scan:secrets
npm run ops:hooks:install
```

Operational health check (requires service-role env vars):

```bash
npm run ops:intel:health -- --window-minutes 15 --min-events 1 --max-delayed 25
```

Recommended strict profile:

```bash
npm run ops:intel:health:strict
```

Strict end-to-end verify (ingest + persistence + source-scoped health):

```bash
npm run ops:intel:verify:strict
```

Strict verify with automated rejection-path probe:

```bash
npm run ops:intel:verify:strict:rejection
```

CI full gate profile:

```bash
npm run ops:intel:ci
```

`smoke-defense` workflow runs this profile on push/PR and every 6 hours (`cron: 17 */6 * * *`).

If your `.env` is not loaded, you can override credentials directly:

```bash
npm run ops:intel:health -- --supabase-url https://<project>.supabase.co --service-role-key <service_role_or_sb_secret>
```

## Browser Runtime Setup (required for local smoke)

The client runtime must send:

- `x-intel-ingest-key`
- signatures that match `INTEL_INGEST_SIGNING_SECRET`

For quick local verification, set these once in browser console:

```js
window.ALIDADE_INTEL_EVENT_UTILS?.setIngestApiKey('<INTEL_INGEST_API_KEY>');
window.ALIDADE_INTEL_EVENT_UTILS?.setSigningSecret('<INTEL_INGEST_SIGNING_SECRET>');
```

Then trigger one action that emits intel events (context update or SOS arm) and run:

```bash
npm run ops:intel:health -- --window-minutes 15 --min-events 1 --max-delayed 25
```
