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

This migration creates:

- `public.intel_event_stream`
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

## Post-Deploy Smoke

Run:

```bash
npm run test:smoke:defense:full
```

Operational health check (requires service-role env vars):

```bash
npm run ops:intel:health -- --window-minutes 15 --min-events 1 --max-delayed 25
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
