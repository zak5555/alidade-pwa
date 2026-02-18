-- Allow deterministic tier restoration for returning users by matching verified auth email.
-- This complements key-based activation when local pending state is unavailable.

BEGIN;

CREATE OR REPLACE FUNCTION public.sync_license_for_current_user_by_email()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_auth_email text;
  v_existing record;
  v_source record;
  v_target_tier text := 'basic';
  v_source_found boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT lower(trim(email))
  INTO v_auth_email
  FROM auth.users
  WHERE id = v_uid;

  IF v_auth_email IS NULL OR v_auth_email = '' THEN
    RETURN json_build_object('success', false, 'error', 'Authenticated user email not found');
  END IF;

  SELECT id, email, license_tier, license_key, gumroad_order_id, created_at
  INTO v_existing
  FROM public.users
  WHERE id = v_uid;

  SELECT id, email, license_tier, license_key, gumroad_order_id, created_at
  INTO v_source
  FROM public.users
  WHERE lower(trim(coalesce(email, ''))) = v_auth_email
  ORDER BY
    CASE
      WHEN lower(coalesce(license_tier, 'basic')) = 'ultimate' THEN 1
      ELSE 0
    END DESC,
    created_at DESC NULLS LAST
  LIMIT 1;

  v_source_found := v_source.id IS NOT NULL;

  IF lower(coalesce(v_existing.license_tier, '')) = 'ultimate'
     OR lower(coalesce(v_source.license_tier, '')) = 'ultimate' THEN
    v_target_tier := 'ultimate';
  ELSE
    v_target_tier := 'basic';
  END IF;

  INSERT INTO public.users (
    id,
    email,
    license_tier,
    license_key,
    gumroad_order_id,
    last_login,
    created_at
  )
  VALUES (
    v_uid,
    v_auth_email,
    v_target_tier,
    COALESCE(v_existing.license_key, v_source.license_key),
    COALESCE(v_existing.gumroad_order_id, v_source.gumroad_order_id),
    now(),
    COALESCE(v_existing.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    license_tier = CASE
      WHEN lower(coalesce(public.users.license_tier, 'basic')) = 'ultimate' THEN 'ultimate'
      ELSE EXCLUDED.license_tier
    END,
    license_key = COALESCE(public.users.license_key, EXCLUDED.license_key),
    gumroad_order_id = COALESCE(public.users.gumroad_order_id, EXCLUDED.gumroad_order_id),
    last_login = now();

  RETURN json_build_object(
    'success', true,
    'tier', v_target_tier,
    'source_found', v_source_found
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_license_for_current_user_by_email() TO authenticated, service_role;

COMMENT ON FUNCTION public.sync_license_for_current_user_by_email IS
'Restores or preserves the current user tier by matching verified auth email to stored purchases.';

COMMIT;
