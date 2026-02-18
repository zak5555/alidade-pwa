-- Migration: Add verify_license_public RPC
-- Date: 2026-02-11
-- Description: Publicly accessible function to check availability of a license key without exposing user data.

CREATE OR REPLACE FUNCTION public.verify_license_public(p_license_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as creator (service_role) to bypass RLS on users table
AS $$
DECLARE
  v_exists boolean;
BEGIN
  -- Check if any user has this license key (Case Insensitive)
  SELECT EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE LOWER(REPLACE(license_key, '-', '')) = LOWER(REPLACE(TRIM(p_license_key), '-', ''))
  ) INTO v_exists;

  -- Return simple JSON object
  RETURN json_build_object('valid', v_exists);
END;
$$;

-- Grant access to everyone (Public/Anon and Logged in users)
GRANT EXECUTE ON FUNCTION public.verify_license_public(text) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.verify_license_public IS 'Checks if a license key exists (case-insensitive) without returning user data.';
