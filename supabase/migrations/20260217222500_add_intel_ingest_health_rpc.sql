-- Operational health RPC for intel ingest pipeline.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_intel_ingest_health(window_minutes integer DEFAULT 15)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_window integer := LEAST(GREATEST(COALESCE(window_minutes, 15), 1), 1440);
  since_at timestamptz := now() - make_interval(mins => safe_window);
  total_events bigint := 0;
  distinct_sessions bigint := 0;
  latest_occurred_at timestamptz := NULL;
  latest_ingested_at timestamptz := NULL;
  delayed_ingest_count bigint := 0;
  delayed_examples jsonb := '[]'::jsonb;
  events_by_name jsonb := '{}'::jsonb;
BEGIN
  SELECT
    count(*),
    count(DISTINCT session_id),
    max(occurred_at),
    max(ingested_at),
    count(*) FILTER (WHERE ingested_at - occurred_at > interval '2 minutes')
  INTO
    total_events,
    distinct_sessions,
    latest_occurred_at,
    latest_ingested_at,
    delayed_ingest_count
  FROM public.intel_event_stream
  WHERE ingested_at >= since_at;

  SELECT coalesce(jsonb_object_agg(event_name, event_count), '{}'::jsonb)
  INTO events_by_name
  FROM (
    SELECT event_name, count(*)::bigint AS event_count
    FROM public.intel_event_stream
    WHERE ingested_at >= since_at
    GROUP BY event_name
    ORDER BY event_name
  ) grouped;

  SELECT coalesce(jsonb_agg(example_row), '[]'::jsonb)
  INTO delayed_examples
  FROM (
    SELECT jsonb_build_object(
      'id', id,
      'event_id', coalesce(nullif(event_id, ''), concat('row:', id::text)),
      'event_name', event_name,
      'delay_seconds', round(extract(epoch FROM (ingested_at - occurred_at)))::int
    ) AS example_row
    FROM public.intel_event_stream
    WHERE ingested_at >= since_at
      AND ingested_at - occurred_at > interval '2 minutes'
    ORDER BY ingested_at DESC
    LIMIT 10
  ) delayed;

  RETURN jsonb_build_object(
    'windowMinutes', safe_window,
    'since', since_at,
    'totalEvents', total_events,
    'distinctSessions', distinct_sessions,
    'latestOccurredAt', latest_occurred_at,
    'latestIngestedAt', latest_ingested_at,
    'delayedIngestCount', delayed_ingest_count,
    'eventsByName', events_by_name,
    'delayedExamples', delayed_examples
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_intel_ingest_health(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_intel_ingest_health(integer) TO service_role;

COMMENT ON FUNCTION public.get_intel_ingest_health(integer) IS
'Returns operational health metrics for intel_event_stream over a recent time window.';

COMMIT;
