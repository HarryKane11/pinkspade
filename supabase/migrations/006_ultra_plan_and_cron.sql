-- =====================================================
-- Migration 006: Add ultra plan + monthly cron setup
-- =====================================================

-- Add ultra to plan check constraint
ALTER TABLE credit_balances
    DROP CONSTRAINT IF EXISTS credit_balances_plan_check;

ALTER TABLE credit_balances
    ADD CONSTRAINT credit_balances_plan_check
    CHECK (plan IN ('free', 'pro', 'ultra', 'enterprise'));

-- Fix the reset_monthly_credits function to avoid double-logging
-- (the original logs BEFORE updating, causing stale data)
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS INTEGER AS $$
DECLARE
    affected INTEGER;
BEGIN
    -- Log resets in ledger FIRST for users whose reset_at has passed
    INSERT INTO credit_ledger (user_id, amount, type, description)
    SELECT
        user_id,
        monthly_quota - balance,
        'monthly_reset',
        'Monthly credit reset to ' || monthly_quota || ' credits'
    FROM credit_balances
    WHERE reset_at <= NOW();

    -- Reset balances for users whose reset_at has passed
    UPDATE credit_balances
    SET
        balance = monthly_quota,
        reset_at = date_trunc('month', NOW()) + INTERVAL '1 month'
    WHERE reset_at <= NOW();

    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
