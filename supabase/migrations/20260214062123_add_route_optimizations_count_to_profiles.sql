-- Track total Logistics route optimizations per authenticated profile.

BEGIN;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS route_optimizations_count integer NOT NULL DEFAULT 0;

UPDATE public.profiles
SET route_optimizations_count = 0
WHERE route_optimizations_count IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'profiles'
          AND policyname = 'profiles_own_insert'
    ) THEN
        CREATE POLICY profiles_own_insert
            ON public.profiles
            FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = id);
    END IF;
END
$$;

COMMIT;
