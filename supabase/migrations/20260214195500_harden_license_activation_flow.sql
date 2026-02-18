-- Harden license activation and make Ultimate tier persistence deterministic.
-- 1) verify_license_public now returns tier along with validity
-- 2) activate_license_for_current_user binds a validated license to the signed-in user

BEGIN;

CREATE OR REPLACE FUNCTION public.verify_license_public(p_license_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row record;
  v_tier text;
BEGIN
  SELECT id, license_tier
  INTO v_row
  FROM public.users
  WHERE lower(replace(coalesce(license_key, ''), '-', ''))
      = lower(replace(trim(coalesce(p_license_key, '')), '-', ''))
  LIMIT 1;

  IF v_row.id IS NULL THEN
    RETURN json_build_object('valid', false);
  END IF;

  v_tier := CASE lower(coalesce(v_row.license_tier, 'basic'))
      WHEN 'ultimate' THEN 'ultimate'
      ELSE 'basic'
  END;

  RETURN json_build_object(
    'valid', true,
    'tier', v_tier
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_license_public(text) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.verify_license_public IS
'Verifies license key existence and returns normalized tier without exposing owner data.';

CREATE OR REPLACE FUNCTION public.activate_license_for_current_user(
  key_input text,
  purchase_email_input text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_auth_email text;
  v_purchase_email text := lower(trim(coalesce(purchase_email_input, '')));
  v_key_norm text := lower(replace(trim(coalesce(key_input, '')), '-', ''));
  v_source record;
  v_target_tier text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF v_key_norm = '' THEN
    RETURN json_build_object('success', false, 'error', 'License key is required');
  END IF;

  IF v_purchase_email = '' THEN
    RETURN json_build_object('success', false, 'error', 'Purchase email is required');
  END IF;

  SELECT email
  INTO v_auth_email
  FROM auth.users
  WHERE id = v_uid;

  IF v_auth_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authenticated user email not found');
  END IF;

  v_auth_email := lower(trim(v_auth_email));
  IF v_auth_email <> v_purchase_email THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Purchase email must match signed-in account email'
    );
  END IF;

  SELECT id, email, license_tier, license_key, gumroad_order_id
  INTO v_source
  FROM public.users
  WHERE lower(replace(coalesce(license_key, ''), '-', '')) = v_key_norm
    AND lower(trim(coalesce(email, ''))) = v_purchase_email
  LIMIT 1;

  IF v_source.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'License key and purchase email do not match'
    );
  END IF;

  v_target_tier := CASE lower(coalesce(v_source.license_tier, 'basic'))
    WHEN 'ultimate' THEN 'ultimate'
    ELSE 'basic'
  END;

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
    v_source.license_key,
    v_source.gumroad_order_id,
    now(),
    now()
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

  RETURN json_build_object('success', true, 'tier', v_target_tier);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_license_for_current_user(text, text) TO authenticated, service_role;

COMMENT ON FUNCTION public.activate_license_for_current_user IS
'Binds a validated license key to the currently authenticated user (idempotent for same email/key).';

COMMIT;
