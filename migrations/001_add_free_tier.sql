-- ================================================================================
-- ALIDADE™ | Feature Entitlement System — Production Migration
-- ================================================================================
-- Migration:  001_add_free_tier
-- Date:       2026-02-12
-- Purpose:    Materialize the FREE/LITE/ULTIMATE tier architecture into
--             feature_flags and users.  Renames legacy `basic_tier` column
--             to `lite_tier`, updates the CHECK constraint, seeds all feature
--             flag rows with granular per-tier JSONB configs, and creates the
--             server-side `check_feature_access()` RPC.
--
-- Rollback strategy:
--   ALTER TABLE feature_flags RENAME COLUMN lite_tier TO basic_tier;
--   (reverse each step in order)
-- ================================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Schema Evolution — Rename basic_tier → lite_tier
-- ─────────────────────────────────────────────────────────────────────────────
-- The existing column is `basic_tier`.  Strategy doc standardises on LITE.

ALTER TABLE public.feature_flags
  RENAME COLUMN basic_tier TO lite_tier;

-- Ensure free_tier column exists (idempotent)
ALTER TABLE public.feature_flags
  ADD COLUMN IF NOT EXISTS free_tier JSONB DEFAULT '{"access": true, "daily_limit": 3, "quality": "standard"}'::jsonb;

-- Ensure lite_tier and ultimate_tier have sensible defaults
ALTER TABLE public.feature_flags
  ALTER COLUMN lite_tier SET DEFAULT '{}'::jsonb,
  ALTER COLUMN ultimate_tier SET DEFAULT '{}'::jsonb;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Seed Feature Flag Configurations
-- ─────────────────────────────────────────────────────────────────────────────
-- Uses UPSERT (INSERT ... ON CONFLICT) so this migration is re-runnable.

-- ── 2a) ai_scanner ──────────────────────────────────────────────────────────
INSERT INTO public.feature_flags (feature_name, free_tier, lite_tier, ultimate_tier)
VALUES (
  'ai_scanner',
  '{
    "access": true,
    "daily_limit": 3,
    "quality": "standard",
    "processing_priority": "low",
    "max_file_size_mb": 5,
    "export_formats": ["png"],
    "history_days": 7,
    "batch_size": 1
  }'::jsonb,
  '{
    "access": true,
    "daily_limit": 50,
    "quality": "high",
    "processing_priority": "normal",
    "max_file_size_mb": 25,
    "export_formats": ["png", "jpg", "pdf"],
    "history_days": 30,
    "batch_size": 5
  }'::jsonb,
  '{
    "access": true,
    "daily_limit": -1,
    "quality": "ultra",
    "processing_priority": "high",
    "max_file_size_mb": 100,
    "export_formats": ["png", "jpg", "pdf", "svg", "raw"],
    "history_days": -1,
    "batch_size": -1,
    "api_access": true
  }'::jsonb
)
ON CONFLICT (feature_name) DO UPDATE SET
  free_tier     = EXCLUDED.free_tier,
  lite_tier     = EXCLUDED.lite_tier,
  ultimate_tier = EXCLUDED.ultimate_tier;

-- ── 2b) advanced_filters ───────────────────────────────────────────────────
INSERT INTO public.feature_flags (feature_name, free_tier, lite_tier, ultimate_tier)
VALUES (
  'advanced_filters',
  '{
    "access": false,
    "reason": "Upgrade to LITE to unlock advanced filters"
  }'::jsonb,
  '{
    "access": true,
    "available_filters": ["sharpen", "denoise", "enhance", "auto_correct"],
    "custom_presets": 5
  }'::jsonb,
  '{
    "access": true,
    "available_filters": "all",
    "custom_presets": -1,
    "ai_powered_filters": true
  }'::jsonb
)
ON CONFLICT (feature_name) DO UPDATE SET
  free_tier     = EXCLUDED.free_tier,
  lite_tier     = EXCLUDED.lite_tier,
  ultimate_tier = EXCLUDED.ultimate_tier;

