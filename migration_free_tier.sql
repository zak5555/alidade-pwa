-- ================================================================================
-- ALIDADE™ | Feature Entitlement System - Database Migration
-- ================================================================================
-- هذا الملف يحول النظام من DEMO/LITE/ULTIMATE إلى FREE/LITE/ULTIMATE
-- مع الحفاظ على البيانات الموجودة
-- ================================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: إضافة FREE tier إلى feature_flags
-- ─────────────────────────────────────────────────────────────────────────────

-- إضافة عمود free_tier
ALTER TABLE feature_flags 
ADD COLUMN IF NOT EXISTS free_tier JSONB DEFAULT '{
  "access": true,
  "daily_limit": 3,
  "quality": "standard",
  "processing_priority": "low",
  "storage_days": 7
}'::jsonb;

-- تأكد من وجود الأعمدة الأخرى
ALTER TABLE feature_flags 
ADD COLUMN IF NOT EXISTS lite_tier JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ultimate_tier JSONB DEFAULT '{}'::jsonb;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: تحديث feature_flags للميزات الأساسية
-- ─────────────────────────────────────────────────────────────────────────────

-- AI Scanner Feature (الميزة الأساسية)
INSERT INTO feature_flags (feature_name, description, free_tier, lite_tier, ultimate_tier)
VALUES (
  'ai_scanner',
  'Core AI scanning functionality',
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
ON CONFLICT (feature_name) 
DO UPDATE SET
  free_tier = EXCLUDED.free_tier,
  lite_tier = EXCLUDED.lite_tier,
  ultimate_tier = EXCLUDED.ultimate_tier;

-- Advanced Filters Feature
INSERT INTO feature_flags (feature_name, description, free_tier, lite_tier, ultimate_tier)
VALUES (
  'advanced_filters',
  'Advanced image processing filters',
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
ON CONFLICT (feature_name) 
DO UPDATE SET
  free_tier = EXCLUDED.free_tier,
  lite_tier = EXCLUDED.lite_tier,
  ultimate_tier = EXCLUDED.ultimate_tier;

-- Batch Processing
INSERT INTO feature_flags (feature_name, description, free_tier, lite_tier, ultimate_tier)
VALUES (
  'batch_processing',
  'Process multiple items at once',
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
ON CONFLICT (feature_name) 
DO UPDATE SET
  free_tier = EXCLUDED.free_tier,
  lite_tier = EXCLUDED.lite_tier,
  ultimate_tier = EXCLUDED.ultimate_tier;

-- Export Options
INSERT INTO feature_flags (feature_name, description, free_tier, lite_tier, ultimate_tier)
VALUES (
  'export',
  'Export and download capabilities',
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
ON CONFLICT (feature_name) 
DO UPDATE SET
  free_tier = EXCLUDED.free_tier,
  lite_tier = EXCLUDED.lite_tier,
  ultimate_tier = EXCLUDED.ultimate_tier;

-- Storage & History
INSERT INTO feature_flags (feature_name, description, free_tier, lite_tier, ultimate_tier)
VALUES (
  'storage',
  'Cloud storage and history',
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
ON CONFLICT (feature_name) 
DO UPDATE SET
  free_tier = EXCLUDED.free_tier,
  lite_tier = EXCLUDED.lite_tier,
  ultimate_tier = EXCLUDED.ultimate_tier;

-- API Access
INSERT INTO feature_flags (feature_name, description, free_tier, lite_tier, ultimate_tier)
VALUES (
  'api_access',
  'Programmatic API access',
  '{
    "access": false,
    "reason": "API access available in ULTIMATE tier only"
  }'::jsonb,
  '{
    "access": false,
    "reason": "API access available in ULTIMATE tier only"
  }'::jsonb,
  '{
    "access": true,
    "rate_limit_per_minute": 100,
    "webhooks": true,
    "custom_endpoints": true
  }'::jsonb
)
ON CONFLICT (feature_name) 
DO UPDATE SET
  free_tier = EXCLUDED.free_tier,
  lite_tier = EXCLUDED.lite_tier,
  ultimate_tier = EXCLUDED.ultimate_tier;

-- Collaboration
INSERT INTO feature_flags (feature_name, description, free_tier, lite_tier, ultimate_tier)
VALUES (
  'collaboration',
  'Team sharing and collaboration',
  '{
    "access": false,
    "reason": "Collaboration available in ULTIMATE tier"
  }'::jsonb,
  '{
    "access": false,
    "reason": "Collaboration available in ULTIMATE tier"
  }'::jsonb,
  '{
    "access": true,
    "team_members": -1,
    "shared_workspaces": true,
    "role_management": true,
    "activity_logs": true
  }'::jsonb
)
ON CONFLICT (feature_name) 
DO UPDATE SET
  free_tier = EXCLUDED.free_tier,
  lite_tier = EXCLUDED.lite_tier,
  ultimate_tier = EXCLUDED.ultimate_tier;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: تحديث users table لدعم FREE tier
-- ─────────────────────────────────────────────────────────────────────────────

