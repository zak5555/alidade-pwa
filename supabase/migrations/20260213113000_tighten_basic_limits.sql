-- Tighten BASIC/FREE entitlements to increase ULTIMATE upgrade pressure.
-- Keeps the 2-tier model (basic, ultimate) while preserving legacy free_tier compatibility.

BEGIN;

-- AI Scanner: very limited on BASIC/FREE.
UPDATE public.feature_flags
SET basic_tier = jsonb_set(
        jsonb_set(
            jsonb_set(COALESCE(basic_tier, '{}'::jsonb), '{daily_limit}', to_jsonb(1), true),
            '{history_days}', to_jsonb(1), true
        ),
        '{quality}', to_jsonb('basic'::text), true
    )
WHERE feature_name = 'ai_scanner';

UPDATE public.feature_flags
SET free_tier = jsonb_set(
        jsonb_set(
            jsonb_set(COALESCE(free_tier, '{}'::jsonb), '{daily_limit}', to_jsonb(1), true),
            '{history_days}', to_jsonb(1), true
        ),
        '{quality}', to_jsonb('basic'::text), true
    )
WHERE feature_name = 'ai_scanner';

-- Storage: keep history/storage tight on BASIC/FREE.
UPDATE public.feature_flags
SET basic_tier = jsonb_set(
        jsonb_set(COALESCE(basic_tier, '{}'::jsonb), '{storage_mb}', to_jsonb(50), true),
        '{history_days}', to_jsonb(1), true
    )
WHERE feature_name = 'storage';

UPDATE public.feature_flags
SET free_tier = jsonb_set(
        jsonb_set(COALESCE(free_tier, '{}'::jsonb), '{storage_mb}', to_jsonb(50), true),
        '{history_days}', to_jsonb(1), true
    )
WHERE feature_name = 'storage';

-- Export: PNG only and basic quality for BASIC/FREE.
UPDATE public.feature_flags
SET basic_tier = jsonb_set(
        jsonb_set(
            jsonb_set(COALESCE(basic_tier, '{}'::jsonb), '{formats}', jsonb_build_array('png'), true),
            '{quality}', to_jsonb('basic'::text), true
        ),
        '{reason}', to_jsonb('Upgrade to ULTIMATE for advanced exports'::text), true
    )
WHERE feature_name = 'export';

UPDATE public.feature_flags
SET free_tier = jsonb_set(
        jsonb_set(
            jsonb_set(COALESCE(free_tier, '{}'::jsonb), '{formats}', jsonb_build_array('png'), true),
            '{quality}', to_jsonb('basic'::text), true
        ),
        '{reason}', to_jsonb('Upgrade to ULTIMATE for advanced exports'::text), true
    )
WHERE feature_name = 'export';

-- Batch processing: disabled on BASIC/FREE.
UPDATE public.feature_flags
SET basic_tier = jsonb_set(
        jsonb_set(COALESCE(basic_tier, '{}'::jsonb), '{max_batch_size}', to_jsonb(0), true),
        '{reason}', to_jsonb('Upgrade to ULTIMATE for batch processing'::text), true
    )
WHERE feature_name = 'batch_processing';

UPDATE public.feature_flags
SET free_tier = jsonb_set(
        jsonb_set(COALESCE(free_tier, '{}'::jsonb), '{max_batch_size}', to_jsonb(0), true),
        '{reason}', to_jsonb('Upgrade to ULTIMATE for batch processing'::text), true
    )
WHERE feature_name = 'batch_processing';

-- Advanced filters: disabled on BASIC/FREE.
UPDATE public.feature_flags
SET basic_tier = jsonb_set(
        jsonb_set(
            jsonb_set(COALESCE(basic_tier, '{}'::jsonb), '{access}', to_jsonb(false), true),
            '{presets}', to_jsonb(0), true
        ),
        '{reason}', to_jsonb('Upgrade to ULTIMATE for advanced filters'::text), true
    )
WHERE feature_name = 'advanced_filters';

UPDATE public.feature_flags
SET free_tier = jsonb_set(
        jsonb_set(
            jsonb_set(COALESCE(free_tier, '{}'::jsonb), '{access}', to_jsonb(false), true),
            '{presets}', to_jsonb(0), true
        ),
        '{reason}', to_jsonb('Upgrade to ULTIMATE for advanced filters'::text), true
    )
WHERE feature_name = 'advanced_filters';

COMMIT;