-- ── 2c) batch_processing ───────────────────────────────────────────────────
INSERT INTO public.feature_flags (feature_name, free_tier, lite_tier, ultimate_tier)
VALUES (
  'batch_processing',
  '{
    "access": false,
    "reason": "Upgrade to LITE for batch processing"
  }'::jsonb,
  '{
    "access": true,
    "max_batch_size": 5,
    "parallel_processing": false
  }'::jsonb,
  '{
    "access": true,
    "max_batch_size": -1,
    "parallel_processing": true,
    "auto_queue": true
  }'::jsonb
)
ON CONFLICT (feature_name) DO UPDATE SET
  free_tier     = EXCLUDED.free_tier,
  lite_tier     = EXCLUDED.lite_tier,
  ultimate_tier = EXCLUDED.ultimate_tier;

-- ── 2d) export ─────────────────────────────────────────────────────────────
INSERT INTO public.feature_flags (feature_name, free_tier, lite_tier, ultimate_tier)
VALUES (
  'export',
  '{
    "access": true,
    "formats": ["png"],
    "quality": "standard",
    "max_resolution": "1920x1080"
  }'::jsonb,
  '{
    "access": true,
    "formats": ["png", "jpg", "pdf"],
    "quality": "high",
    "max_resolution": "4096x4096"
  }'::jsonb,
  '{
    "access": true,
    "formats": ["png", "jpg", "pdf", "svg", "raw", "psd"],
    "quality": "ultra",
    "max_resolution": "unlimited",
    "watermark_removal": true
  }'::jsonb
)
ON CONFLICT (feature_name) DO UPDATE SET
  free_tier     = EXCLUDED.free_tier,
  lite_tier     = EXCLUDED.lite_tier,
  ultimate_tier = EXCLUDED.ultimate_tier;

-- ── 2e) api_access ─────────────────────────────────────────────────────────
INSERT INTO public.feature_flags (feature_name, free_tier, lite_tier, ultimate_tier)
VALUES (
  'api_access',
  '{
    "access": false,
    "reason": "API access is available in the ULTIMATE tier"
  }'::jsonb,
  '{
    "access": false,
    "reason": "API access is available in the ULTIMATE tier"
  }'::jsonb,
  '{
    "access": true,
    "rate_limit_per_minute": 100,
    "webhooks": true,
    "custom_endpoints": true
  }'::jsonb
)
ON CONFLICT (feature_name) DO UPDATE SET
  free_tier     = EXCLUDED.free_tier,
  lite_tier     = EXCLUDED.lite_tier,
  ultimate_tier = EXCLUDED.ultimate_tier;

-- ── 2f) storage ────────────────────────────────────────────────────────────
INSERT INTO public.feature_flags (feature_name, free_tier, lite_tier, ultimate_tier)
VALUES (
  'storage',
  '{
    "access": true,
    "storage_mb": 50,
    "history_days": 7,
    "auto_delete": true
  }'::jsonb,
  '{
    "access": true,
    "storage_mb": 5000,
    "history_days": 30,
    "auto_delete": true
  }'::jsonb,
  '{
    "access": true,
    "storage_mb": -1,
    "history_days": -1,
    "auto_delete": false,
    "archive_access": true
  }'::jsonb
)
ON CONFLICT (feature_name) DO UPDATE SET
  free_tier     = EXCLUDED.free_tier,
  lite_tier     = EXCLUDED.lite_tier,
  ultimate_tier = EXCLUDED.ultimate_tier;

-- ── 2g) collaboration ──────────────────────────────────────────────────────
INSERT INTO public.feature_flags (feature_name, free_tier, lite_tier, ultimate_tier)
VALUES (
  'collaboration',
  '{
    "access": false,
    "reason": "Collaboration is available in the ULTIMATE tier"
  }'::jsonb,
  '{
    "access": false,
    "reason": "Collaboration is available in the ULTIMATE tier"
  }'::jsonb,
  '{
    "access": true,
    "team_members": -1,
    "shared_workspaces": true,
    "role_management": true,
    "activity_logs": true
  }'::jsonb
)
ON CONFLICT (feature_name) DO UPDATE SET
  free_tier     = EXCLUDED.free_tier,
  lite_tier     = EXCLUDED.lite_tier,
  ultimate_tier = EXCLUDED.ultimate_tier;

