-- Points Engine v2 Phase 3: advanced scoring + pending settlement + runtime config.

BEGIN;

ALTER TABLE public.points_ledger
  ADD COLUMN IF NOT EXISTS score_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.points_ledger
  ADD COLUMN IF NOT EXISTS review_not_before timestamptz;

ALTER TABLE public.points_ledger
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

ALTER TABLE public.points_ledger
  ADD COLUMN IF NOT EXISTS settled_at timestamptz;

CREATE TABLE IF NOT EXISTS public.points_engine_config (
  singleton boolean PRIMARY KEY DEFAULT true,
  enable_advanced_scoring boolean NOT NULL DEFAULT false,
  auth_low_consistency_pending boolean NOT NULL DEFAULT true,
  anon_verified_ratio numeric(5,4) NOT NULL DEFAULT 0.2000,
  pending_auto_verify_minutes integer NOT NULL DEFAULT 180,
  novelty_window_hours integer NOT NULL DEFAULT 24,
  consistency_soft_deviation numeric(8,4) NOT NULL DEFAULT 0.2000,
  consistency_hard_deviation numeric(8,4) NOT NULL DEFAULT 0.6000,
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'points_engine_config_singleton_check'
      AND conrelid = 'public.points_engine_config'::regclass
  ) THEN
    ALTER TABLE public.points_engine_config
      ADD CONSTRAINT points_engine_config_singleton_check
      CHECK (singleton = true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'points_engine_config_anon_verified_ratio_check'
      AND conrelid = 'public.points_engine_config'::regclass
  ) THEN
    ALTER TABLE public.points_engine_config
      ADD CONSTRAINT points_engine_config_anon_verified_ratio_check
      CHECK (anon_verified_ratio >= 0 AND anon_verified_ratio <= 1);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'points_engine_config_pending_auto_verify_minutes_check'
      AND conrelid = 'public.points_engine_config'::regclass
  ) THEN
    ALTER TABLE public.points_engine_config
      ADD CONSTRAINT points_engine_config_pending_auto_verify_minutes_check
      CHECK (pending_auto_verify_minutes >= 5 AND pending_auto_verify_minutes <= 10080);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'points_engine_config_novelty_window_hours_check'
      AND conrelid = 'public.points_engine_config'::regclass
  ) THEN
    ALTER TABLE public.points_engine_config
      ADD CONSTRAINT points_engine_config_novelty_window_hours_check
      CHECK (novelty_window_hours >= 1 AND novelty_window_hours <= 168);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'points_engine_config_consistency_deviation_check'
      AND conrelid = 'public.points_engine_config'::regclass
  ) THEN
    ALTER TABLE public.points_engine_config
      ADD CONSTRAINT points_engine_config_consistency_deviation_check
      CHECK (
        consistency_soft_deviation >= 0
        AND consistency_hard_deviation > consistency_soft_deviation
        AND consistency_hard_deviation <= 10
      );
  END IF;
END
$$;

INSERT INTO public.points_engine_config (
  singleton,
  enable_advanced_scoring,
  auth_low_consistency_pending,
  anon_verified_ratio,
  pending_auto_verify_minutes,
  novelty_window_hours,
  consistency_soft_deviation,
  consistency_hard_deviation,
  updated_at
)
VALUES (true, false, true, 0.2, 180, 24, 0.2, 0.6, now())
ON CONFLICT (singleton) DO NOTHING;

CREATE OR REPLACE FUNCTION public.project_points_from_intel_stream(p_limit integer DEFAULT 500)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_limit integer := LEAST(GREATEST(COALESCE(p_limit, 500), 1), 5000);
  projector text := 'crowd_points_v1';
  cursor_id bigint := 0;
  processed_count integer := 0;
  inserted_count integer := 0;
  inserted_v1_count integer := 0;
  inserted_v2_count integer := 0;
  duplicate_count integer := 0;
  max_stream_id bigint := NULL;
  inserted_row_count integer := 0;
  stream_row record;
  subject_type_value text;
  subject_id_value text;
  status_value text;
  reason_code_value text;
  fingerprint_value text;
  event_id_value text;
  existing_event boolean;
  review_not_before_value timestamptz;
  verified_at_value timestamptz;
  settled_at_value timestamptz;
  score_meta_value jsonb := '{}'::jsonb;
  points_value integer := 10;
  rule_version_value text := 'v1';
  is_auth boolean := false;
  price_paid_value numeric;
  asking_price_value numeric;
  quality_estimate_value numeric;
  has_geo boolean;
  novelty_count integer;
  median_price numeric;
  deviation_ratio numeric;
  completeness_score numeric := 0;
  novelty_score numeric := 0.7;
  consistency_score numeric := 0.7;
  weighted_score numeric := 0.7;
  cfg_enable_advanced boolean := false;
  cfg_auth_low_consistency_pending boolean := true;
  cfg_anon_verified_ratio numeric := 0.2;
  cfg_pending_auto_verify_minutes integer := 180;
  cfg_novelty_window_hours integer := 24;
  cfg_consistency_soft_deviation numeric := 0.2;
  cfg_consistency_hard_deviation numeric := 0.6;
