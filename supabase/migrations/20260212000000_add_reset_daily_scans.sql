-- Function to reset daily scans if needed
-- Ideally called by a scheduled trigger, but can be called by client check

CREATE OR REPLACE FUNCTION public.reset_daily_scans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_reset_at timestamptz;
BEGIN
  v_user_id := auth.uid();
  
  -- Get current reset time
  SELECT daily_scans_reset_at INTO v_reset_at
  FROM public.users
  WHERE id = v_user_id;

  -- If reset time is in the past (or null), reset count and set next reset time
  IF v_reset_at IS NULL OR NOW() > v_reset_at THEN
    UPDATE public.users
    SET daily_scans_count = 0,
        daily_scans_reset_at = (CURRENT_DATE + 1) -- Tomorrow at 00:00 UTC (approx)
    WHERE id = v_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_daily_scans() TO authenticated;
