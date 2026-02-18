
-- 1. Check if RLS is enabled on users
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'users';

-- 2. List existing policies on users
SELECT * FROM pg_policies WHERE tablename = 'users';

-- 3. [FIX] Ensure RLS is ON and the Policy exists
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting old policies to be safe
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create crucial SELECT policy
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Create UPDATE policy (needed for license key updates!)
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- Just in case, confirm what column is the primary key (id or user_id)
-- We assume 'id' based on previous context, but this query confirms it
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