-- ── 2h) offline_maps (preserve existing row, enrich with full config) ─────
INSERT INTO public.feature_flags (feature_name, free_tier, lite_tier, ultimate_tier)
VALUES (
  'offline_maps',
  '{
    "access": true,
    "region_limit": 1,
    "download_speed": "standard",
    "auto_sync": false
  }'::jsonb,
  '{
    "access": true,
    "region_limit": 5,
    "download_speed": "fast",
    "auto_sync": false
  }'::jsonb,
  '{
    "access": true,
    "region_limit": -1,
    "download_speed": "max",
    "auto_sync": true
  }'::jsonb
)
ON CONFLICT (feature_name) DO UPDATE SET
  free_tier     = EXCLUDED.free_tier,
  lite_tier     = EXCLUDED.lite_tier,
  ultimate_tier = EXCLUDED.ultimate_tier;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Users Table — Constraint & Default
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the old constraint and create the canonical one
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_license_tier_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_license_tier_check
  CHECK (license_tier = ANY (ARRAY['free'::text, 'lite'::text, 'ultimate'::text]));

-- Default for new sign-ups
ALTER TABLE public.users
  ALTER COLUMN license_tier SET DEFAULT 'free';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Data Migration — Legacy users
-- ─────────────────────────────────────────────────────────────────────────────

-- NULL or empty tier → free
UPDATE public.users
SET license_tier = 'free'
WHERE license_tier IS NULL OR license_tier = '';

-- Legacy 'demo' tier → free
UPDATE public.users
SET license_tier = 'free'
WHERE LOWER(license_tier) = 'demo';

-- Legacy 'basic' tier → lite  (column was renamed, now align the data)
UPDATE public.users
SET license_tier = 'lite'
WHERE LOWER(license_tier) = 'basic';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Server-side RPC — check_feature_access()
-- ─────────────────────────────────────────────────────────────────────────────
-- Called by the client or Edge Functions to gate features.
-- Returns JSONB: { allowed, tier, config, current_usage, limit, reason, upgrade_to }

CREATE OR REPLACE FUNCTION public.check_feature_access(
  p_user_id      UUID,
  p_feature_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_tier   TEXT;
  v_daily_count INT;
  v_tier_config JSONB;
  v_daily_limit INT;
BEGIN
  -- 1. Resolve the caller's tier
  SELECT license_tier, COALESCE(daily_scans_count, 0)
    INTO v_user_tier, v_daily_count
    FROM public.users
   WHERE id = p_user_id;

  IF v_user_tier IS NULL THEN
    v_user_tier   := 'free';
    v_daily_count := 0;
  END IF;

  -- 2. Fetch the per-tier config from feature_flags
  SELECT CASE v_user_tier
           WHEN 'free'     THEN free_tier
           WHEN 'lite'     THEN lite_tier
           WHEN 'ultimate' THEN ultimate_tier
           ELSE free_tier  -- safe fallback
         END
    INTO v_tier_config
    FROM public.feature_flags
   WHERE feature_name = p_feature_name;

  -- Feature not registered → unrestricted
  IF v_tier_config IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'reason',  'Feature not registered in feature_flags'
    );
  END IF;

  -- 3. Access gate
  IF (v_tier_config ->> 'access')::boolean IS DISTINCT FROM true THEN
    RETURN jsonb_build_object(
      'allowed',    false,
      'reason',     COALESCE(v_tier_config ->> 'reason', 'Upgrade required'),
      'tier',       v_user_tier,
      'upgrade_to', CASE
                      WHEN v_user_tier = 'free' THEN 'lite'
                      ELSE 'ultimate'
                    END
    );
  END IF;

  -- 4. Daily-limit gate (skip when limit = -1 = unlimited)
  v_daily_limit := (v_tier_config ->> 'daily_limit')::int;

  IF v_daily_limit IS NOT NULL AND v_daily_limit != -1 THEN
    IF v_daily_count >= v_daily_limit THEN
      RETURN jsonb_build_object(
        'allowed',       false,
        'reason',        'Daily limit reached',
        'tier',          v_user_tier,
        'current_usage', v_daily_count,
        'limit',         v_daily_limit,
        'upgrade_to',    CASE
                           WHEN v_user_tier = 'free' THEN 'lite'
                           WHEN v_user_tier = 'lite'  THEN 'ultimate'
                           ELSE NULL
                         END
      );
    END IF;
  END IF;

  -- 5. Access granted
  RETURN jsonb_build_object(
    'allowed',       true,
    'tier',          v_user_tier,
    'config',        v_tier_config,
    'current_usage', v_daily_count,
    'limit',         v_daily_limit
  );
