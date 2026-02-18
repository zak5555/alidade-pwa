-- Two-tier normalization: BASIC + ULTIMATE only
-- Converts legacy FREE/LITE/DEMO users into BASIC and tightens BASIC entitlements.

BEGIN;

-- 1) Normalize users.license_tier values
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_license_tier_check;

UPDATE public.users
SET license_tier = 'basic'
WHERE license_tier IS NULL
   OR btrim(license_tier) = ''
   OR lower(license_tier) IN ('free', 'lite', 'demo', 'basic');

UPDATE public.users
SET license_tier = 'ultimate'
WHERE lower(license_tier) = 'ultimate';

ALTER TABLE public.users
  ALTER COLUMN license_tier SET DEFAULT 'basic';

ALTER TABLE public.users
  ADD CONSTRAINT users_license_tier_check
  CHECK (license_tier = ANY (ARRAY['basic'::text, 'ultimate'::text]));

-- 2) Collapse BASIC tier to conservative limits (start from FREE config)
UPDATE public.feature_flags
SET basic_tier = COALESCE(free_tier, basic_tier);

-- 3) Make BASIC stricter for scanner/history to drive ULTIMATE upgrades
UPDATE public.feature_flags
SET basic_tier = jsonb_build_object(
    'access', true,
    'quality', 'standard',
    'batch_size', 1,
    'daily_limit', 2,
    'history_days', 3,
    'export_formats', jsonb_build_array('png'),
    'max_file_size_mb', 5,
    'processing_priority', 'low'
)
WHERE feature_name = 'ai_scanner';

UPDATE public.feature_flags
SET free_tier = jsonb_build_object(
    'access', true,
    'quality', 'standard',
    'batch_size', 1,
    'daily_limit', 2,
    'history_days', 3,
    'export_formats', jsonb_build_array('png'),
    'max_file_size_mb', 5,
    'processing_priority', 'low'
)
WHERE feature_name = 'ai_scanner';

-- 4) Remove legacy LITE wording from upgrade reasons
UPDATE public.feature_flags
SET basic_tier = jsonb_set(
        basic_tier,
        '{reason}',
        to_jsonb(
            replace(
                replace(COALESCE(basic_tier->>'reason', 'Upgrade to ULTIMATE to unlock this feature'), 'LITE', 'ULTIMATE'),
                'lite',
                'ultimate'
            )
        ),
        true
    )
WHERE basic_tier ? 'reason';

UPDATE public.feature_flags
SET free_tier = jsonb_set(
        free_tier,
        '{reason}',
        to_jsonb(
            replace(
                replace(COALESCE(free_tier->>'reason', 'Upgrade to ULTIMATE to unlock this feature'), 'LITE', 'ULTIMATE'),
                'lite',
                'ultimate'
            )
        ),
        true
    )
WHERE free_tier ? 'reason';

COMMIT;