BEGIN
  INSERT INTO public.points_projection_state (projector_name, last_stream_id, updated_at)
  VALUES (projector, 0, now())
  ON CONFLICT (projector_name) DO NOTHING;

  SELECT
    coalesce(enable_advanced_scoring, false),
    coalesce(auth_low_consistency_pending, true),
    coalesce(anon_verified_ratio, 0.2),
    coalesce(pending_auto_verify_minutes, 180),
    coalesce(novelty_window_hours, 24),
    coalesce(consistency_soft_deviation, 0.2),
    coalesce(consistency_hard_deviation, 0.6)
  INTO
    cfg_enable_advanced,
    cfg_auth_low_consistency_pending,
    cfg_anon_verified_ratio,
    cfg_pending_auto_verify_minutes,
    cfg_novelty_window_hours,
    cfg_consistency_soft_deviation,
    cfg_consistency_hard_deviation
  FROM public.points_engine_config
  WHERE singleton = true
  LIMIT 1;

  SELECT last_stream_id
  INTO cursor_id
  FROM public.points_projection_state
  WHERE projector_name = projector
  FOR UPDATE;

  FOR stream_row IN
    SELECT id, event_id, occurred_at, session_id, payload, context
    FROM public.intel_event_stream
    WHERE id > cursor_id
      AND event_name = 'price.crowd_submitted'
    ORDER BY id ASC
    LIMIT safe_limit
  LOOP
    processed_count := processed_count + 1;
    max_stream_id := stream_row.id;

    is_auth := (
      coalesce(stream_row.context ->> 'auth_trust', 'anonymous') = 'supabase_jwt'
      AND coalesce(nullif(stream_row.context ->> 'auth_user_id', ''), '') <> ''
    );

    IF is_auth THEN
      subject_type_value := 'user';
      subject_id_value := stream_row.context ->> 'auth_user_id';
      status_value := 'verified';
      reason_code_value := 'crowd_submit_auth_verified';
    ELSE
      subject_type_value := 'session';
      subject_id_value := coalesce(nullif(stream_row.session_id, ''), 'anonymous');
      status_value := 'pending';
      reason_code_value := 'crowd_submit_pending_review';
    END IF;

    fingerprint_value := coalesce(
      nullif(stream_row.context ->> 'contribution_fingerprint', ''),
      md5(
        coalesce(stream_row.payload ->> 'item_type', '') || '|' ||
        coalesce(stream_row.payload ->> 'area', '') || '|' ||
        coalesce(stream_row.payload ->> 'price_paid', '') || '|' ||
        coalesce(stream_row.payload ->> 'asking_price', '') || '|' ||
        coalesce(subject_id_value, '')
      )
    );

    event_id_value := coalesce(nullif(stream_row.event_id, ''), format('stream:%s', stream_row.id));
    SELECT EXISTS (
      SELECT 1
      FROM public.points_ledger
      WHERE event_id = event_id_value
    )
    INTO existing_event;

    IF existing_event THEN
      duplicate_count := duplicate_count + 1;
      CONTINUE;
    END IF;

    points_value := 10;
    rule_version_value := 'v1';
    review_not_before_value := NULL;
    verified_at_value := CASE WHEN status_value = 'verified' THEN now() ELSE NULL END;
    settled_at_value := verified_at_value;
    score_meta_value := '{}'::jsonb;

    IF cfg_enable_advanced THEN
      rule_version_value := 'v2';
      reason_code_value := CASE WHEN is_auth THEN 'crowd_submit_auth_scored_v2' ELSE 'crowd_submit_pending_scored_v2' END;

      price_paid_value := CASE
        WHEN (stream_row.payload ->> 'price_paid') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (stream_row.payload ->> 'price_paid')::numeric
        ELSE NULL
      END;
      asking_price_value := CASE
        WHEN (stream_row.payload ->> 'asking_price') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (stream_row.payload ->> 'asking_price')::numeric
        ELSE NULL
      END;
      quality_estimate_value := CASE
        WHEN (stream_row.payload ->> 'quality_estimate') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (stream_row.payload ->> 'quality_estimate')::numeric
        ELSE NULL
      END;

      has_geo := (
        (stream_row.payload ->> 'lat_fuzzy') ~ '^-?[0-9]+(\.[0-9]+)?$'
        AND (stream_row.payload ->> 'lng_fuzzy') ~ '^-?[0-9]+(\.[0-9]+)?$'
      );

      completeness_score := 0;
      IF asking_price_value IS NOT NULL THEN completeness_score := completeness_score + 0.35; END IF;
      IF quality_estimate_value IS NOT NULL AND quality_estimate_value >= 0 AND quality_estimate_value <= 1 THEN
        completeness_score := completeness_score + 0.35;
      END IF;
      IF coalesce(nullif(lower(coalesce(stream_row.payload ->> 'area', '')), ''), 'unknown') <> 'unknown' THEN
        completeness_score := completeness_score + 0.15;
      END IF;
      IF has_geo THEN
        completeness_score := completeness_score + 0.15;
      END IF;
      completeness_score := LEAST(1, completeness_score);

      SELECT count(*)::integer
      INTO novelty_count
      FROM public.intel_event_stream s
      WHERE s.event_name = 'price.crowd_submitted'
        AND s.id < stream_row.id
        AND s.occurred_at >= stream_row.occurred_at - make_interval(hours => cfg_novelty_window_hours)
        AND lower(coalesce(s.payload ->> 'item_type', '')) = lower(coalesce(stream_row.payload ->> 'item_type', ''))
        AND lower(coalesce(s.payload ->> 'area', '')) = lower(coalesce(stream_row.payload ->> 'area', ''));

      IF novelty_count = 0 THEN
        novelty_score := 1;
      ELSIF novelty_count <= 2 THEN
        novelty_score := 0.75;
      ELSIF novelty_count <= 5 THEN
        novelty_score := 0.5;
      ELSE
        novelty_score := 0.3;
      END IF;

      SELECT percentile_disc(0.5) WITHIN GROUP (ORDER BY (s.payload ->> 'price_paid')::numeric)
      INTO median_price
      FROM public.intel_event_stream s
      WHERE s.event_name = 'price.crowd_submitted'
        AND s.id < stream_row.id
        AND s.occurred_at >= stream_row.occurred_at - interval '30 days'
        AND lower(coalesce(s.payload ->> 'item_type', '')) = lower(coalesce(stream_row.payload ->> 'item_type', ''))
        AND lower(coalesce(s.payload ->> 'area', '')) = lower(coalesce(stream_row.payload ->> 'area', ''))
        AND (s.payload ->> 'price_paid') ~ '^-?[0-9]+(\.[0-9]+)?$';

      IF price_paid_value IS NULL OR price_paid_value <= 0 THEN
        consistency_score := 0.3;
      ELSIF median_price IS NULL OR median_price <= 0 THEN
        consistency_score := 0.7;
      ELSE
        deviation_ratio := abs(price_paid_value - median_price) / greatest(median_price, 1);
        IF deviation_ratio <= cfg_consistency_soft_deviation THEN
          consistency_score := 1;
        ELSIF deviation_ratio <= cfg_consistency_hard_deviation THEN
          consistency_score := 0.6;
        ELSIF deviation_ratio <= (cfg_consistency_hard_deviation * 1.5) THEN
          consistency_score := 0.3;
        ELSE
          consistency_score := 0.1;
        END IF;
      END IF;

      weighted_score := round((0.4 * completeness_score + 0.3 * novelty_score + 0.3 * consistency_score)::numeric, 4);
      points_value := greatest(2, least(20, round((4 + weighted_score * 12))::integer));

      IF is_auth AND cfg_auth_low_consistency_pending AND consistency_score < 0.35 THEN
        status_value := 'pending';
        reason_code_value := 'crowd_submit_auth_low_consistency_pending_v2';
      END IF;

      review_not_before_value := CASE
        WHEN status_value = 'pending' THEN stream_row.occurred_at + make_interval(mins => cfg_pending_auto_verify_minutes)
        ELSE NULL
      END;
      verified_at_value := CASE WHEN status_value = 'verified' THEN now() ELSE NULL END;
      settled_at_value := verified_at_value;

      score_meta_value := jsonb_build_object(
        'advanced_enabled', true,
        'completeness_score', completeness_score,
        'novelty_score', novelty_score,
        'consistency_score', consistency_score,
        'weighted_score', weighted_score,
        'raw', jsonb_build_object(
          'price_paid', price_paid_value,
          'asking_price', asking_price_value,
          'quality_estimate', quality_estimate_value,
          'novelty_count_window', novelty_count,
          'median_price', median_price,
          'anon_verified_ratio', cfg_anon_verified_ratio
        )
      );
    END IF;

    INSERT INTO public.points_ledger (
      event_id,
      rule_version,
      subject_type,
      subject_id,
      user_id,
      session_id,
      points,
      status,
      reason_code,
      fingerprint,
      event_occurred_at,
      score_meta,
      review_not_before,
      verified_at,
      settled_at
    )
    VALUES (
      event_id_value,
      rule_version_value,
      subject_type_value,
      subject_id_value,
      CASE
        WHEN subject_type_value = 'user' THEN (stream_row.context ->> 'auth_user_id')::uuid
        ELSE NULL
      END,
      CASE
        WHEN subject_type_value = 'session' THEN coalesce(nullif(stream_row.session_id, ''), 'anonymous')
        ELSE NULL
      END,
      points_value,
      status_value,
      reason_code_value,
      fingerprint_value,
      stream_row.occurred_at,
      coalesce(score_meta_value, '{}'::jsonb),
      review_not_before_value,
      verified_at_value,
      settled_at_value
    )
    ON CONFLICT (event_id, rule_version) DO NOTHING;

    GET DIAGNOSTICS inserted_row_count = ROW_COUNT;
    IF inserted_row_count > 0 THEN
      inserted_count := inserted_count + inserted_row_count;
      IF rule_version_value = 'v2' THEN
        inserted_v2_count := inserted_v2_count + inserted_row_count;
      ELSE
        inserted_v1_count := inserted_v1_count + inserted_row_count;
      END IF;
    ELSE
      duplicate_count := duplicate_count + 1;
    END IF;
  END LOOP;

  IF max_stream_id IS NOT NULL THEN
    UPDATE public.points_projection_state
    SET last_stream_id = max_stream_id,
        updated_at = now()
    WHERE projector_name = projector;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'projector', projector,
    'safeLimit', safe_limit,
    'cursorBefore', cursor_id,
    'cursorAfter', coalesce(max_stream_id, cursor_id),
    'processedCount', processed_count,
    'insertedCount', inserted_count,
    'insertedV1Count', inserted_v1_count,
    'insertedV2Count', inserted_v2_count,
    'duplicateCount', duplicate_count,
    'advancedScoringEnabled', cfg_enable_advanced,
    'updatedAt', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_pending_points_v2(p_limit integer DEFAULT 500)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_limit integer := LEAST(GREATEST(COALESCE(p_limit, 500), 1), 5000);
  cfg_enable_advanced boolean := false;
  cfg_pending_auto_verify_minutes integer := 180;
  settled_count integer := 0;
