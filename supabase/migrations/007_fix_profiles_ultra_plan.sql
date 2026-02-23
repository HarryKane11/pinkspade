-- =====================================================
-- Migration 007: Fix profiles plan constraint + credit_balances INSERT policy
-- =====================================================

-- 1. Allow 'ultra' in profiles.plan (was only free/pro/enterprise)
ALTER TABLE profiles
    DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE profiles
    ADD CONSTRAINT profiles_plan_check
    CHECK (plan IN ('free', 'pro', 'ultra', 'enterprise'));

-- 2. Add missing INSERT policy for credit_balances
-- (handle_new_user trigger runs as SECURITY DEFINER which bypasses RLS,
--  but direct client inserts and upserts need this policy)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'credit_balances'
          AND policyname = 'credit_balances_insert'
    ) THEN
        CREATE POLICY credit_balances_insert ON credit_balances
            FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
END $$;