-- تأكد من أن license_tier يقبل 'free' كقيمة
-- (إذا كان هناك CHECK constraint قديم)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_license_tier_check;

-- إضافة constraint جديد
ALTER TABLE users 
ADD CONSTRAINT users_license_tier_check 
CHECK (license_tier IN ('free', 'lite', 'ultimate'));

-- تعيين DEFAULT tier إلى 'free' للمستخدمين الجدد
ALTER TABLE users 
ALTER COLUMN license_tier SET DEFAULT 'free';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Migration للمستخدمين الحاليين
-- ─────────────────────────────────────────────────────────────────────────────

-- تحويل المستخدمين القدامى بدون tier إلى FREE
UPDATE users 
SET license_tier = 'free' 
WHERE license_tier IS NULL OR license_tier = '';

-- إذا كان هناك tier قديم اسمه 'demo' → تحويله لـ 'free'
UPDATE users 
SET license_tier = 'free' 
WHERE license_tier = 'demo';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: إنشاء View لعرض Feature Matrix (مفيد للـ UI)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW feature_matrix AS
SELECT 
  feature_name,
  description,
  free_tier->>'access' as free_access,
  free_tier->>'daily_limit' as free_limit,
  lite_tier->>'access' as lite_access,
  lite_tier->>'daily_limit' as lite_limit,
  ultimate_tier->>'access' as ultimate_access,
  ultimate_tier->>'daily_limit' as ultimate_limit
FROM feature_flags
ORDER BY feature_name;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6: إنشاء Function للتحقق من الصلاحيات (من جانب السيرفر)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_feature_access(
  p_user_id UUID,
  p_feature_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_tier TEXT;
  v_daily_count INT;
  v_feature_config JSONB;
  v_tier_config JSONB;
  v_daily_limit INT;
BEGIN
  -- Get user's tier
  SELECT license_tier, daily_scans_count 
  INTO v_user_tier, v_daily_count
  FROM users 
  WHERE id = p_user_id;
  
  IF v_user_tier IS NULL THEN
    v_user_tier := 'free';
  END IF;
  
  -- Get feature config
  SELECT 
    CASE v_user_tier
      WHEN 'free' THEN free_tier
      WHEN 'lite' THEN lite_tier
      WHEN 'ultimate' THEN ultimate_tier
    END
  INTO v_tier_config
  FROM feature_flags
  WHERE feature_name = p_feature_name;
  
  IF v_tier_config IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'reason', 'Feature unrestricted'
    );
  END IF;
  
  -- Check access
  IF (v_tier_config->>'access')::boolean = false THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', COALESCE(v_tier_config->>'reason', 'Upgrade required'),
      'upgrade_to', CASE 
        WHEN v_user_tier = 'free' THEN 'lite'
        ELSE 'ultimate'
      END
    );
  END IF;
  
  -- Check daily limit
  v_daily_limit := (v_tier_config->>'daily_limit')::int;
  
  IF v_daily_limit IS NOT NULL AND v_daily_limit != -1 THEN
    IF v_daily_count >= v_daily_limit THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Daily limit reached',
        'current_usage', v_daily_count,
        'limit', v_daily_limit,
        'upgrade_to', CASE 
          WHEN v_user_tier = 'free' THEN 'lite'
          WHEN v_user_tier = 'lite' THEN 'ultimate'
          ELSE NULL
        END
      );
    END IF;
  END IF;
  
  -- Allowed
  RETURN jsonb_build_object(
    'allowed', true,
    'tier', v_user_tier,
    'config', v_tier_config,
    'current_usage', v_daily_count,
    'limit', v_daily_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7: Test Data (اختياري - للتجربة)
-- ─────────────────────────────────────────────────────────────────────────────

-- Test: Check if a FREE user can use ai_scanner
-- SELECT check_feature_access(
--   'your-user-uuid-here',
--   'ai_scanner'
-- );

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 8: إنشاء Indexes للأداء
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_license_tier 
ON users(license_tier);

CREATE INDEX IF NOT EXISTS idx_users_daily_scans 
ON users(license_tier, daily_scans_count);

CREATE INDEX IF NOT EXISTS idx_feature_flags_name 
ON feature_flags(feature_name);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 9: Comments للتوثيق
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN feature_flags.free_tier IS 
'FREE tier configuration: limited daily usage, standard quality, 7-day history';

COMMENT ON COLUMN feature_flags.lite_tier IS 
'LITE tier configuration: 50 daily scans, high quality, 30-day history, batch processing';

COMMENT ON COLUMN feature_flags.ultimate_tier IS 
'ULTIMATE tier configuration: unlimited scans, ultra quality, unlimited history, API access, collaboration';

COMMENT ON FUNCTION check_feature_access IS 
'Server-side feature access validation. Returns JSON with allowed status and tier config.';

-- ================================================================================
-- MIGRATION COMPLETE
-- ================================================================================
-- Next Steps:
-- 1. Run this migration on your Supabase project
-- 2. Update license-manager.js to handle 'free' tier
-- 3. Update UI to show tier differences
-- 4. Test with different user tiers
-- ================================================================================