BEGIN
  SELECT
    coalesce(enable_advanced_scoring, false),
    coalesce(pending_auto_verify_minutes, 180)
  INTO
    cfg_enable_advanced,
    cfg_pending_auto_verify_minutes
  FROM public.points_engine_config
  WHERE singleton = true
  LIMIT 1;

  IF NOT cfg_enable_advanced THEN
    RETURN jsonb_build_object(
      'ok', true,
      'skipped', true,
      'reason', 'advanced_scoring_disabled',
      'settledCount', 0,
      'safeLimit', safe_limit,
      'updatedAt', now()
    );
  END IF;

  WITH candidates AS (
    SELECT p.id
    FROM public.points_ledger p
    WHERE p.rule_version = 'v2'
      AND p.status = 'pending'
      AND p.event_occurred_at <= now() - make_interval(mins => cfg_pending_auto_verify_minutes)
      AND coalesce((p.score_meta ->> 'consistency_score')::numeric, 0) >= 0.35
      AND NOT EXISTS (
        SELECT 1
        FROM public.points_ledger p2
        WHERE p2.rule_version = p.rule_version
          AND p2.fingerprint = p.fingerprint
          AND p2.status = 'verified'
          AND p2.id <> p.id
      )
    ORDER BY p.event_occurred_at ASC
    LIMIT safe_limit
  ),
  updated AS (
    UPDATE public.points_ledger p
    SET status = 'verified',
        reason_code = CASE
          WHEN p.reason_code = 'crowd_submit_auth_low_consistency_pending_v2' THEN 'crowd_submit_auth_auto_verified_v2'
          ELSE 'crowd_submit_auto_verified_v2'
        END,
        verified_at = coalesce(p.verified_at, now()),
        settled_at = now()
    FROM candidates c
    WHERE p.id = c.id
    RETURNING p.id
  )
  SELECT count(*)::integer INTO settled_count
  FROM updated;

  RETURN jsonb_build_object(
    'ok', true,
    'skipped', false,
    'settledCount', settled_count,
    'safeLimit', safe_limit,
    'pendingAutoVerifyMinutes', cfg_pending_auto_verify_minutes,
    'updatedAt', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_points_engine_phase3_status_v1()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cfg record;
  v2_total bigint := 0;
  v2_verified bigint := 0;
  v2_pending bigint := 0;
  v2_rejected bigint := 0;
  v2_reversed bigint := 0;
  v2_pending_aged bigint := 0;
  v2_last_created_at timestamptz;
BEGIN
  SELECT
    singleton,
    enable_advanced_scoring,
    auth_low_consistency_pending,
    anon_verified_ratio,
    pending_auto_verify_minutes,
    novelty_window_hours,
    consistency_soft_deviation,
    consistency_hard_deviation,
    updated_at
  INTO cfg
  FROM public.points_engine_config
  WHERE singleton = true
  LIMIT 1;

  SELECT
    count(*) FILTER (WHERE rule_version = 'v2')::bigint,
    count(*) FILTER (WHERE rule_version = 'v2' AND status = 'verified')::bigint,
    count(*) FILTER (WHERE rule_version = 'v2' AND status = 'pending')::bigint,
    count(*) FILTER (WHERE rule_version = 'v2' AND status = 'rejected')::bigint,
    count(*) FILTER (WHERE rule_version = 'v2' AND status = 'reversed')::bigint,
    max(created_at) FILTER (WHERE rule_version = 'v2')
  INTO
    v2_total,
    v2_verified,
    v2_pending,
    v2_rejected,
    v2_reversed,
    v2_last_created_at
  FROM public.points_ledger;

  SELECT count(*)::bigint
  INTO v2_pending_aged
  FROM public.points_ledger
  WHERE rule_version = 'v2'
    AND status = 'pending'
    AND event_occurred_at <= now() - make_interval(mins => coalesce(cfg.pending_auto_verify_minutes, 180));

  RETURN jsonb_build_object(
    'ok', true,
    'config', jsonb_build_object(
      'enable_advanced_scoring', coalesce(cfg.enable_advanced_scoring, false),
      'auth_low_consistency_pending', coalesce(cfg.auth_low_consistency_pending, true),
      'anon_verified_ratio', coalesce(cfg.anon_verified_ratio, 0.2),
      'pending_auto_verify_minutes', coalesce(cfg.pending_auto_verify_minutes, 180),
      'novelty_window_hours', coalesce(cfg.novelty_window_hours, 24),
      'consistency_soft_deviation', coalesce(cfg.consistency_soft_deviation, 0.2),
      'consistency_hard_deviation', coalesce(cfg.consistency_hard_deviation, 0.6),
      'updated_at', cfg.updated_at
    ),
    'metrics', jsonb_build_object(
      'v2_total', v2_total,
      'v2_verified', v2_verified,
      'v2_pending', v2_pending,
      'v2_rejected', v2_rejected,
      'v2_reversed', v2_reversed,
      'v2_pending_aged', v2_pending_aged,
      'v2_last_created_at', v2_last_created_at
    )
  );
END;
$$;

ALTER TABLE public.points_engine_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_engine_config FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'points_engine_config'
      AND policyname = 'points_engine_config_service_role_all'
  ) THEN
    CREATE POLICY points_engine_config_service_role_all
      ON public.points_engine_config
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

REVOKE ALL ON TABLE public.points_engine_config FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.points_engine_config TO service_role;

REVOKE ALL ON FUNCTION public.settle_pending_points_v2(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settle_pending_points_v2(integer) TO service_role;

REVOKE ALL ON FUNCTION public.get_points_engine_phase3_status_v1() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_points_engine_phase3_status_v1() TO service_role;

COMMIT;
