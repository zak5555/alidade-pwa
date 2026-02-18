-- Add rejectedBySourceReason KPI to intel ingest health RPC.

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
  total_rejected bigint := 0;
  distinct_sessions bigint := 0;
  latest_occurred_at timestamptz := NULL;
  latest_ingested_at timestamptz := NULL;
  latest_rejected_at timestamptz := NULL;
  delayed_ingest_count bigint := 0;
  delayed_examples jsonb := '[]'::jsonb;
  events_by_name jsonb := '{}'::jsonb;
  events_by_source jsonb := '{}'::jsonb;
  events_by_power_mode jsonb := '{}'::jsonb;
  events_by_threat_level jsonb := '{}'::jsonb;
  rejected_by_reason jsonb := '{}'::jsonb;
  rejected_by_source jsonb := '{}'::jsonb;
  rejected_by_source_reason jsonb := '{}'::jsonb;
  rejected_by_event_name jsonb := '{}'::jsonb;
  ingest_delay_ms_p50 numeric := NULL;
  ingest_delay_ms_p95 numeric := NULL;
  ingest_delay_ms_max numeric := NULL;
  rejection_rate_percent numeric := NULL;
  freshness_seconds integer := NULL;
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

  SELECT
    count(*),
    max(rejected_at)
  INTO
    total_rejected,
    latest_rejected_at
  FROM public.intel_event_rejections
  WHERE rejected_at >= since_at;

  SELECT coalesce(jsonb_object_agg(event_name_key, event_count), '{}'::jsonb)
  INTO events_by_name
  FROM (
    SELECT event_name AS event_name_key, count(*)::bigint AS event_count
    FROM public.intel_event_stream
    WHERE ingested_at >= since_at
    GROUP BY event_name
    ORDER BY event_name
  ) grouped;

  SELECT coalesce(jsonb_object_agg(source_name, event_count), '{}'::jsonb)
  INTO events_by_source
  FROM (
    SELECT source AS source_name, count(*)::bigint AS event_count
    FROM public.intel_event_stream
    WHERE ingested_at >= since_at
    GROUP BY source
    ORDER BY source
  ) grouped;

  SELECT coalesce(jsonb_object_agg(power_mode_name, event_count), '{}'::jsonb)
  INTO events_by_power_mode
  FROM (
    SELECT power_mode AS power_mode_name, count(*)::bigint AS event_count
    FROM public.intel_event_stream
    WHERE ingested_at >= since_at
    GROUP BY power_mode
    ORDER BY power_mode
  ) grouped;

  SELECT coalesce(jsonb_object_agg(threat_level_name, event_count), '{}'::jsonb)
  INTO events_by_threat_level
  FROM (
    SELECT threat_level AS threat_level_name, count(*)::bigint AS event_count
    FROM public.intel_event_stream
    WHERE ingested_at >= since_at
    GROUP BY threat_level
    ORDER BY threat_level
  ) grouped;

  SELECT coalesce(jsonb_object_agg(reason_key, reject_count), '{}'::jsonb)
  INTO rejected_by_reason
  FROM (
    SELECT reason AS reason_key, count(*)::bigint AS reject_count
    FROM public.intel_event_rejections
    WHERE rejected_at >= since_at
    GROUP BY reason
    ORDER BY reason
  ) grouped;

  SELECT coalesce(jsonb_object_agg(source_key, reject_count), '{}'::jsonb)
  INTO rejected_by_source
  FROM (
    SELECT source AS source_key, count(*)::bigint AS reject_count
    FROM public.intel_event_rejections
    WHERE rejected_at >= since_at
    GROUP BY source
    ORDER BY source
  ) grouped;

  SELECT coalesce(jsonb_object_agg(source_key, reasons_bucket), '{}'::jsonb)
  INTO rejected_by_source_reason
  FROM (
    SELECT
      source_key,
      coalesce(jsonb_object_agg(reason_key, reject_count), '{}'::jsonb) AS reasons_bucket
    FROM (
      SELECT
        source AS source_key,
        reason AS reason_key,
        count(*)::bigint AS reject_count
      FROM public.intel_event_rejections
      WHERE rejected_at >= since_at
      GROUP BY source, reason
      ORDER BY source, reason
    ) grouped_source_reason
    GROUP BY source_key
    ORDER BY source_key
  ) grouped;

  SELECT coalesce(jsonb_object_agg(event_name_key, reject_count), '{}'::jsonb)
  INTO rejected_by_event_name
  FROM (
    SELECT coalesce(nullif(event_name, ''), 'unknown') AS event_name_key, count(*)::bigint AS reject_count
    FROM public.intel_event_rejections
    WHERE rejected_at >= since_at
    GROUP BY coalesce(nullif(event_name, ''), 'unknown')
    ORDER BY coalesce(nullif(event_name, ''), 'unknown')
  ) grouped;

  SELECT
    percentile_cont(0.5) WITHIN GROUP (ORDER BY delay_ms),
    percentile_cont(0.95) WITHIN GROUP (ORDER BY delay_ms),
    max(delay_ms)
  INTO
    ingest_delay_ms_p50,
    ingest_delay_ms_p95,
    ingest_delay_ms_max
  FROM (
    SELECT GREATEST(extract(epoch FROM (ingested_at - occurred_at)) * 1000.0, 0)::numeric AS delay_ms
    FROM public.intel_event_stream
    WHERE ingested_at >= since_at
  ) delays;

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

  IF latest_ingested_at IS NOT NULL THEN
    freshness_seconds := GREATEST(round(extract(epoch FROM (now() - latest_ingested_at)))::int, 0);
  END IF;

  IF (total_events + total_rejected) > 0 THEN
    rejection_rate_percent := round(
      (total_rejected::numeric * 100.0) / ((total_events + total_rejected)::numeric),
      4
    );
  ELSE
    rejection_rate_percent := 0;
  END IF;

  RETURN jsonb_build_object(
    'windowMinutes', safe_window,
    'since', since_at,
    'totalEvents', total_events,
    'totalRejected', total_rejected,
    'rejectRatePercent', rejection_rate_percent,
    'distinctSessions', distinct_sessions,
    'latestOccurredAt', latest_occurred_at,
    'latestIngestedAt', latest_ingested_at,
    'latestRejectedAt', latest_rejected_at,
    'freshnessSeconds', freshness_seconds,
    'delayedIngestCount', delayed_ingest_count,
    'ingestDelayMsP50', ingest_delay_ms_p50,
    'ingestDelayMsP95', ingest_delay_ms_p95,
    'ingestDelayMsMax', ingest_delay_ms_max,
    'eventsByName', events_by_name,
    'eventsBySource', events_by_source,
    'eventsByPowerMode', events_by_power_mode,
    'eventsByThreatLevel', events_by_threat_level,
    'rejectedByReason', rejected_by_reason,
    'rejectedBySource', rejected_by_source,
    'rejectedBySourceReason', rejected_by_source_reason,
    'rejectedByEventName', rejected_by_event_name,
    'delayedExamples', delayed_examples
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_intel_ingest_health(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_intel_ingest_health(integer) TO service_role;

COMMENT ON FUNCTION public.get_intel_ingest_health(integer) IS
'Returns operational ingest + rejection KPIs over a recent time window, including rejectedBySourceReason matrix.';

COMMIT;
