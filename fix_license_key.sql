-- Instructions:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this code and Run it.
-- 3. This will forcefully set your license key to the one you expect.

UPDATE public.users
SET license_key = '58D6EC2D-8AC5464E-ACF3A37F-5A3A5549'
WHERE email = 'alidade.ops@gmail.com';

-- Verify the update immediately
SELECT email, license_key FROM public.users WHERE email = 'alidade.ops@gmail.com';