END;
$$;

-- Grant execute to all roles the client might use
GRANT EXECUTE ON FUNCTION public.check_feature_access(UUID, TEXT)
  TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6: Feature Matrix View  (handy for dashboards & debugging)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.feature_matrix AS
SELECT
  feature_name,
  free_tier     ->> 'access'      AS free_access,
  free_tier     ->> 'daily_limit' AS free_limit,
  free_tier     ->> 'quality'     AS free_quality,
  lite_tier     ->> 'access'      AS lite_access,
  lite_tier     ->> 'daily_limit' AS lite_limit,
  lite_tier     ->> 'quality'     AS lite_quality,
  ultimate_tier ->> 'access'      AS ultimate_access,
  ultimate_tier ->> 'daily_limit' AS ultimate_limit,
  ultimate_tier ->> 'quality'     AS ultimate_quality
FROM public.feature_flags
ORDER BY feature_name;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7: Indexes for Performance
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_license_tier
  ON public.users (license_tier);

CREATE INDEX IF NOT EXISTS idx_users_tier_scans
  ON public.users (license_tier, daily_scans_count);

CREATE INDEX IF NOT EXISTS idx_feature_flags_name
  ON public.feature_flags (feature_name);

-- GIN indexes for JSONB containment queries (e.g. @> '{"access":true}')
CREATE INDEX IF NOT EXISTS idx_ff_free_tier_gin
  ON public.feature_flags USING gin (free_tier);

CREATE INDEX IF NOT EXISTS idx_ff_lite_tier_gin
  ON public.feature_flags USING gin (lite_tier);

CREATE INDEX IF NOT EXISTS idx_ff_ultimate_tier_gin
  ON public.feature_flags USING gin (ultimate_tier);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 8: Documentation Comments
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN public.feature_flags.free_tier IS
  'FREE tier: limited daily usage (3), standard quality, 7-day history, PNG export only.';

COMMENT ON COLUMN public.feature_flags.lite_tier IS
  'LITE tier: 50 daily scans, high quality, 30-day history, batch processing (5), PNG/JPG/PDF.';

COMMENT ON COLUMN public.feature_flags.ultimate_tier IS
  'ULTIMATE tier: unlimited scans, ultra quality, unlimited history, API access, all formats, collaboration.';

COMMENT ON FUNCTION public.check_feature_access IS
  'Server-side feature entitlement check. Returns JSONB with allowed status, tier config, usage, and upgrade path.';

COMMENT ON VIEW public.feature_matrix IS
  'Read-only matrix of per-tier access and limits for all registered features.';

COMMIT;

-- ================================================================================
-- POST-MIGRATION VERIFICATION (run manually)
-- ================================================================================
--
-- 1. Verify feature_flags columns:
--    SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'feature_flags' ORDER BY ordinal_position;
--
-- 2. Verify feature matrix:
--    SELECT * FROM feature_matrix;
--
-- 3. Test access check for a free user:
--    SELECT check_feature_access('<user-uuid>', 'ai_scanner');
--
-- 4. Verify no 'basic' or 'demo' users remain:
--    SELECT license_tier, COUNT(*) FROM users GROUP BY license_tier;
-- ================================================================================
